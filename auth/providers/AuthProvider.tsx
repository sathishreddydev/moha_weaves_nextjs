'use client';

import { SessionProvider } from 'next-auth/react';
import { ReactNode } from 'react';

interface AuthProviderProps {
  children: ReactNode;
  session?: any;
}

export function AuthProvider({ children, session }: AuthProviderProps) {
  return (
    <SessionProvider 
      session={session}
      refetchInterval={0} // No auto-refresh needed with NextAuth JWT (30-day sessions)
      refetchOnWindowFocus={false}
    >
      {children}
    </SessionProvider>
  );
}
