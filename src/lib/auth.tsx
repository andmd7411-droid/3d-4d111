'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface User {
    id: string
    email: string
    name: string
    isPremium: boolean
}

interface AuthContextType {
    user: User | null
    login: (email: string, password: string) => Promise<void>
    register: (email: string, name: string, password: string) => Promise<void>
    logout: () => void
    isLoading: boolean
    setPremiumStatus: (status: boolean) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        // Simulated persistence
        const storedUser = localStorage.getItem('app_user')
        if (storedUser) {
            setUser(JSON.parse(storedUser))
        }
        setIsLoading(false)
    }, [])

    const login = async (email: string, password: string) => {
        setIsLoading(true)
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 800))

        const mockUser: User = {
            id: '1',
            email,
            name: email.split('@')[0],
            isPremium: localStorage.getItem(`premium_${email}`) === 'true'
        }

        setUser(mockUser)
        localStorage.setItem('app_user', JSON.stringify(mockUser))
        setIsLoading(false)
    }

    const register = async (email: string, name: string, password: string) => {
        setIsLoading(true)
        await new Promise(resolve => setTimeout(resolve, 1000))

        const mockUser: User = {
            id: Math.random().toString(36).substr(2, 9),
            email,
            name,
            isPremium: false
        }

        setUser(mockUser)
        localStorage.setItem('app_user', JSON.stringify(mockUser))
        setIsLoading(false)
    }

    const logout = () => {
        setUser(null)
        localStorage.removeItem('app_user')
    }

    const setPremiumStatus = (status: boolean) => {
        if (user) {
            const updatedUser = { ...user, isPremium: status }
            setUser(updatedUser)
            localStorage.setItem('app_user', JSON.stringify(updatedUser))
            localStorage.setItem(`premium_${user.email}`, status.toString())
        }
    }

    return (
        <AuthContext.Provider value={{ user, login, register, logout, isLoading, setPremiumStatus }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
