'use client'
import { useEffect } from 'react'

export function FarcasterProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const initFarcaster = async () => {
      try {
        // Try frame-sdk first
        const { sdk } = await import('@farcaster/frame-sdk')
        sdk.actions.ready()
        console.log('✅ [frame-sdk] Ready called')
      } catch (err) {
        console.warn('frame-sdk failed, trying miniapp-sdk...', err)
        try {
          // Fallback to miniapp-sdk
          const { sdk } = await import('@farcaster/miniapp-sdk')
          sdk.actions.ready()
          console.log('✅ [miniapp-sdk] Ready called')
        } catch (err2) {
          console.error('❌ Both SDKs failed:', err2)
        }
      }
    }
    
    initFarcaster()
  }, [])

  return <>{children}</>
}