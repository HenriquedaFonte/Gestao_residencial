'use client'

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react'

type CurrentUser = {
  id: number
  name: string
}

type UserContextType = {
  currentUser: CurrentUser | null
  setCurrentUser: (user: CurrentUser) => void
  isLoaded: boolean
}

const UserContext = createContext<UserContextType>({
  currentUser: null,
  setCurrentUser: () => {},
  isLoaded: false,
})

const STORAGE_KEY = 'casa_arrumada_user'

export function UserProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUserState] = useState<CurrentUser | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        setCurrentUserState(JSON.parse(stored))
      }
    } catch {
      // ignore
    }
    setIsLoaded(true)
  }, [])

  function setCurrentUser(user: CurrentUser) {
    setCurrentUserState(user)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
  }

  return (
    <UserContext.Provider value={{ currentUser, setCurrentUser, isLoaded }}>
      {children}
    </UserContext.Provider>
  )
}

export function useCurrentUser() {
  return useContext(UserContext)
}
