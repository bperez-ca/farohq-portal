'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

interface SidebarContextType {
  collapsed: boolean
  toggleCollapsed: () => void
}

const SidebarContext = createContext<SidebarContextType>({
  collapsed: false,
  toggleCollapsed: () => {},
})

export const useSidebar = () => useContext(SidebarContext)

const STORAGE_KEY = 'sidebarCollapsed'

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    // Read from localStorage on mount
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored !== null) {
        setCollapsed(stored === 'true')
      }
    }
  }, [])

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const newValue = !prev
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, String(newValue))
      }
      return newValue
    })
  }

  return (
    <SidebarContext.Provider value={{ collapsed, toggleCollapsed }}>
      {children}
    </SidebarContext.Provider>
  )
}
