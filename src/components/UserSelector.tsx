'use client'

import { useCurrentUser } from './UserContext'

const USERS = [
  { id: 1, name: 'Henrique', bg: 'bg-henrique', soft: 'bg-henrique-soft', text: 'text-henrique' },
  { id: 2, name: 'Josiane', bg: 'bg-josiane', soft: 'bg-josiane-soft', text: 'text-josiane' },
]

export function UserSelector() {
  const { setCurrentUser } = useCurrentUser()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-paper p-6">
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-terracotta-soft">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#C2683F" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
            </svg>
          </div>
          <h1 className="font-serif text-3xl font-semibold text-ink">Casa Arrumada</h1>
          <p className="mt-2 text-sm text-muted">Quem é você hoje?</p>
        </div>

        <div className="flex flex-col gap-3">
          {USERS.map((user) => (
            <button
              key={user.id}
              onClick={() => setCurrentUser({ id: user.id, name: user.name })}
              className={`flex items-center gap-4 rounded-2xl border border-line ${user.soft} p-5 text-left transition-all active:scale-95`}
            >
              <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full ${user.bg} font-serif text-xl font-semibold text-white`}>
                {user.name[0]}
              </div>
              <div>
                <div className={`text-[15px] font-semibold ${user.text}`}>{user.name}</div>
                <div className="text-[12px] text-muted">Entrar como {user.name}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
