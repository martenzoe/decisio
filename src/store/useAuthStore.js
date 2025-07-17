import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      userId: null,
      token: null,

      setUser: (newUserData) => {
        if (!newUserData) {
          console.log('🔁 setUser mit: null (reset)')
          set({ user: null, userId: null })
          return
        }
        console.log('🔁 setUser mit:', newUserData)
        set({ user: newUserData, userId: newUserData.id })
      },

      setToken: (token) => {
        console.log('🔑 Token gesetzt:', token)
        set({ token })
      },

      logout: () => {
        set({ user: null, userId: null, token: null })
      },

      loadUserFromToken: async () => {
        const token = useAuthStore.getState().token
        if (!token) {
          console.log('🔐 Kein Token im Store')
          return
        }

        try {
          const res = await fetch('https://decisio.onrender.com/api/users/me', {
            headers: { Authorization: `Bearer ${token}` }
          })
          const data = await res.json()
          if (!res.ok) {
            console.error('❌ Fehler beim Laden des Profils:', data.error)
            return
          }

          set({ user: data, userId: data.id })
          console.log('✅ Profil vom Server geladen:', data)
        } catch (err) {
          console.error('❌ Netzwerkfehler beim Laden des Benutzers:', err.message)
        }
      }
    }),
    { name: 'auth-store' }
  )
)
