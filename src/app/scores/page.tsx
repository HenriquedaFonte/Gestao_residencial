import { getMonthlyScores, getRewards } from '@/lib/actions'
import { ScoresClient } from '@/components/ScoresClient'
import { getTodayDateString } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function ScoresPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>
}) {
  const { month } = await searchParams
  const today = getTodayDateString()
  const currentMonth = month ?? today.slice(0, 7) // YYYY-MM

  const [year, mon] = currentMonth.split('-').map(Number)
  const [scores, monthRewards] = await Promise.all([
    getMonthlyScores(year, mon),
    getRewards(currentMonth),
  ])

  return (
    <ScoresClient
      scores={scores}
      rewards={monthRewards}
      currentMonth={currentMonth}
    />
  )
}
