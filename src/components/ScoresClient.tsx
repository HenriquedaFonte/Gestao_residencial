'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createReward, deleteReward } from '@/lib/actions'
import { useCurrentUser } from './UserContext'
import { Reward, User } from '@/db/schema'

type ScoreEntry = { user: User; total: number }
type RewardEntry = { reward: Reward; user: User | null }

type Props = {
  scores: ScoreEntry[]
  rewards: RewardEntry[]
  currentMonth: string // YYYY-MM
}

function TrophyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path fillRule="evenodd" d="M5.166 2.621v.858c-1.035.148-2.059.33-3.071.543a.75.75 0 0 0-.584.859 6.753 6.753 0 0 0 6.138 5.6 6.73 6.73 0 0 0 2.743 1.346A6.707 6.707 0 0 1 9.279 15H8.54c-1.036 0-1.875.84-1.875 1.875V19.5h-.75a2.25 2.25 0 0 0-2.25 2.25c0 .414.336.75.75.75h15a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-2.25-2.25h-.75v-2.625c0-1.036-.84-1.875-1.875-1.875h-.739a6.706 6.706 0 0 1-1.112-3.173 6.73 6.73 0 0 0 2.743-1.347 6.753 6.753 0 0 0 6.139-5.6.75.75 0 0 0-.585-.858 47.077 47.077 0 0 0-3.07-.543V2.62a.75.75 0 0 0-.658-.744 49.798 49.798 0 0 0-6.093-.377c-2.063 0-4.096.128-6.093.377a.75.75 0 0 0-.657.744Zm0 2.629c0 1.196.312 2.32.857 3.294A5.266 5.266 0 0 1 3.16 5.337a45.6 45.6 0 0 1 2.006-.343v.256Zm13.5 0v-.256c.674.1 1.343.214 2.006.343a5.265 5.265 0 0 1-2.863 3.207 6.72 6.72 0 0 0 .857-3.294Z" clipRule="evenodd" />
    </svg>
  )
}

function GiftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 1 0 9.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1 1 14.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
    </svg>
  )
}

function ChevronIcon({ direction }: { direction: 'left' | 'right' }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      {direction === 'left'
        ? <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
        : <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
      }
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
    </svg>
  )
}

function formatMonthLabel(month: string) {
  const [year, mon] = month.split('-').map(Number)
  const date = new Date(year, mon - 1, 1)
  const label = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

function navigateMonth(month: string, delta: number): string {
  const [year, mon] = month.split('-').map(Number)
  const d = new Date(year, mon - 1 + delta, 1)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

function isCurrentMonth(month: string): boolean {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  return month === `${y}-${m}`
}

export function ScoresClient({ scores, rewards, currentMonth }: Props) {
  const router = useRouter()
  const { currentUser } = useCurrentUser()
  const [isPending, startTransition] = useTransition()
  const [showForm, setShowForm] = useState(false)
  const [formTitle, setFormTitle] = useState('')
  const [formDesc, setFormDesc] = useState('')

  const maxScore = Math.max(...scores.map((s) => s.total), 1)
  const total = scores.reduce((sum, s) => sum + s.total, 0)
  const winner = total > 0
    ? scores.reduce((a, b) => (a.total >= b.total ? a : b))
    : null
  const isTie = winner !== null && scores.every((s) => s.total === winner.total)

  function goMonth(delta: number) {
    const next = navigateMonth(currentMonth, delta)
    router.push(`/scores?month=${next}`)
  }

  function handleAddReward(e: React.FormEvent) {
    e.preventDefault()
    if (!formTitle.trim() || !currentUser) return
    const fd = new FormData()
    fd.set('title', formTitle.trim())
    fd.set('description', formDesc.trim())
    fd.set('month', currentMonth)
    fd.set('offeredById', String(currentUser.id))
    startTransition(async () => {
      await createReward(fd)
      setFormTitle('')
      setFormDesc('')
      setShowForm(false)
      router.refresh()
    })
  }

  function handleDeleteReward(id: number) {
    startTransition(async () => {
      await deleteReward(id)
      router.refresh()
    })
  }

  const isCurrent = isCurrentMonth(currentMonth)

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-serif text-2xl font-semibold text-ink">Placar</h1>
        <button
          onClick={() => router.push(`/history?month=${currentMonth}`)}
          className="text-[12px] font-semibold text-terracotta"
        >
          Histórico
        </button>
      </div>

      {/* Month selector */}
      <div className="mb-6 flex items-center justify-between rounded-2xl border border-line bg-card px-4 py-3">
        <button onClick={() => goMonth(-1)} className="rounded-lg p-1 text-muted hover:text-ink">
          <ChevronIcon direction="left" />
        </button>
        <span className="text-[14px] font-semibold text-ink">{formatMonthLabel(currentMonth)}</span>
        <button
          onClick={() => goMonth(1)}
          disabled={isCurrent}
          className="rounded-lg p-1 text-muted hover:text-ink disabled:opacity-30"
        >
          <ChevronIcon direction="right" />
        </button>
      </div>

      {/* Winner banner */}
      {total === 0 ? (
        <div className="mb-6 rounded-2xl border border-dashed border-line py-8 text-center">
          <p className="text-[13px] text-muted">
            {isCurrent ? 'Nenhuma tarefa concluída ainda este mês' : 'Sem tarefas concluídas neste mês'}
          </p>
        </div>
      ) : isTie ? (
        <div className="mb-6 rounded-2xl border border-line bg-card px-4 py-4 text-center">
          <p className="font-serif text-lg font-semibold text-ink">Empate!</p>
          <p className="mt-1 text-[12px] text-muted">{total} tarefa{total !== 1 ? 's' : ''} concluída{total !== 1 ? 's' : ''}</p>
        </div>
      ) : winner ? (
        <div className="mb-6 rounded-2xl bg-terracotta px-4 py-4 text-white">
          <div className="flex items-center gap-3">
            <TrophyIcon className="h-8 w-8 flex-shrink-0 opacity-90" />
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide opacity-80">
                {isCurrent ? 'Liderando' : 'Vencedor do mês'}
              </p>
              <p className="font-serif text-xl font-semibold leading-tight">{winner.user.name}</p>
              <p className="text-[12px] opacity-85">
                {winner.total} ponto{winner.total !== 1 ? 's' : ''} · {total} no total
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {/* Score bars */}
      <div className="mb-8 flex flex-col gap-3">
        {scores.map(({ user, total: userTotal }) => {
          const isHenrique = user.name === 'Henrique'
          const pct = maxScore > 0 ? (userTotal / maxScore) * 100 : 0
          return (
            <div key={user.id} className="rounded-2xl border border-line bg-card p-4">
              <div className="mb-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full font-serif text-sm font-semibold text-white ${
                      isHenrique ? 'bg-henrique' : 'bg-josiane'
                    }`}
                  >
                    {user.name[0]}
                  </div>
                  <span className="text-[13.5px] font-semibold text-ink">{user.name}</span>
                </div>
                <span className="font-serif text-2xl font-semibold text-ink">{userTotal}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-line">
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${
                    isHenrique ? 'bg-henrique' : 'bg-josiane'
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="mt-1.5 text-[10.5px] text-muted">
                {userTotal} ponto{userTotal !== 1 ? 's' : ''}
              </p>
            </div>
          )
        })}
      </div>

      {/* Rewards section */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-serif text-[17px] font-semibold text-ink">Premiações</h2>
          <button
            onClick={() => setShowForm(!showForm)}
            className="rounded-full bg-terracotta px-3 py-1.5 text-[11.5px] font-semibold text-white"
          >
            + Adicionar
          </button>
        </div>

        {/* Add reward form */}
        {showForm && (
          <form
            onSubmit={handleAddReward}
            className="mb-4 rounded-2xl border border-terracotta/30 bg-terracotta-soft p-4"
          >
            <p className="mb-3 text-[11.5px] font-semibold text-terracotta">Nova premiação para {formatMonthLabel(currentMonth)}</p>
            <input
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              placeholder="Ex: Jantar no restaurante favorito"
              required
              className="mb-2 w-full rounded-[13px] border border-line bg-card px-4 py-2.5 text-[13px] text-ink placeholder-muted outline-none focus:border-terracotta"
            />
            <textarea
              value={formDesc}
              onChange={(e) => setFormDesc(e.target.value)}
              placeholder="Detalhes (opcional)"
              rows={2}
              className="mb-3 w-full resize-none rounded-[13px] border border-line bg-card px-4 py-2.5 text-[13px] text-ink placeholder-muted outline-none focus:border-terracotta"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={isPending}
                className="flex-1 rounded-[13px] bg-terracotta py-2.5 text-[13px] font-semibold text-white disabled:opacity-60"
              >
                {isPending ? 'Salvando...' : 'Salvar'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-[13px] border border-line bg-card px-4 py-2.5 text-[13px] font-medium text-muted"
              >
                Cancelar
              </button>
            </div>
          </form>
        )}

        {rewards.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line py-8 text-center">
            <GiftIcon className="mx-auto mb-2 h-8 w-8 text-line" />
            <p className="text-[12.5px] text-muted">Nenhuma premiação definida</p>
            <p className="mt-1 text-[11px] text-muted">Adicione um prêmio para motivar quem vencer!</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {rewards.map(({ reward, user: offerer }) => (
              <div
                key={reward.id}
                className="flex items-start gap-3 rounded-2xl border border-line bg-card p-3.5"
              >
                <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-terracotta-soft">
                  <GiftIcon className="h-4 w-4 text-terracotta" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13.5px] font-semibold text-ink">{reward.title}</p>
                  {reward.description && (
                    <p className="mt-0.5 text-[11.5px] text-muted">{reward.description}</p>
                  )}
                  {offerer && (
                    <p className="mt-1 text-[10.5px] text-muted">Oferecido por {offerer.name}</p>
                  )}
                </div>
                <button
                  onClick={() => handleDeleteReward(reward.id)}
                  disabled={isPending}
                  className="flex-shrink-0 rounded-lg p-1.5 text-line hover:bg-red-50 hover:text-red-400"
                >
                  <TrashIcon />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
