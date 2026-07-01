import { getTaskHistory, getUsers } from '@/lib/actions'
import { HistoryClient } from '@/components/HistoryClient'
import { getTodayDateString } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; user?: string }>
}) {
  const { month, user } = await searchParams
  const today = getTodayDateString()
  const currentMonth = month ?? today.slice(0, 7)
  const userId = user ? Number(user) : undefined

  const [year, mon] = currentMonth.split('-').map(Number)
  const [history, allUsers] = await Promise.all([
    getTaskHistory(year, mon, userId),
    getUsers(),
  ])

  return (
    <HistoryClient
      history={history}
      users={allUsers}
      currentMonth={currentMonth}
      selectedUserId={userId}
    />
  )
}
