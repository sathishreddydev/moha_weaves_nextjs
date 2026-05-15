'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/auth'
import { SocketInitializer } from '@/components/SocketInitializer'
import { FilterInitializer } from '@/components/FilterInitializer'
import { useState } from 'react'

export function Providers({ children, session }: { children: React.ReactNode; session?: any }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes
        refetchOnWindowFocus: false,
      },
    },
  }))

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider session={session}>
        <SocketInitializer />
        <FilterInitializer />
        {children}
      </AuthProvider>
    </QueryClientProvider>
  )
}
