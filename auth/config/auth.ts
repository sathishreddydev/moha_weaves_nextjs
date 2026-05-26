import NextAuth from 'next-auth';
import { JWT } from 'next-auth/jwt';
import CredentialsProvider from 'next-auth/providers/credentials';
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
    signUp: '/register',
    error: '/auth/error',
  },
  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        role: { label: 'Role', type: 'text' }
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            return null;
          }

          // Use actual database authentication via auth-service
          const { AuthService } = await import('../services/auth-service');
          
          // Find user by email
          const user = await AuthService.findUserByEmail(credentials.email);
          
          if (!user || !user.password) {
            // User doesn't exist or is a phone-only user (no password set)
            return null;
          }

          // Verify password
          const isValidPassword = await AuthService.verifyPassword(
            credentials.password,
            user.password
          );

          if (!isValidPassword) {
            return null;
          }

          // Create session tokens
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

          // User already verified via OTP API route — just look up and create session
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

          // Create session tokens
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
    async jwt({ token, user, account }: any) {
      // Initial login - store user data in token
      if (user && account) {
        token.id = user.id;
        token.sub = user.id; // JWT standard: subject field
        token.email = user.email || '';
        token.phone = user.phone || '';
        token.name = user.name;
        token.role = user.role;
        token.accessToken = user.accessToken || '';
      }
      
      // Subsequent requests - preserve existing token data
      else if (token && !user && !account) {
        // Token already has data from previous login, preserve it
      }
      
      return token;
    },
    async session({ session, token }: { session: any; token: JWT }) {
      if (token) {
        // JWT tokens use 'sub' (subject) field for user ID
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
        secure: false, // Set to false for HTTP on VPS
        // Remove domain for IP-based access
      },
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
