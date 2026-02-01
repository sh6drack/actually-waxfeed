#!/usr/bin/env node

/**
 * Setup Stripe Products and Prices for WAXFEED
 * Run this script to create all products and prices in your Stripe account
 *
 * Usage: node scripts/setup-stripe-products.mjs
 */

import Stripe from 'stripe'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Load environment variables
const envPath = path.join(__dirname, '..', '.env.local')
const envContent = fs.readFileSync(envPath, 'utf8')
const envVars = {}
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=["']?(.*)["']?$/)
  if (match) {
    envVars[match[1]] = match[2].replace(/["']$/, '')
  }
})

const STRIPE_SECRET_KEY = envVars.STRIPE_SECRET_KEY

if (!STRIPE_SECRET_KEY) {
  console.error('STRIPE_SECRET_KEY not found in .env.local')
  process.exit(1)
}

console.log(`Using Stripe account: ${STRIPE_SECRET_KEY.startsWith('sk_live') ? 'LIVE' : 'TEST'}`)

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia',
})

// Product definitions
const SUBSCRIPTION_PRODUCTS = [
  {
    name: 'Wax+',
    description: 'Monthly subscription with Trending Radar and premium features',
    metadata: { tier: 'WAX_PLUS' },
    price: {
      unit_amount: 499,
      currency: 'usd',
      recurring: { interval: 'month' },
      envKey: 'STRIPE_WAX_PLUS_PRICE_ID',
    },
  },
  {
    name: 'Wax Pro',
    description: 'Premium subscription with GOLD tips, analytics, and verified badge eligibility',
    metadata: { tier: 'WAX_PRO' },
    price: {
      unit_amount: 999,
      currency: 'usd',
      recurring: { interval: 'month' },
      envKey: 'STRIPE_WAX_PRO_PRICE_ID',
    },
  },
]

const WAX_PAX_PRODUCTS = [
  {
    name: 'Starter Pax',
    description: '100 Wax',
    metadata: { paxId: 'starter', waxAmount: '100' },
    price: {
      unit_amount: 99,
      currency: 'usd',
      envKey: 'STRIPE_WAX_STARTER_PRICE_ID',
    },
  },
  {
    name: 'Popular Pax',
    description: '550 Wax (+10% bonus)',
    metadata: { paxId: 'popular', waxAmount: '550' },
    price: {
      unit_amount: 499,
      currency: 'usd',
      envKey: 'STRIPE_WAX_POPULAR_PRICE_ID',
    },
  },
  {
    name: 'Value Pax',
    description: '1,200 Wax (+20% bonus)',
    metadata: { paxId: 'value', waxAmount: '1200' },
    price: {
      unit_amount: 999,
      currency: 'usd',
      envKey: 'STRIPE_WAX_VALUE_PRICE_ID',
    },
  },
  {
    name: 'Super Pax',
    description: '2,700 Wax (+35% bonus)',
    metadata: { paxId: 'super', waxAmount: '2700' },
    price: {
      unit_amount: 1999,
      currency: 'usd',
      envKey: 'STRIPE_WAX_SUPER_PRICE_ID',
    },
  },
  {
    name: 'Mega Pax',
    description: '6,000 Wax (+50% bonus)',
    metadata: { paxId: 'mega', waxAmount: '6000' },
    price: {
      unit_amount: 3999,
      currency: 'usd',
      envKey: 'STRIPE_WAX_MEGA_PRICE_ID',
    },
  },
]

async function createProductWithPrice(productData) {
  const { name, description, metadata, price } = productData

  // Check if product already exists
  const existingProducts = await stripe.products.list({ limit: 100 })
  let product = existingProducts.data.find(p => p.name === name && p.active)

  if (!product) {
    console.log(`Creating product: ${name}`)
    product = await stripe.products.create({
      name,
      description,
      metadata,
    })
    console.log(`  Created product: ${product.id}`)
  } else {
    console.log(`Product already exists: ${name} (${product.id})`)
  }

  // Check if price already exists for this product
  const existingPrices = await stripe.prices.list({ product: product.id, limit: 100 })
  const matchingPrice = existingPrices.data.find(p =>
    p.unit_amount === price.unit_amount &&
    p.currency === price.currency &&
    p.active &&
    (price.recurring ? p.recurring?.interval === price.recurring.interval : !p.recurring)
  )

  if (matchingPrice) {
    console.log(`  Price already exists: ${matchingPrice.id}`)
    return { product, price: matchingPrice, envKey: price.envKey }
  }

  console.log(`  Creating price: $${(price.unit_amount / 100).toFixed(2)} ${price.recurring ? '/month' : 'one-time'}`)
  const priceObj = await stripe.prices.create({
    product: product.id,
    unit_amount: price.unit_amount,
    currency: price.currency,
    recurring: price.recurring,
  })
  console.log(`  Created price: ${priceObj.id}`)

  return { product, price: priceObj, envKey: price.envKey }
}

async function main() {
  console.log('\n=== Setting up Stripe Products for WAXFEED ===\n')

  const results = []

  console.log('--- Subscription Products ---')
  for (const sub of SUBSCRIPTION_PRODUCTS) {
    const result = await createProductWithPrice(sub)
    results.push(result)
  }

  console.log('\n--- Wax Pax Products ---')
  for (const pax of WAX_PAX_PRODUCTS) {
    const result = await createProductWithPrice(pax)
    results.push(result)
  }

  // Generate env updates
  console.log('\n=== Environment Variables to Update ===\n')
  console.log('Add these to your .env.local:\n')

  for (const { envKey, price } of results) {
    console.log(`${envKey}="${price.id}"`)
  }

  // Get the publishable key info
  console.log('\n=== Publishable Key ===\n')
  console.log('You also need to add your LIVE publishable key.')
  console.log('Get it from: https://dashboard.stripe.com/apikeys')
  console.log('Look for the key starting with pk_live_...')
  console.log('\nNEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_..."')

  // Auto-update .env.local
  console.log('\n=== Updating .env.local ===\n')

  let newEnvContent = envContent
  for (const { envKey, price } of results) {
    const regex = new RegExp(`^${envKey}=.*$`, 'm')
    if (regex.test(newEnvContent)) {
      newEnvContent = newEnvContent.replace(regex, `${envKey}="${price.id}"`)
      console.log(`Updated: ${envKey}`)
    } else {
      newEnvContent += `\n${envKey}="${price.id}"`
      console.log(`Added: ${envKey}`)
    }
  }

  fs.writeFileSync(envPath, newEnvContent)
  console.log('\n.env.local has been updated!')

  console.log('\n=== Setup Complete! ===\n')
  console.log('Next steps:')
  console.log('1. Get your LIVE publishable key from Stripe Dashboard')
  console.log('2. Update NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY in .env.local')
  console.log('3. Set up webhook endpoint in Stripe Dashboard')
  console.log('4. Update STRIPE_WEBHOOK_SECRET with the webhook signing secret')
  console.log('5. Restart your dev server')
}

main().catch(console.error)
