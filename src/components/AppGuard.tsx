'use client'

import { ReactNode } from 'react'
import { useCurrentUser } from './UserContext'
import { UserSelector } from './UserSelector'

export function AppGuard({ children }: { children: ReactNode }) {
  const { currentUser, isLoaded } = useCurrentUser()

  if (!isLoaded) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-indigo-200 border-t-indigo-600" />
      </div>
    )
  }

  if (!currentUser) {
    return <UserSelector />
  }

  return <>{children}</>
}
