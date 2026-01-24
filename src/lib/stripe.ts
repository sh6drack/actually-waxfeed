import Stripe from 'stripe'

// Lazy initialization to avoid errors when STRIPE_SECRET_KEY is not set
let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not set in environment variables')
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-12-15.clover',
      typescript: true,
    })
  }
  return _stripe
}

// For backwards compatibility - will throw if used without STRIPE_SECRET_KEY
export const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-12-15.clover',
      typescript: true,
    })
  : (null as unknown as Stripe)

// ============================================
// SUBSCRIPTION TIERS
// ============================================

export const SUBSCRIPTION_TIERS = {
  WAX_PLUS: {
    name: 'Wax+',
    priceId: process.env.STRIPE_WAX_PLUS_PRICE_ID || 'price_wax_plus',
    monthlyPriceCents: 499,
    monthlyWaxGrant: 300,
    weeklyEarnCap: null, // Unlimited
    earnMultiplier: 1.5,
    standardWaxCost: 3,
    premiumWaxCost: 20,
    goldWaxCost: null, // Not available
    listItemLimit: 100,
    features: [
      '300 Wax monthly',
      'No weekly earn cap',
      '1.5x earn multiplier',
      'Award Premium Wax',
      '100 items per list',
      'Ad-free experience',
      'Unlimited username changes',
    ],
  },
  WAX_PRO: {
    name: 'Wax Pro',
    priceId: process.env.STRIPE_WAX_PRO_PRICE_ID || 'price_wax_pro',
    monthlyPriceCents: 999,
    monthlyWaxGrant: 750,
    weeklyEarnCap: null, // Unlimited
    earnMultiplier: 2.0,
    standardWaxCost: 2,
    premiumWaxCost: 15,
    goldWaxCost: 100,
    listItemLimit: null, // Unlimited
    features: [
      '750 Wax monthly',
      'No weekly earn cap',
      '2x earn multiplier',
      'Award GOLD Wax',
      'Unlimited list items',
      'Full profile analytics',
      'Verified badge eligible',
      'Exclusive badges access',
    ],
  },
} as const

export const FREE_TIER = {
  name: 'Free',
  monthlyWaxGrant: 0,
  weeklyEarnCap: 100,
  earnMultiplier: 1.0,
  standardWaxCost: 5,
  premiumWaxCost: null, // Not available
  goldWaxCost: null, // Not available
  listItemLimit: 50,
  features: [
    'Basic features',
    'Earn up to 100 Wax/week',
    'Award Standard Wax only',
    '50 items per list',
  ],
}

// ============================================
// WAX PAX
// ============================================

export const WAX_PAX = {
  starter: {
    id: 'starter',
    name: 'Starter Pax',
    priceId: process.env.STRIPE_WAX_STARTER_PRICE_ID || 'price_wax_starter',
    priceCents: 99,
    waxAmount: 100,
    bonusPercent: 0,
    popular: false,
  },
  popular: {
    id: 'popular',
    name: 'Popular Pax',
    priceId: process.env.STRIPE_WAX_POPULAR_PRICE_ID || 'price_wax_popular',
    priceCents: 499,
    waxAmount: 550,
    bonusPercent: 10,
    popular: true,
  },
  value: {
    id: 'value',
    name: 'Value Pax',
    priceId: process.env.STRIPE_WAX_VALUE_PRICE_ID || 'price_wax_value',
    priceCents: 999,
    waxAmount: 1200,
    bonusPercent: 20,
    popular: false,
  },
  super: {
    id: 'super',
    name: 'Super Pax',
    priceId: process.env.STRIPE_WAX_SUPER_PRICE_ID || 'price_wax_super',
    priceCents: 1999,
    waxAmount: 2700,
    bonusPercent: 35,
    popular: false,
  },
  mega: {
    id: 'mega',
    name: 'Mega Pax',
    priceId: process.env.STRIPE_WAX_MEGA_PRICE_ID || 'price_wax_mega',
    priceCents: 3999,
    waxAmount: 6000,
    bonusPercent: 50,
    popular: false,
  },
} as const

export type WaxPaxId = keyof typeof WAX_PAX

// ============================================
// WAX EARNING RATES
// ============================================

export const WAX_EARN_RATES = {
  DAILY_LOGIN: 5,
  FIRST_REVIEW_OF_DAY: 10,
  STREAK_BONUS_PER_DAY: 2, // +2 per day, max +20
  STREAK_BONUS_MAX: 20,
  FIRST_ALBUM_REVIEW: 15,
  RECEIVED_STANDARD_WAX: 1,
  RECEIVED_PREMIUM_WAX: 3,
  RECEIVED_GOLD_WAX: 10,
  TRENDING_REVIEW: 50,
  REFERRAL_SIGNUP: 100,
}

// ============================================
// WAX SPENDING COSTS
// ============================================

export const WAX_SPEND_COSTS = {
  // Tier-based costs defined in SUBSCRIPTION_TIERS
  BOOST_REVIEW_24H: 50,
  BOOST_REVIEW_7D: 250,
  PIN_REVIEW: 25,
  USERNAME_CHANGE: 500,
  TASTEID_ANALYSIS: 50,
  UNLOCK_STATS: 100,
}

// ============================================
// HELPER FUNCTIONS
// ============================================

export function getWaxPackByPriceId(priceId: string) {
  return Object.values(WAX_PAX).find(pack => pack.priceId === priceId)
}

export function getSubscriptionByPriceId(priceId: string) {
  if (SUBSCRIPTION_TIERS.WAX_PLUS.priceId === priceId) return { tier: 'WAX_PLUS', ...SUBSCRIPTION_TIERS.WAX_PLUS }
  if (SUBSCRIPTION_TIERS.WAX_PRO.priceId === priceId) return { tier: 'WAX_PRO', ...SUBSCRIPTION_TIERS.WAX_PRO }
  return null
}

export function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`
}
