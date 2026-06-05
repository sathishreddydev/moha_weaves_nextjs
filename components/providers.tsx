'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/auth'
import { SocketInitializer } from '@/components/SocketInitializer'
import { FilterInitializer } from '@/components/FilterInitializer'
import { useFilterStore } from '@/lib/stores/fillterStore'
import type { FiltersData } from '@/app/api/filters/filterService'
import { useState, useRef } from 'react'

interface ProvidersProps {
  children: React.ReactNode
  session?: any
  filters?: FiltersData
}

export function Providers({ children, session, filters }: ProvidersProps) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes
        refetchOnWindowFocus: false,
      },
    },
  }))

  // Seed the filter store with server-fetched data exactly once,
  // before any child component renders. This means HeroSection,
  // MegaMenu, and all other consumers get real data on their very
  // first render — the loading state is never shown.
  const seeded = useRef(false)
  if (!seeded.current && filters) {
    useFilterStore.setState({
      categories: filters.categories,
      colors: filters.colors,
      fabrics: filters.fabrics,
      isHydrated: true,
      loading: false,
      error: null,
    })
    seeded.current = true
  }

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
