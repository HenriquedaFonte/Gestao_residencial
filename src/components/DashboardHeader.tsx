'use client'

import { useCurrentUser } from './UserContext'
import { formatDate, getTodayDateString } from '@/lib/utils'

type Props = {
  pendingCount: number
}

export function DashboardHeader({ pendingCount }: Props) {
  const { currentUser, setCurrentUser } = useCurrentUser()
  const today = getTodayDateString()

  function switchUser() {
    const newUser =
      currentUser?.id === 1
        ? { id: 2, name: 'Josiane' }
        : { id: 1, name: 'Henrique' }
    setCurrentUser(newUser)
  }

  const greeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Bom dia,'
    if (hour < 18) return 'Boa tarde,'
    return 'Boa noite,'
  }

  const initial = currentUser?.name?.[0] ?? '?'
  const isHenrique = currentUser?.id === 1

  return (
    <header>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted">{formatDate(today)}</p>
          <h1 className="font-serif text-2xl font-semibold text-ink leading-tight mt-0.5">
            {greeting()}<br />{currentUser?.name}
          </h1>
        </div>
        <button
          onClick={switchUser}
          className={`flex h-10 w-10 items-center justify-center rounded-full font-serif text-lg font-semibold text-white flex-shrink-0 mt-1 ${
            isHenrique ? 'bg-henrique' : 'bg-josiane'
          }`}
          title="Trocar usuário"
        >
          {initial}
        </button>
      </div>

      {pendingCount > 0 ? (
        <div className="mt-4 rounded-2xl bg-terracotta px-4 py-4 text-[#FFF8F3]">
          <p className="text-[11px] font-semibold tracking-wide uppercase opacity-80">Você tem</p>
          <p className="font-serif text-3xl font-semibold leading-tight mt-1">
            {pendingCount} {pendingCount === 1 ? 'tarefa' : 'tarefas'}
          </p>
          <p className="text-sm opacity-85">pendente{pendingCount !== 1 ? 's' : ''} para hoje</p>
        </div>
      ) : (
        <div className="mt-4 rounded-2xl bg-success px-4 py-4 text-white">
          <p className="font-serif text-2xl font-semibold">Tudo em dia</p>
          <p className="text-sm opacity-90 mt-0.5">Nenhuma tarefa pendente hoje</p>
        </div>
      )}
    </header>
  )
}
