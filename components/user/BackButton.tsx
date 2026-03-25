'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface BackButtonProps {
  href?: string
  label?: string
}

export default function BackButton({ href = '/my', label = 'Back to Profile' }: BackButtonProps) {
  const router = useRouter()

  const handleBack = () => {
    if (href) {
      router.push(href)
    } else {
      router.back()
    }
  }

  return (
    <Button
      variant="outline"
      onClick={handleBack}
      className="mb-6 lg:hidden"
    >
      <ArrowLeft className="w-4 h-4 mr-2" />
      {label}
    </Button>
  )
}
