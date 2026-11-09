import type { MethodResult } from '@core/pipeline'

export function formatPsnr(value: number): string {
  return Number.isFinite(value) ? `${value.toFixed(2)} dB` : '∞ dB'
}

export function sharePercent(result: MethodResult): number {
  return result.total > 0 ? (result.kept / result.total) * 100 : 0
}
