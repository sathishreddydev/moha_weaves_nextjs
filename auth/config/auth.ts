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
    email: string;
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
          
          if (!user) {
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
            accessToken: tokens.accessToken,
          };
        } catch (error) {
          console.error('Auth error:', error);
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
        token.email = user.email;
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
        session.user.id = token.id || token.sub; // Use sub as fallback
        session.user.email = token.email;
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
        secure: process.env.NODE_ENV === 'production',
        domain: process.env.NODE_ENV === 'production' ? '.yourdomain.com' : undefined,
      },
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
