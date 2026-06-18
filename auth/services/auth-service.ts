import 'server-only';

import jwt from "jsonwebtoken";
import crypto from "crypto";
import { User } from "@/shared";
import { db } from "@/lib/db";
import * as tables from "@/shared/tables";
import { eq, and, gt } from "drizzle-orm";

function getJWTSecret(): string {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET environment variable not configured");
  }

  return secret;
}

export class RateLimitService {
  // Simple in-memory rate limiter
  private static attempts = new Map<string, { count: number; resetTime: number }>();

  static async checkRateLimit(
    identifier: string,
    maxAttempts: number = 5,
    windowMs: number = 15 * 60 * 1000 // 15 minutes
  ): Promise<{ allowed: boolean; resetTime?: number }> {
    const now = Date.now();
    const existing = this.attempts.get(identifier);

    if (!existing || now > existing.resetTime) {
      // First attempt or window expired, reset counter
      this.attempts.set(identifier, {
        count: 1,
        resetTime: now + windowMs
      });
      return { allowed: true };
    }

    if (existing.count >= maxAttempts) {
      return { 
        allowed: false, 
        resetTime: existing.resetTime 
      };
    }

    // Increment counter
    existing.count++;
    return { allowed: true };
  }

  static clearRateLimit(identifier: string): void {
    this.attempts.delete(identifier);
  }
}

export class AuthService {

  // Create session tokens
  // Create session tokens
  static async createSessionTokens(user: User) {
    try {
      const accessToken = this.generateAccessToken(user);
      // Use SHA-256 for the stored hash — bcrypt is intentionally slow which is
      // fine for passwords but causes measurable latency on every token refresh
      // since we hash-compare on lookup. SHA-256 is sufficient here because the
      // refresh token itself is 32 bytes of CSPRNG output (256-bit entropy).
      const refreshToken = this.generateRefreshToken();
      const refreshTokenHash = crypto
        .createHash("sha256")
        .update(refreshToken)
        .digest("hex");

      await db.insert(tables.refreshTokens).values({
        userId: user.id,
        token: refreshTokenHash,
        expiresAt: new Date(Date.now() + 7 * 86400000), // 7 days
        isRevoked: false,
        createdAt: new Date()
      });

      return {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        }
      };
    } catch (error) {
      throw error;
    }
  }

  // Generate access token
  private static generateAccessToken(user: User): string {
    const secret = getJWTSecret();

    return jwt.sign(
      {
        id: user.id,
        userId: user.id,   // server socket.ts reads userId
        email: user.email,
        role: user.role,
        tokenVersion: user.tokenVersion
      },
      secret,
      { expiresIn: "7d" }  // match React app — long enough for socket sessions
    );
  }

  // Verify access token
  static async verifyToken(token: string): Promise<User | null> {
    try {
      if (!token) return null;

      const decoded: any = jwt.verify(token, getJWTSecret());

      const users = await db
        .select()
        .from(tables.users)
        .where(eq(tables.users.id, decoded.id))
        .limit(1);

      const user = users[0];

      if (!user) return null;

      if (decoded.tokenVersion !== user.tokenVersion) {
        return null;
      }

      return user;
    } catch {
      return null;
    }
  }

  // Generate refresh token
  private static generateRefreshToken(): string {
    return crypto.randomBytes(32).toString("hex");
  }

  // Validate refresh token — direct SHA-256 hash lookup (O(1), no bcrypt loop)
  static async validateRefreshToken(token: string, userId: string): Promise<User | null> {
    try {
      const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

      const [record] = await db
        .select()
        .from(tables.refreshTokens)
        .where(
          and(
            eq(tables.refreshTokens.userId, userId),
            eq(tables.refreshTokens.token, tokenHash),
            gt(tables.refreshTokens.expiresAt, new Date()),
            eq(tables.refreshTokens.isRevoked, false)
          )
        )
        .limit(1);

      if (!record) return null;

      const [user] = await db
        .select()
        .from(tables.users)
        .where(eq(tables.users.id, record.userId))
        .limit(1);

      return user || null;
    } catch (error) {
      return null;
    }
  }

  // Revoke refresh token — direct SHA-256 hash lookup
  static async revokeRefreshToken(token: string, userId: string) {
    try {
      const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

      await db
        .update(tables.refreshTokens)
        .set({ isRevoked: true })
        .where(
          and(
            eq(tables.refreshTokens.userId, userId),
            eq(tables.refreshTokens.token, tokenHash)
          )
        );
    } catch (error) {
      throw error;
    }
  }

  // Revoke all refresh tokens for a user (logout all devices)
  static async revokeAllRefreshTokens(userId: string) {
    try {
      await db
        .update(tables.refreshTokens)
        .set({ isRevoked: true })
        .where(
          and(
            eq(tables.refreshTokens.userId, userId),
            eq(tables.refreshTokens.isRevoked, false)
          )
        );
    } catch (error) {
      throw error;
    }
  }
}