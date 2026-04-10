export interface CurrencyMeta {
  code: string
  label: string   // shown in dropdown
  symbol: string  // shown inline
}

export const CURRENCIES: CurrencyMeta[] = [
  { code: 'TWD', label: '台幣 (TWD)',        symbol: 'NT$' },
  { code: 'USD', label: '美元 (USD)',         symbol: '$'   },
  { code: 'JPY', label: '日圓 (JPY)',         symbol: '¥'   },
  { code: 'EUR', label: '歐元 (EUR)',         symbol: '€'   },
  { code: 'KRW', label: '韓元 (KRW)',         symbol: '₩'   },
  { code: 'CNY', label: '人民幣 (CNY)',       symbol: '¥'   },
  { code: 'HKD', label: '港幣 (HKD)',         symbol: 'HK$' },
  { code: 'SGD', label: '新加坡元 (SGD)',     symbol: 'S$'  },
  { code: 'THB', label: '泰銖 (THB)',         symbol: '฿'   },
  { code: 'GBP', label: '英鎊 (GBP)',         symbol: '£'   },
  { code: 'AUD', label: '澳幣 (AUD)',         symbol: 'A$'  },
  { code: 'MYR', label: '馬幣 (MYR)',         symbol: 'RM'  },
  { code: 'VND', label: '越南盾 (VND)',       symbol: '₫'   },
]

export const CURRENCY_MAP = Object.fromEntries(
  CURRENCIES.map((c) => [c.code, c])
) as Record<string, CurrencyMeta>

export function getCurrencySymbol(code?: string | null): string {
  return CURRENCY_MAP[code ?? 'TWD']?.symbol ?? code ?? ''
}

// ── Exchange rate fetch (open.er-api.com, no API key required) ────────────────

const CACHE_TTL_MS = 60 * 60 * 1000   // 1 hour

interface RateCache {
  base: string
  rates: Record<string, number>
  fetchedAt: number
}

function getCachedRates(base: string): Record<string, number> | null {
  try {
    const raw = sessionStorage.getItem(`fx_${base}`)
    if (!raw) return null
    const cache: RateCache = JSON.parse(raw)
    if (Date.now() - cache.fetchedAt > CACHE_TTL_MS) return null
    return cache.rates
  } catch {
    return null
  }
}

function setCachedRates(base: string, rates: Record<string, number>) {
  try {
    const cache: RateCache = { base, rates, fetchedAt: Date.now() }
    sessionStorage.setItem(`fx_${base}`, JSON.stringify(cache))
  } catch {}
}

/**
 * Returns exchange rates relative to `base`.
 * e.g. fetchRates('TWD') → { USD: 0.031, JPY: 4.7, ... }
 */
export async function fetchRates(base: string): Promise<Record<string, number>> {
  const cached = getCachedRates(base)
  if (cached) return cached

  const res = await fetch(`https://open.er-api.com/v6/latest/${base}`)
  if (!res.ok) throw new Error(`Exchange rate fetch failed: ${res.status}`)
  const data = await res.json()
  const rates: Record<string, number> = data.rates ?? {}
  setCachedRates(base, rates)
  return rates
}

/**
 * How many units of `to` equals 1 unit of `from`.
 * e.g. getRate('USD', 'TWD') ≈ 32.5  (1 USD = 32.5 TWD)
 */
export async function getRate(from: string, to: string): Promise<number> {
  if (from === to) return 1
  const rates = await fetchRates(from)
  return rates[to] ?? 1
}

/** Converts an amount from `from` currency to `to` currency using a stored rate */
export function convertAmount(amount: number, exchangeRate: number): number {
  return Math.round(amount * exchangeRate * 100) / 100
}
