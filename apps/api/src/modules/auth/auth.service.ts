// 📍 /apps/api/src/modules/auth/auth.service.ts
//
// All auth business logic lives here. Controller stays thin.
//
// Token model:
//   • Access token  — 15m, contains { sub, role, type: "access" }
//   • Refresh token — 7d,  contains { sub, sid,  type: "refresh" }
//   • Refresh tokens are hashed (SHA-256) in DB → DB leak = safe
//   • Every refresh ROTATES the session (delete old, insert new)

import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { UserStatus } from "@prisma/client";
import * as argon2 from "argon2";
import { createHash, randomUUID } from "node:crypto";
import { PrismaService } from "../prisma/prisma.service";
import type { LoginDto, RegisterDto } from "./dto";
import type { JwtAccessPayload, JwtRefreshPayload } from "./interfaces/jwt-payload.interface";

/** Public user object — never contains passwordHash or internal fields. */
export interface PublicUser {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: "USER" | "MODERATOR" | "SUPER_ADMIN";
  status: "ACTIVE" | "SUSPENDED" | "PENDING_VERIFICATION";
  emailVerified: boolean;
  phoneVerified: boolean;
  avatarUrl: string | null;
}

export interface IssuedTokens {
  accessToken: string;
  refreshToken: string;
  accessExpiresAt: Date;
  refreshExpiresAt: Date;
}

export interface AuthResult {
  user: PublicUser;
  tokens: IssuedTokens;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  // ────────────────────────────────────────────────────────
  // REGISTER
  // ────────────────────────────────────────────────────────
  async register(
    dto: RegisterDto,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<AuthResult> {
    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException("Password and confirm password do not match");
    }

    const phone = dto.phone.trim();
    const email = dto.email?.trim().toLowerCase() || null;

    // Uniqueness checks
    const [existingPhone, existingEmail] = await Promise.all([
      this.prisma.user.findUnique({ where: { phone } }),
      email ? this.prisma.user.findUnique({ where: { email } }) : Promise.resolve(null),
    ]);
    if (existingPhone) throw new ConflictException("This phone number is already registered");
    if (existingEmail) throw new ConflictException("This email is already registered");

    const passwordHash = await argon2.hash(dto.password, { type: argon2.argon2id });

    const user = await this.prisma.user.create({
      data: {
        name: dto.name.trim(),
        phone,
        email,
        passwordHash,
        // Allow immediate login — phone/email verification happens in Phase 5
        status: UserStatus.ACTIVE,
        emailVerified: false,
        phoneVerified: false,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        emailVerified: true,
        phoneVerified: true,
        avatarUrl: true,
      },
    });

    const tokens = await this.issueSession(user.id, user.role, userAgent, ipAddress);

    this.logger.log(`New user registered: ${phone}`);
    return { user, tokens };
  }

  // ────────────────────────────────────────────────────────
  // LOGIN
  // ────────────────────────────────────────────────────────
  async login(
    dto: LoginDto,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<AuthResult> {
    const identifier = dto.identifier.trim();
    const isPhone = /^01[3-9]\d{8}$/.test(identifier);

    const user = await this.prisma.user.findFirst({
      where: isPhone ? { phone: identifier } : { email: identifier.toLowerCase() },
    });

    // Generic error — never reveal whether the identifier exists
    if (!user || !user.passwordHash) {
      await this.fakeVerify();
      throw new UnauthorizedException("Invalid credentials");
    }

    const passwordOk = await argon2.verify(user.passwordHash, dto.password);
    if (!passwordOk) {
      throw new UnauthorizedException("Invalid credentials");
    }

    if (user.status === UserStatus.SUSPENDED) {
      throw new UnauthorizedException("Account is suspended. Please contact support.");
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const tokens = await this.issueSession(user.id, user.role, userAgent, ipAddress);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status,
        emailVerified: user.emailVerified,
        phoneVerified: user.phoneVerified,
        avatarUrl: user.avatarUrl,
      },
      tokens,
    };
  }

  // ────────────────────────────────────────────────────────
  // REFRESH (rotate)
  // ────────────────────────────────────────────────────────
  async refresh(
    userId: string,
    sessionId: string,
    rawRefreshToken: string,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<AuthResult> {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
            status: true,
            emailVerified: true,
            phoneVerified: true,
            avatarUrl: true,
          },
        },
      },
    });

    // Every failure path → generic UnauthorizedException
    if (!session) throw new UnauthorizedException("Session not found");
    if (session.userId !== userId) throw new UnauthorizedException("Session mismatch");
    if (session.expiresAt < new Date()) {
      await this.prisma.session.delete({ where: { id: session.id } }).catch(() => undefined);
      throw new UnauthorizedException("Session expired");
    }
    if (session.user.status === UserStatus.SUSPENDED) {
      throw new UnauthorizedException("Account is suspended");
    }

    const providedHash = this.hashToken(rawRefreshToken);
    if (!this.constantTimeEqual(session.tokenHash, providedHash)) {
      // Suspicious: valid JWT but wrong token hash → nuke the session
      await this.prisma.session.delete({ where: { id: session.id } }).catch(() => undefined);
      throw new UnauthorizedException("Invalid refresh token");
    }

    // Atomic rotation: delete old, insert new
    const newTokens = await this.buildTokensForRotation(
      userId,
      session.user.role,
      userAgent,
      ipAddress,
      session.id,
    );

    return { user: session.user, tokens: newTokens };
  }

  // ────────────────────────────────────────────────────────
  // LOGOUT (single session)
  // ────────────────────────────────────────────────────────
  async logout(sessionId: string | undefined): Promise<void> {
    if (!sessionId) return;
    await this.prisma.session.delete({ where: { id: sessionId } }).catch(() => undefined);
  }

  // ────────────────────────────────────────────────────────
  // LOGOUT ALL (revoke every session for this user)
  // ────────────────────────────────────────────────────────
  async logoutAll(userId: string): Promise<void> {
    await this.prisma.session.deleteMany({ where: { userId } });
  }

  // ────────────────────────────────────────────────────────
  // ME
  // ────────────────────────────────────────────────────────
  async me(userId: string): Promise<PublicUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        emailVerified: true,
        phoneVerified: true,
        avatarUrl: true,
        deletedAt: true,
      },
    });

    if (!user || user.deletedAt) {
      throw new UnauthorizedException("User not found");
    }
    const { deletedAt: _deleted, ...publicUser } = user;
    return publicUser;
  }

  // ────────────────────────────────────────────────────────
  // Internals
  // ────────────────────────────────────────────────────────

  /** Creates a new session row + issues access & refresh tokens. */
  private async issueSession(
    userId: string,
    role: "USER" | "MODERATOR" | "SUPER_ADMIN",
    userAgent: string | undefined,
    ipAddress: string | undefined,
  ): Promise<IssuedTokens> {
    const sessionId = randomUUID();
    const { accessToken, refreshToken, accessExpiresAt, refreshExpiresAt } =
      this.signTokenPair(userId, sessionId, role);

    await this.prisma.session.create({
      data: {
        id: sessionId,
        userId,
        tokenHash: this.hashToken(refreshToken),
        userAgent: userAgent?.slice(0, 300) ?? null,
        ipAddress: ipAddress ?? null,
        expiresAt: refreshExpiresAt,
      },
    });

    return { accessToken, refreshToken, accessExpiresAt, refreshExpiresAt };
  }

  /** Same as issueSession, but replaces `oldSessionId` in a transaction. */
  private async buildTokensForRotation(
    userId: string,
    role: "USER" | "MODERATOR" | "SUPER_ADMIN",
    userAgent: string | undefined,
    ipAddress: string | undefined,
    oldSessionId: string,
  ): Promise<IssuedTokens> {
    const sessionId = randomUUID();
    const { accessToken, refreshToken, accessExpiresAt, refreshExpiresAt } =
      this.signTokenPair(userId, sessionId, role);

    await this.prisma.$transaction([
      this.prisma.session.delete({ where: { id: oldSessionId } }),
      this.prisma.session.create({
        data: {
          id: sessionId,
          userId,
          tokenHash: this.hashToken(refreshToken),
          userAgent: userAgent?.slice(0, 300) ?? null,
          ipAddress: ipAddress ?? null,
          expiresAt: refreshExpiresAt,
        },
      }),
    ]);

    return { accessToken, refreshToken, accessExpiresAt, refreshExpiresAt };
  }

  private signTokenPair(
    userId: string,
    sessionId: string,
    role: "USER" | "MODERATOR" | "SUPER_ADMIN",
  ): IssuedTokens {
    const accessExpiresIn = this.config.getOrThrow<string>("JWT_ACCESS_EXPIRES_IN");
    const refreshExpiresIn = this.config.getOrThrow<string>("JWT_REFRESH_EXPIRES_IN");
    const accessSecret = this.config.getOrThrow<string>("JWT_ACCESS_SECRET");
    const refreshSecret = this.config.getOrThrow<string>("JWT_REFRESH_SECRET");

    const accessPayload: JwtAccessPayload = { sub: userId, role, type: "access" };
    const refreshPayload: JwtRefreshPayload = { sub: userId, sid: sessionId, type: "refresh" };

    const accessToken = this.jwt.sign(accessPayload, {
      secret: accessSecret,
      // ms-style string ("15m", "7d") — cast because types lag behind runtime
      expiresIn: accessExpiresIn as unknown as number,
    });

    const refreshToken = this.jwt.sign(refreshPayload, {
      secret: refreshSecret,
      expiresIn: refreshExpiresIn as unknown as number,
    });

    const now = Date.now();
    return {
      accessToken,
      refreshToken,
      accessExpiresAt: new Date(now + this.parseDuration(accessExpiresIn)),
      refreshExpiresAt: new Date(now + this.parseDuration(refreshExpiresIn)),
    };
  }

  /** Parse "15m", "7d", "30s" → milliseconds. */
  private parseDuration(input: string): number {
    const match = /^(\d+)\s*([smhd])$/.exec(input);
    if (!match) throw new Error(`Invalid duration format: ${input}`);
    const value = Number(match[1]);
    const unit = match[2];
    const multipliers: Record<string, number> = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
    return value * (multipliers[unit] ?? 1000);
  }

  private hashToken(token: string): string {
    return createHash("sha256").update(token).digest("hex");
  }

  private constantTimeEqual(a: string, b: string): boolean {
    if (a.length !== b.length) return false;
    let diff = 0;
    for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
    return diff === 0;
  }

  /** Waste ~100ms on login failures to prevent timing-based user enumeration. */
  private async fakeVerify(): Promise<void> {
    await argon2.hash("dummy-password-for-timing", {
      type: argon2.argon2id,
      memoryCost: 19_456,
      timeCost: 2,
      parallelism: 1,
    });
  }
}