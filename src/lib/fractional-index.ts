export function getPositionBetween(
  before: number | null,
  after:  number | null
): number {
  if (before === null && after === null) return 1.0
  if (before === null) return after! / 2
  if (after  === null) return before + 1.0
  return (before + after) / 2
}