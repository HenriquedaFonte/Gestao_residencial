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
    if (hour < 12) return 'Bom dia'
    if (hour < 18) return 'Boa tarde'
    return 'Boa noite'
  }

  return (
    <header>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{formatDate(today)}</p>
          <h1 className="text-2xl font-bold text-gray-800">
            {greeting()}, {currentUser?.name?.split(' ')[0]}! 👋
          </h1>
        </div>
        <button
          onClick={switchUser}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-xl"
          title="Trocar usuário"
        >
          {currentUser?.id === 1 ? '👨' : '👩'}
        </button>
      </div>

      {pendingCount > 0 && (
        <div className="mt-4 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 p-4 text-white">
          <p className="text-sm font-medium opacity-90">Você tem</p>
          <p className="text-3xl font-bold">
            {pendingCount} {pendingCount === 1 ? 'tarefa' : 'tarefas'}
          </p>
          <p className="text-sm opacity-90">pendente{pendingCount !== 1 ? 's' : ''} para hoje</p>
        </div>
      )}

      {pendingCount === 0 && (
        <div className="mt-4 rounded-2xl bg-gradient-to-r from-green-400 to-emerald-500 p-4 text-white">
          <p className="text-2xl font-bold">Tudo em dia! ✅</p>
          <p className="text-sm opacity-90">Nenhuma tarefa pendente hoje</p>
        </div>
      )}
    </header>
  )
}
