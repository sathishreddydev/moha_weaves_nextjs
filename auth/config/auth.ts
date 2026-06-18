import { JWT } from 'next-auth/jwt';
import { AuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { users } from '@/shared/tables';
import { db } from '@/lib/db';
import { AuthService } from '../services/auth-service';
import { eq } from 'drizzle-orm';
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

/**
 * Returns NextAuth options with env vars read at call time.
 * This ensures GOOGLE_CLIENT_ID, NEXTAUTH_SECRET etc. are read from
 * the runtime environment, NOT inlined during `next build`.
 */
export function getAuthOptions(): AuthOptions {
  return {
    debug: process.env.NODE_ENV !== 'production',
    session: {
      strategy: 'jwt' as const,
      maxAge: 30 * 24 * 60 * 60,
    },
    secret: process.env.NEXTAUTH_SECRET,
    pages: {
      signIn: '/login',
      error: '/login',
    },
    providers: [
      GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
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
            if (!credentials?.email || !credentials?.password) return null;
            const user = await AuthService.findUserByEmail(credentials.email);
            if (!user || !user.password) return null;
            const isValid = await AuthService.verifyPassword(credentials.password, user.password);
            if (!isValid) return null;
            const tokens = await AuthService.createSessionTokens(user);
            return { ...tokens.user, phone: user.phone, accessToken: tokens.accessToken };
          } catch {
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
            if (!credentials?.phone || !credentials?.userId) return null;
            const [user] = await db
              .select().from(users)
              .where(eq(users.id, credentials.userId))
              .limit(1);
            if (!user || user.phone !== credentials.phone) return null;
            const tokens = await AuthService.createSessionTokens(user);
            return { ...tokens.user, phone: user.phone, accessToken: tokens.accessToken };
          } catch {
            return null;
          }
        },
      }),
    ],
    callbacks: {
      async signIn({ user, account }: any) {
        if (account?.provider === 'google') {
          try {
            console.log('[AUTH] Google signIn - email:', user.email);
            const [existingUser] = await db
              .select().from(users)
              .where(eq(users.email, user.email))
              .limit(1);

            if (!existingUser) {
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
              if (existingUser.name === 'User' && user.name) {
                await db.update(users).set({ name: user.name }).where(eq(users.id, existingUser.id));
              }
            }
            return true;
          } catch (error: any) {
            console.error('[AUTH] Google signIn FAILED:', error?.message);
            return false;
          }
        }
        return true;
      },
      async jwt({ token, user, account }: any) {
        if (user && account) {
          if (account.provider === 'google') {
            token.id = user.dbId || user.id;
            token.sub = user.dbId || user.id;
            token.email = user.email || '';
            token.phone = user.phone || '';
            token.name = user.name;
            token.role = user.role || 'user';
            try {
              const [dbUser] = await db.select().from(users).where(eq(users.id, token.id)).limit(1);
              if (dbUser) {
                const tokens = await AuthService.createSessionTokens(dbUser);
                token.accessToken = tokens.accessToken;
              } else {
                token.accessToken = '';
              }
            } catch {
              token.accessToken = '';
            }
          } else {
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
        name: process.env.NEXTAUTH_URL?.startsWith('https://')
          ? '__Secure-next-auth.session-token'
          : 'next-auth.session-token',
        options: {
          httpOnly: true,
          sameSite: 'lax' as const,
          path: '/',
          secure: process.env.NEXTAUTH_URL?.startsWith('https://') ?? false,
        },
      },
    },
  };
}

// Lazy static export for getServerSession() calls elsewhere in the app.
// Uses a getter so it's only evaluated when accessed at runtime.
let _authOptions: AuthOptions | null = null;
export const authOptions: AuthOptions = new Proxy({} as AuthOptions, {
  get(_target, prop) {
    if (!_authOptions) {
      _authOptions = getAuthOptions();
    }
    return (_authOptions as any)[prop];
  },
});
