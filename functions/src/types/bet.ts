export type Bet = {
  id: string
  userId: string
  contractId: string

  amount: number // bet size; negative if SELL bet
  outcome: 'YES' | 'NO'
  shares: number // dynamic parimutuel pool weight; negative if SELL bet

  probBefore: number
  probAfter: number

  sale?: {
    amount: number // amount user makes from sale
    betId: string // id of bet being sold
  }

  isSold?: boolean // true if this BUY bet has been sold

  createdTime: number
}
