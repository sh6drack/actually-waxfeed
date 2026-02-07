"use client"

import { Elements } from "@stripe/react-stripe-js"
import { loadStripe, type Appearance } from "@stripe/stripe-js"

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!.trim()
)

const appearance: Appearance = {
  theme: "night",
  variables: {
    colorPrimary: "#D4AF37", // Gold accent
    colorBackground: "#0a0a0a",
    colorText: "#ffffff",
    colorDanger: "#ef4444",
    fontFamily: "system-ui, sans-serif",
    spacingUnit: "4px",
    borderRadius: "0px",
  },
  rules: {
    ".Input": {
      backgroundColor: "#141414",
      border: "1px solid #333",
    },
    ".Input:focus": {
      border: "1px solid #D4AF37",
      boxShadow: "none",
    },
    ".Label": {
      color: "#888",
      fontSize: "11px",
      letterSpacing: "0.1em",
      textTransform: "uppercase",
    },
    ".Tab": {
      backgroundColor: "#0a0a0a",
      border: "1px solid #333",
    },
    ".Tab--selected": {
      backgroundColor: "#141414",
      borderColor: "#D4AF37",
    },
  },
}

interface StripeProviderProps {
  children: React.ReactNode
  clientSecret?: string
}

export function StripeProvider({ children, clientSecret }: StripeProviderProps) {
  const options = clientSecret
    ? {
        clientSecret,
        appearance,
      }
    : { appearance }

  return (
    <Elements stripe={stripePromise} options={options}>
      {children}
    </Elements>
  )
}

export { stripePromise }
