import Stripe from 'stripe'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

// Load env from project root
dotenv.config({ path: resolve(__dirname, '../.env') })

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-12-15.clover',
})

async function createProducts() {
  console.log('Creating Stripe products and prices...\n')

  const results: Record<string, string> = {}

  // Subscription Products
  const subscriptions = [
    { name: 'Wax+', price: 499, envKey: 'STRIPE_WAX_PLUS_PRICE_ID' },
    { name: 'Wax Pro', price: 999, envKey: 'STRIPE_WAX_PRO_PRICE_ID' },
  ]

  for (const sub of subscriptions) {
    const product = await stripe.products.create({
      name: sub.name,
      description: `${sub.name} monthly subscription`,
    })

    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: sub.price,
      currency: 'usd',
      recurring: { interval: 'month' },
    })

    results[sub.envKey] = price.id
    console.log(`✓ ${sub.name}: ${price.id}`)
  }

  // One-time Wax Pax
  const waxPax = [
    { name: 'Starter Pax', price: 99, wax: 100, envKey: 'STRIPE_WAX_STARTER_PRICE_ID' },
    { name: 'Popular Pax', price: 499, wax: 550, envKey: 'STRIPE_WAX_POPULAR_PRICE_ID' },
    { name: 'Value Pax', price: 999, wax: 1200, envKey: 'STRIPE_WAX_VALUE_PRICE_ID' },
    { name: 'Super Pax', price: 1999, wax: 2700, envKey: 'STRIPE_WAX_SUPER_PRICE_ID' },
    { name: 'Mega Pax', price: 3999, wax: 6000, envKey: 'STRIPE_WAX_MEGA_PRICE_ID' },
  ]

  for (const pax of waxPax) {
    const product = await stripe.products.create({
      name: pax.name,
      description: `${pax.wax} Wax one-time purchase`,
    })

    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: pax.price,
      currency: 'usd',
    })

    results[pax.envKey] = price.id
    console.log(`✓ ${pax.name}: ${price.id}`)
  }

  console.log('\n--- Add these to your .env file ---\n')
  for (const [key, value] of Object.entries(results)) {
    console.log(`${key}="${value}"`)
  }
}

createProducts().catch(console.error)
