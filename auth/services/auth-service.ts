import 'server-only';

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { User } from "@/shared";
import { db } from "@/lib/db";
import * as tables from "@/shared/tables";
import { eq, and, gt, sql } from "drizzle-orm";

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

  // Find user by email
  static async findUserByEmail(email: string): Promise<User | null> {
    try {
      const users = await db
        .select()
        .from(tables.users)
        .where(eq(tables.users.email, email))
        .limit(1);

      return users[0] || null;
    } catch (error) {
      return null;
    }
  }

  // Verify password
  static async verifyPassword(
    password: string,
    hashedPassword: string
  ): Promise<boolean> {
    try {
      return await bcrypt.compare(password, hashedPassword);
    } catch (error) {
      return false;
    }
  }

  // Create session tokens
  static async createSessionTokens(user: User) {
    try {
      const accessToken = this.generateAccessToken(user);
      const refreshToken = this.generateRefreshToken();

      const refreshTokenHash = await bcrypt.hash(refreshToken, 10);

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

  // Validate refresh token
  static async validateRefreshToken(token: string, userId: string): Promise<User | null> {
    try {
      // Only fetch tokens for the specific user (not all tokens in the system)
      const tokens = await db
        .select()
        .from(tables.refreshTokens)
        .where(
          and(
            eq(tables.refreshTokens.userId, userId),
            gt(tables.refreshTokens.expiresAt, new Date()),
            eq(tables.refreshTokens.isRevoked, false)
          )
        );

      for (const record of tokens) {
        const match = await bcrypt.compare(token, record.token);

        if (match) {
          const users = await db
            .select()
            .from(tables.users)
            .where(eq(tables.users.id, record.userId))
            .limit(1);

          return users[0] || null;
        }
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  // Revoke refresh token for a specific user
  static async revokeRefreshToken(token: string, userId: string) {
    try {
      const tokens = await db
        .select()
        .from(tables.refreshTokens)
        .where(
          and(
            eq(tables.refreshTokens.userId, userId),
            eq(tables.refreshTokens.isRevoked, false)
          )
        );

      for (const record of tokens) {
        const match = await bcrypt.compare(token, record.token);

        if (match) {
          await db
            .update(tables.refreshTokens)
            .set({ isRevoked: true })
            .where(eq(tables.refreshTokens.id, record.id));

          return;
        }
      }
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

  // Update password
  static async updatePassword(userId: string, newPassword: string) {
    try {
      const hashedPassword = await bcrypt.hash(newPassword, 12);

      await db
        .update(tables.users)
        .set({
          password: hashedPassword,
          tokenVersion: sql`${tables.users.tokenVersion} + 1`
        })
        .where(eq(tables.users.id, userId));
    } catch (error) {
      throw error;
    }
  }
}