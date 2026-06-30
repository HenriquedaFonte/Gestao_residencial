'use client'

import { useCurrentUser } from './UserContext'

const USERS = [
  { id: 1, name: 'Henrique', emoji: '👨', color: 'from-indigo-500 to-blue-600' },
  { id: 2, name: 'Josiane', emoji: '👩', color: 'from-pink-500 to-rose-600' },
]

export function UserSelector() {
  const { setCurrentUser } = useCurrentUser()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50 p-6">
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <div className="mb-4 text-6xl">🏠</div>
          <h1 className="text-3xl font-bold text-gray-800">Casa Arrumada</h1>
          <p className="mt-2 text-gray-500">Quem é você hoje?</p>
        </div>

        <div className="flex flex-col gap-4">
          {USERS.map((user) => (
            <button
              key={user.id}
              onClick={() => setCurrentUser({ id: user.id, name: user.name })}
              className={`flex items-center gap-4 rounded-2xl bg-gradient-to-r ${user.color} p-5 text-left text-white shadow-lg transition-transform active:scale-95`}
            >
              <span className="text-5xl">{user.emoji}</span>
              <div>
                <div className="text-xl font-bold">{user.name}</div>
                <div className="text-sm opacity-80">Entrar como {user.name}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
