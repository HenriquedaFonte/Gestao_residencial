import { getLifetimeBalances, getPrizes, getRedemptionHistory } from '@/lib/actions'
import { StoreClient } from '@/components/StoreClient'

export const dynamic = 'force-dynamic'

export default async function StorePage() {
  const [balances, prizeList, history] = await Promise.all([
    getLifetimeBalances(),
    getPrizes(),
    getRedemptionHistory(),
  ])

  return <StoreClient balances={balances} prizes={prizeList} history={history} />
}
