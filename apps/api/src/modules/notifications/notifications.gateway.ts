// 📍 /apps/api/src/modules/notifications/notifications.gateway.ts
//
// Socket.IO gateway.
//
// Rooms:
//   • user:<userId>  → every tab of a single user
//   • role:admin     → every moderator/super_admin (for fan-out)
//
// Events pushed to client:
//   • notification:new           (a single NotificationItem)
//   • notification:unread-count  (number)

import {
  Logger,
  OnModuleInit,
  UnauthorizedException,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import type { Server, Socket } from "socket.io";
import type { NotificationItem } from "@property-marketplace/shared-types";
import { PrismaService } from "../prisma/prisma.service";
import { authenticateSocket, type SocketAuthPayload } from "./socket-auth";

interface SocketData extends SocketAuthPayload {
  rooms: string[];
}

@WebSocketGateway({
  cors: {
    origin: true, // set per env below via config
    credentials: true,
  },
  transports: ["websocket", "polling"],
})
@UsePipes(new ValidationPipe({ transform: true }))
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnModuleInit
{
  private readonly logger = new Logger(NotificationsGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  onModuleInit(): void {
    // Tighten CORS after the Server instance is available.
    const appUrl = this.config.get<string>("APP_URL") ?? "http://localhost:3035";
    this.server.engine.opts.cors = {
      origin: [appUrl],
      credentials: true,
    } as typeof this.server.engine.opts.cors;
  }

  async handleConnection(socket: Socket): Promise<void> {
    try {
      const accessSecret = this.config.getOrThrow<string>("JWT_ACCESS_SECRET");
      const auth = await authenticateSocket(socket, this.jwt, this.prisma, accessSecret);

      const data = socket.data as SocketData;
      data.userId = auth.userId;
      data.role = auth.role;
      data.rooms = [`user:${auth.userId}`];

      if (auth.role === "MODERATOR" || auth.role === "SUPER_ADMIN") {
        data.rooms.push("role:admin");
      }

      await Promise.all(data.rooms.map((r) => socket.join(r)));

      this.logger.log(
        `Socket connected: user=${auth.userId} role=${auth.role} rooms=${data.rooms.join(",")}`,
      );
    } catch (err) {
      this.logger.warn(
        `Socket auth failed (${socket.id}): ${(err as Error).message}`,
      );
      socket.emit("auth-error", { message: "Unauthorized" });
      socket.disconnect(true);
    }
  }

  handleDisconnect(socket: Socket): void {
    const data = socket.data as Partial<SocketData>;
    this.logger.log(
      `Socket disconnected: user=${data.userId ?? "unknown"} (${socket.id})`,
    );
  }

  // ────────────────────────────────────────────────────────
  // Emit helpers (called by NotificationsService)
  // ────────────────────────────────────────────────────────

  emitToUser(userId: string, notification: NotificationItem): void {
    this.server.to(`user:${userId}`).emit("notification:new", notification);
  }

  emitUnreadCount(userId: string, count: number): void {
    this.server.to(`user:${userId}`).emit("notification:unread-count", count);
  }
}