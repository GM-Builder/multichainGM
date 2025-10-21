// src/components/providers/Providers.tsx (NEW FILE)
'use client'
import { useEffect } from 'react'
import { sdk } from '@farcaster/miniapp-sdk'  // atau miniapp-sdk

export function FarcasterProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Simple, direct call
    sdk.actions.ready()
    console.log('✅ Farcaster ready called')
  }, [])

  return <>{children}</>
}