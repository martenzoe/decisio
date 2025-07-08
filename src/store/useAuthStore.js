// src/store/useAuthStore.js
import { create } from 'zustand'

export const useAuthStore = create((set) => ({
  user: null,
  userId: null,
  token: localStorage.getItem('token') || null,

  setUser: (newUserData) => {
    const updated = { ...newUserData }
    console.log('🔁 setUser mit:', updated)
    set({ user: updated, userId: updated.id })
  },

  setToken: (token) => {
    localStorage.setItem('token', token)
    set({ token })
  },

  logout: () => {
    localStorage.removeItem('token')
    set({ user: null, token: null, userId: null })
  },

  loadUserFromToken: async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      console.log('🔐 Kein Token gefunden')
      return
    }

    try {
      const res = await fetch('http://localhost:3000/api/users/me', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      const data = await res.json()

      if (!res.ok) {
        console.error('❌ Fehler beim Laden des Profils:', data.error)
        return
      }

      console.log('✅ Profil vom Server geladen:', data)
      set({ user: data, userId: data.id })
    } catch (err) {
      console.error('❌ Netzwerkfehler beim Laden des Benutzers:', err.message)
    }
  }
}))
