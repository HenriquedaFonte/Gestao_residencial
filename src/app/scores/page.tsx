import { getMonthlyScores, getRewards, getMonthlyWinner, finalizeMonthlyWinnerIfNeeded } from '@/lib/actions'
import { ScoresClient } from '@/components/ScoresClient'
import { getTodayDateString } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function ScoresPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>
}) {
  await finalizeMonthlyWinnerIfNeeded()

  const { month } = await searchParams
  const today = getTodayDateString()
  const currentMonth = month ?? today.slice(0, 7) // YYYY-MM

  const [year, mon] = currentMonth.split('-').map(Number)
  const [scores, monthRewards, finalizedWinner] = await Promise.all([
    getMonthlyScores(year, mon),
    getRewards(currentMonth),
    getMonthlyWinner(currentMonth),
  ])

  return (
    <ScoresClient
      scores={scores}
      rewards={monthRewards}
      currentMonth={currentMonth}
      finalizedWinner={finalizedWinner}
    />
  )
}
