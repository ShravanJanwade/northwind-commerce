import { money, type Money } from './money.ts';

/**
 * Splits an amount in proportion to `weights` without losing a cent: each
 * share is rounded down, then the leftover cents go to the shares with the
 * largest remainders. Used to spread an order-level discount over its lines.
 */
export function allocate(value: Money, weights: readonly number[]): Money[] {
  if (weights.length === 0) throw new RangeError('allocate needs at least one weight');
  if (weights.some((w) => w < 0 || !Number.isFinite(w))) throw new RangeError('Weights must be finite and non-negative');
  const total = weights.reduce((a, b) => a + b, 0);
  if (total === 0) return weights.map(() => money(0, value.currency));

  const sign = value.amount < 0 ? -1 : 1;
  const amount = Math.abs(value.amount);
  const exact = weights.map((w) => (amount * w) / total);
  const shares = exact.map(Math.floor);
  let leftover = amount - shares.reduce((a, b) => a + b, 0);

  const byRemainder = exact
    .map((share, index) => ({ index, remainder: share - Math.floor(share) }))
    .sort((a, b) => b.remainder - a.remainder || a.index - b.index);
  for (const { index } of byRemainder) {
    if (leftover === 0) break;
    shares[index] = (shares[index] ?? 0) + 1;
    leftover -= 1;
  }
  return shares.map((share) => money(sign * share, value.currency));
}
