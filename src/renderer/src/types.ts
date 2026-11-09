import type { MethodResult } from '@core/pipeline'

export type LoadedImage = {
  name: string
  gray: Float32Array
}

export type CompressionView = {
  dct: MethodResult
  dwt: MethodResult
  dctSpectrum: Float32Array
  dwtSpectrum: Float32Array
  dctMs: number
  dwtMs: number
}

export type SweepRow = {
  method: 'DCT' | 'DWT'
  keepPercent: number
  kept: number
  total: number
  psnr: number
}
