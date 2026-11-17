// 📍 /apps/api/src/modules/notifications/socket-auth.ts
//
// Socket.IO handshake auth:
//   1. Read the access_token cookie from the raw Cookie header
//   2. Verify JWT with JWT_ACCESS_SECRET
//   3. Load user from DB (checks suspension / soft-delete)
//   4. Return { userId, role } — or throw UnauthorizedException

import { UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import type { UserRole } from "@prisma/client";
import type { Socket } from "socket.io";
import { PrismaService } from "../prisma/prisma.service";

export interface SocketAuthPayload {
  userId: string;
  role: UserRole;
}

export async function authenticateSocket(
  socket: Socket,
  jwt: JwtService,
  prisma: PrismaService,
  accessSecret: string,
): Promise<SocketAuthPayload> {
  // Extract cookie
  const cookieHeader = socket.handshake.headers.cookie ?? "";
  const token = parseCookie(cookieHeader, "access_token");
  if (!token) throw new UnauthorizedException("No session cookie");

  // Verify JWT
  let payload: { sub?: string; type?: string };
  try {
    payload = jwt.verify(token, { secret: accessSecret }) as typeof payload;
  } catch {
    throw new UnauthorizedException("Invalid token");
  }
  if (payload.type !== "access" || !payload.sub) {
    throw new UnauthorizedException("Invalid token payload");
  }

  // Confirm user still valid
  const user = await prisma.user.findFirst({
    where: { id: payload.sub, deletedAt: null },
    select: { id: true, role: true, status: true },
  });
  if (!user || user.status !== "ACTIVE") {
    throw new UnauthorizedException("Account not active");
  }

  return { userId: user.id, role: user.role };
}

/** Minimal cookie-header parser (avoids importing the `cookie` package). */
function parseCookie(header: string, name: string): string | null {
  if (!header) return null;
  const parts = header.split(";");
  for (const part of parts) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    if (key !== name) continue;
    return decodeURIComponent(part.slice(idx + 1).trim());
  }
  return null;
}