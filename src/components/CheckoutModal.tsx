"use client"

import { useState, useEffect, useRef, type ReactNode } from "react"
import { StripeProvider } from "./StripeProvider"
import { PaymentForm } from "./PaymentForm"

interface CheckoutModalProps {
  isOpen: boolean
  onClose: () => void
  type: "subscription" | "wax_pax"
  productId: string
  productName: string
  amount: number
  onSuccess?: () => void
}

function CloseIcon(): ReactNode {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}

function LoadingSpinner(): ReactNode {
  return (
    <div className="flex items-center justify-center py-12">
      <svg className="animate-spin h-8 w-8 text-[var(--accent-primary)]" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    </div>
  )
}

export function CheckoutModal({
  isOpen,
  onClose,
  type,
  productId,
  productName,
  amount,
  onSuccess,
}: CheckoutModalProps): ReactNode {
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const creatingRef = useRef(false)

  useEffect(() => {
    if (isOpen && !clientSecret && !creatingRef.current) {
      creatingRef.current = true
      createPaymentIntent()
    }
  }, [isOpen, clientSecret])

  async function createPaymentIntent(): Promise<void> {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/stripe/payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, productId }),
      })

      const data = await res.json()

      if (data.success && data.data.clientSecret) {
        setClientSecret(data.data.clientSecret)
      } else {
        setError(data.error || "Failed to initialize payment")
        creatingRef.current = false
      }
    } catch {
      setError("Failed to initialize payment")
      creatingRef.current = false
    } finally {
      setLoading(false)
    }
  }

  function handleClose(): void {
    setClientSecret(null)
    setError(null)
    creatingRef.current = false
    onClose()
  }

  function handleSuccess(): void {
    onSuccess?.()
    setTimeout(handleClose, 2000)
  }

  if (!isOpen) return null

  const showPaymentForm = clientSecret && !loading && !error

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={handleClose} />

      <div className="relative w-full max-w-md mx-4 bg-[--background] border border-[--border] max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-[--border]">
          <div>
            <p className="text-[10px] tracking-[0.3em] uppercase text-[--muted]">Checkout</p>
            <p className="font-bold">{productName}</p>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center border border-[--border] hover:border-white transition"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="p-6">
          {loading && <LoadingSpinner />}

          {error && (
            <div className="p-4 border border-red-500/30 bg-red-500/10">
              <p className="text-sm text-red-400 mb-3">{error}</p>
              <button
                onClick={createPaymentIntent}
                className="text-[11px] tracking-[0.15em] uppercase text-[var(--accent-primary)] hover:underline"
              >
                Try Again
              </button>
            </div>
          )}

          {showPaymentForm && (
            <StripeProvider clientSecret={clientSecret}>
              <PaymentForm
                amount={amount}
                productName={productName}
                onSuccess={handleSuccess}
                onCancel={handleClose}
              />
            </StripeProvider>
          )}
        </div>
      </div>
    </div>
  )
}
