'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createPrize, deletePrize, togglePrizeActive, redeemPrize } from '@/lib/actions'
import { useCurrentUser } from './UserContext'
import { Prize, PrizeRedemption, User } from '@/db/schema'

type BalanceEntry = { user: User; earned: number; spent: number; balance: number }
type HistoryEntry = { redemption: PrizeRedemption; user: User | null }

type Props = {
  balances: BalanceEntry[]
  prizes: Prize[]
  history: HistoryEntry[]
}

function GiftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 1 0 9.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1 1 14.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
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

function formatDateTime(date: Date | string, timeZone = 'America/Toronto') {
  const d = new Date(date)
  const day = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', timeZone })
  const time = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone })
  return `${day} · ${time}`
}

export function StoreClient({ balances, prizes, history }: Props) {
  const router = useRouter()
  const { currentUser } = useCurrentUser()
  const [isPending, startTransition] = useTransition()
  const [showForm, setShowForm] = useState(false)
  const [formTitle, setFormTitle] = useState('')
  const [formDesc, setFormDesc] = useState('')
  const [formCost, setFormCost] = useState(10)
  const [error, setError] = useState('')
  const [showManage, setShowManage] = useState(false)

  const myBalance = balances.find((b) => b.user.id === currentUser?.id)?.balance ?? 0
  const activePrizes = prizes.filter((p) => p.active)
  const inactivePrizes = prizes.filter((p) => !p.active)

  function handleAddPrize(e: React.FormEvent) {
    e.preventDefault()
    if (!formTitle.trim() || !currentUser) return
    const fd = new FormData()
    fd.set('title', formTitle.trim())
    fd.set('description', formDesc.trim())
    fd.set('pointsCost', String(formCost))
    fd.set('createdById', String(currentUser.id))
    startTransition(async () => {
      await createPrize(fd)
      setFormTitle('')
      setFormDesc('')
      setFormCost(10)
      setShowForm(false)
      router.refresh()
    })
  }

  function handleRedeem(prize: Prize) {
    if (!currentUser) return
    setError('')
    startTransition(async () => {
      const result = await redeemPrize(prize.id, currentUser.id, currentUser.name)
      if (!result.success) {
        setError(result.error ?? 'Não foi possível resgatar.')
      }
      router.refresh()
    })
  }

  function handleToggleActive(id: number, active: boolean) {
    startTransition(async () => {
      await togglePrizeActive(id, active)
      router.refresh()
    })
  }

  function handleDeletePrize(id: number) {
    startTransition(async () => {
      await deletePrize(id)
      router.refresh()
    })
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-serif text-2xl font-semibold text-ink">Loja de Prêmios</h1>
        <button
          onClick={() => router.push('/scores')}
          className="text-[12px] font-semibold text-terracotta"
        >
          Ver placar
        </button>
      </div>

      {/* Balances */}
      <div className="mb-8 flex flex-col gap-3">
        {balances.map(({ user, balance }) => {
          const isHenrique = user.name === 'Henrique'
          return (
            <div key={user.id} className="rounded-2xl border border-line bg-card p-4">
              <div className="flex items-center justify-between">
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
                <span className="font-serif text-2xl font-semibold text-ink">{balance}</span>
              </div>
              <p className="mt-1.5 text-[10.5px] text-muted">
                {balance} ponto{balance !== 1 ? 's' : ''} disponíve{balance !== 1 ? 'is' : 'l'} para troca
              </p>
            </div>
          )
        })}
      </div>

      {error && (
        <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
      )}

      {/* Available prizes */}
      <div className="mb-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-serif text-[17px] font-semibold text-ink">Prêmios disponíveis</h2>
          <button
            onClick={() => setShowForm(!showForm)}
            className="rounded-full bg-terracotta px-3 py-1.5 text-[11.5px] font-semibold text-white"
          >
            + Adicionar
          </button>
        </div>

        {showForm && (
          <form
            onSubmit={handleAddPrize}
            className="mb-4 rounded-2xl border border-terracotta/30 bg-terracotta-soft p-4"
          >
            <p className="mb-3 text-[11.5px] font-semibold text-terracotta">Novo prêmio</p>
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
            <div className="mb-3 flex items-center gap-3">
              <span className="text-[12.5px] text-muted">Custo em pontos</span>
              <input
                type="number"
                min={1}
                value={formCost}
                onChange={(e) => setFormCost(Math.max(1, Number(e.target.value) || 1))}
                className="w-20 rounded-[13px] border border-line bg-card px-3 py-2 text-center text-[13px] font-semibold text-ink outline-none focus:border-terracotta"
              />
            </div>
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

        {activePrizes.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line py-8 text-center">
            <GiftIcon className="mx-auto mb-2 h-8 w-8 text-line" />
            <p className="text-[12.5px] text-muted">Nenhum prêmio cadastrado</p>
            <p className="mt-1 text-[11px] text-muted">Adicione um prêmio para trocar por pontos!</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {activePrizes.map((prize) => {
              const canAfford = myBalance >= prize.pointsCost
              return (
                <div
                  key={prize.id}
                  className="flex items-start gap-3 rounded-2xl border border-line bg-card p-3.5"
                >
                  <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-terracotta-soft">
                    <GiftIcon className="h-4 w-4 text-terracotta" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13.5px] font-semibold text-ink">{prize.title}</p>
                    {prize.description && (
                      <p className="mt-0.5 text-[11.5px] text-muted">{prize.description}</p>
                    )}
                    <p className="mt-1 text-[10.5px] font-semibold text-terracotta">
                      {prize.pointsCost} ponto{prize.pointsCost !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRedeem(prize)}
                    disabled={isPending || !canAfford}
                    className={`flex-shrink-0 rounded-full px-3 py-1.5 text-[11.5px] font-semibold transition-colors ${
                      canAfford
                        ? 'bg-terracotta text-white'
                        : 'bg-line/40 text-muted'
                    } disabled:opacity-60`}
                  >
                    Resgatar
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Manage prizes (toggle active / delete) */}
      <div className="mb-8">
        <button
          onClick={() => setShowManage(!showManage)}
          className="text-[12px] font-semibold text-muted"
        >
          {showManage ? 'Ocultar gerenciamento' : 'Gerenciar prêmios'}
        </button>

        {showManage && (
          <div className="mt-3 flex flex-col gap-2">
            {prizes.length === 0 && (
              <p className="text-[12px] text-muted">Nenhum prêmio cadastrado ainda.</p>
            )}
            {[...activePrizes, ...inactivePrizes].map((prize) => (
              <div
                key={prize.id}
                className={`flex items-center gap-3 rounded-2xl border p-3 ${
                  prize.active ? 'border-line bg-card' : 'border-line bg-line/10'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <p className={`text-[12.5px] font-semibold ${prize.active ? 'text-ink' : 'text-muted'}`}>
                    {prize.title}
                  </p>
                  <p className="text-[10.5px] text-muted">{prize.pointsCost} pontos {!prize.active && '· pausado'}</p>
                </div>
                <button
                  onClick={() => handleToggleActive(prize.id, !prize.active)}
                  disabled={isPending}
                  className="rounded-lg border border-line bg-card px-2.5 py-1 text-[11px] font-medium text-muted"
                >
                  {prize.active ? 'Pausar' : 'Reativar'}
                </button>
                <button
                  onClick={() => handleDeletePrize(prize.id)}
                  disabled={isPending}
                  className="rounded-lg p-1.5 text-line hover:bg-red-50 hover:text-red-400"
                >
                  <TrashIcon />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Redemption history */}
      <div>
        <h2 className="mb-3 font-serif text-[17px] font-semibold text-ink">Resgates recentes</h2>
        {history.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line py-8 text-center">
            <p className="text-[12.5px] text-muted">Nenhum resgate ainda</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {history.map(({ redemption, user }) => {
              const isHenrique = user?.name === 'Henrique'
              return (
                <div
                  key={redemption.id}
                  className="flex items-center gap-3 rounded-2xl border border-line bg-card p-3"
                >
                  <div
                    className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full font-serif text-xs font-semibold text-white ${
                      user ? (isHenrique ? 'bg-henrique' : 'bg-josiane') : 'bg-line'
                    }`}
                  >
                    {user ? user.name[0] : '?'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12.5px] font-semibold text-ink">{redemption.prizeTitle}</p>
                    <p className="text-[10.5px] text-muted">
                      {user?.name ?? 'Desconhecido'} · {formatDateTime(redemption.redeemedAt)}
                    </p>
                  </div>
                  <span className="flex-shrink-0 text-[12px] font-semibold text-terracotta">
                    -{redemption.pointsCost} pts
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
