const STROOPS_PER_XLM = 10_000_000;

export function stroopsToXlm(stroops: bigint | number): string {
  return (Number(stroops) / STROOPS_PER_XLM).toFixed(2);
}

export function xlmToStroops(xlm: number): bigint {
  return BigInt(Math.round(xlm * STROOPS_PER_XLM));
}
