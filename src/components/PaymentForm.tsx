"use client"

import { useState } from "react"
import {
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js"

interface PaymentFormProps {
  amount: number
  productName: string
  onSuccess?: () => void
  onCancel?: () => void
  returnUrl?: string
}

export function PaymentForm({
  amount,
  productName,
  onSuccess,
  onCancel,
  returnUrl,
}: PaymentFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [error, setError] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)
  const [succeeded, setSucceeded] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setProcessing(true)
    setError(null)

    const baseUrl = typeof window !== "undefined" ? window.location.origin : ""
    const successUrl = returnUrl || `${baseUrl}/wallet?purchase=success`

    const { error: submitError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: successUrl,
      },
      redirect: "if_required",
    })

    if (submitError) {
      setError(submitError.message || "Payment failed")
      setProcessing(false)
    } else {
      setSucceeded(true)
      onSuccess?.()
    }
  }

  if (succeeded) {
    return (
      <div className="p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 border-2 border-green-500 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-green-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <p className="text-lg font-bold mb-2">Payment Successful</p>
        <p className="text-sm text-[--muted]">
          Your {productName} has been added to your account.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Order Summary */}
      <div className="p-4 border border-[--border] bg-white/[0.02]">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-[10px] tracking-[0.2em] uppercase text-[--muted] mb-1">
              Order
            </p>
            <p className="font-medium">{productName}</p>
          </div>
          <p className="text-2xl font-bold">${(amount / 100).toFixed(2)}</p>
        </div>
      </div>

      {/* Stripe Payment Element */}
      <div className="min-h-[200px]">
        <PaymentElement
          options={{
            layout: "tabs",
          }}
        />
      </div>

      {error && (
        <div className="p-3 border border-red-500/30 bg-red-500/10">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={processing}
            className="flex-1 py-3 px-4 border border-[--border] text-[11px] tracking-[0.15em] uppercase hover:border-white transition disabled:opacity-50"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={!stripe || processing}
          className="flex-1 py-4 bg-[var(--accent-primary)] text-black text-[11px] tracking-[0.15em] uppercase font-bold hover:bg-[var(--accent-hover)] transition disabled:opacity-50"
        >
          {processing ? (
            <span className="flex items-center justify-center gap-2">
              <svg
                className="animate-spin h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Processing...
            </span>
          ) : (
            `Pay $${(amount / 100).toFixed(2)}`
          )}
        </button>
      </div>

      {/* Security note */}
      <p className="text-[10px] text-center text-[--muted] flex items-center justify-center gap-1">
        <svg
          className="w-3 h-3"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
        Secured by Stripe. Your payment info is never stored on our servers.
      </p>
    </form>
  )
}
