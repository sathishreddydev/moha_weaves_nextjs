import NextAuth from 'next-auth';
import { JWT } from 'next-auth/jwt';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { User } from '@/shared';

// Extend NextAuth types
declare module 'next-auth' {
  interface Session {
    user: User;
    accessToken: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    email?: string;
    phone?: string;
    name?: string;
    role: string;
    accessToken: string;
  }
}

export const authOptions = {
  session: {
    strategy: 'jwt' as const,
    maxAge: 30 * 24 * 60 * 60, // 30 days for ecommerce
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: '/login',
    error: '/login',
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
    CredentialsProvider({
      id: 'credentials',
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            return null;
          }

          const { AuthService } = await import('../services/auth-service');
          const user = await AuthService.findUserByEmail(credentials.email);

          if (!user || !user.password) {
            return null;
          }

          const isValidPassword = await AuthService.verifyPassword(
            credentials.password,
            user.password
          );

          if (!isValidPassword) {
            return null;
          }

          const tokens = await AuthService.createSessionTokens(user);

          return {
            ...tokens.user,
            phone: user.phone,
            accessToken: tokens.accessToken,
          };
        } catch (error) {
          return null;
        }
      },
    }),
    CredentialsProvider({
      id: 'otp-login',
      name: 'OTP Login',
      credentials: {
        phone: { label: 'Phone', type: 'text' },
        userId: { label: 'User ID', type: 'text' },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.phone || !credentials?.userId) {
            return null;
          }

          const { AuthService } = await import('../services/auth-service');
          const { db } = await import('@/lib/db');
          const { users } = await import('@/shared/tables');
          const { eq } = await import('drizzle-orm');

          const [user] = await db
            .select()
            .from(users)
            .where(eq(users.id, credentials.userId))
            .limit(1);

          if (!user || user.phone !== credentials.phone) {
            return null;
          }

          const tokens = await AuthService.createSessionTokens(user);

          return {
            ...tokens.user,
            phone: user.phone,
            accessToken: tokens.accessToken,
          };
        } catch (error) {
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }: any) {
      // Handle Google sign-in: find or create user in DB
      if (account?.provider === 'google') {
        try {
          const { db } = await import('@/lib/db');
          const { users } = await import('@/shared/tables');
          const { eq } = await import('drizzle-orm');

          // Check if user exists by email
          const [existingUser] = await db
            .select()
            .from(users)
            .where(eq(users.email, user.email))
            .limit(1);

          if (!existingUser) {
            // Create new user from Google profile
            const [newUser] = await db
              .insert(users)
              .values({
                email: user.email,
                name: user.name || 'User',
                role: 'user',
                isActive: true,
                createdAt: new Date(),
              })
              .returning();

            user.dbId = newUser.id;
            user.role = newUser.role;
            user.phone = newUser.phone;
          } else {
            user.dbId = existingUser.id;
            user.role = existingUser.role;
            user.phone = existingUser.phone;

            // Update name from Google if user has default name
            if (existingUser.name === 'User' && user.name) {
              await db
                .update(users)
                .set({ name: user.name })
                .where(eq(users.id, existingUser.id));
            }
          }

          return true;
        } catch (error) {
          console.error('Google signIn callback error:', error);
          return false;
        }
      }

      return true;
    },
    async jwt({ token, user, account }: any) {
      if (user && account) {
        if (account.provider === 'google') {
          // Google login — use dbId from signIn callback
          token.id = user.dbId || user.id;
          token.sub = user.dbId || user.id;
          token.email = user.email || '';
          token.phone = user.phone || '';
          token.name = user.name;
          token.role = user.role || 'user';
          token.accessToken = '';
        } else {
          // Credentials / OTP login
          token.id = user.id;
          token.sub = user.id;
          token.email = user.email || '';
          token.phone = user.phone || '';
          token.name = user.name;
          token.role = user.role;
          token.accessToken = user.accessToken || '';
        }
      }

      return token;
    },
    async session({ session, token }: { session: any; token: JWT }) {
      if (token) {
        session.user.id = token.id || token.sub;
        session.user.email = token.email || null;
        session.user.phone = token.phone || null;
        session.user.name = token.name;
        session.user.role = token.role;
        session.accessToken = token.accessToken;
      }
      return session;
    },
  },
  cookies: {
    sessionToken: {
      name: 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: false,
      },
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
