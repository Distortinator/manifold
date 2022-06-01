import { addCpmmLiquidity, getCpmmLiquidity } from './calculate-cpmm'
import { CPMMContract } from './contract'
import { LiquidityProvision } from './liquidity-provision'
import { User } from './user'

export const getNewLiquidityProvision = (
  user: User,
  amount: number,
  contract: CPMMContract,
  newLiquidityProvisionId: string
) => {
  const { pool, p, totalLiquidity } = contract

  const { newPool, newP } = addCpmmLiquidity(pool, p, amount)

  const liquidity =
    getCpmmLiquidity(newPool, newP) - getCpmmLiquidity(pool, newP)

  const newLiquidityProvision: LiquidityProvision = {
    id: newLiquidityProvisionId,
    userId: user.id,
    contractId: contract.id,
    amount,
    pool: newPool,
    p: newP,
    liquidity,
    createdTime: Date.now(),
  }

  const newTotalLiquidity = (totalLiquidity ?? 0) + amount

  return { newLiquidityProvision, newPool, newP, newTotalLiquidity }
}
