// components/orders/SuccessContent.tsx
'use client'

import { useEffect, useState } from 'react'
import BrandLogo from "@/components/BrandLogo";
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createOrder } from '@/lib/actions/order.actions'

const SuccessContent = () => {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [orderId, setOrderId] = useState('')

  useEffect(() => {
    if (!sessionId) {
      setStatus('error')
      return
    }

    const saveOrder = async () => {
      try {
        // Verify session and get metadata from our API
        const res = await fetch(`/api/stripe/verify?session_id=${sessionId}`)
        if (!res.ok) throw new Error('Session verification failed')

        const { metadata } = await res.json()

        if (!metadata?.userId || !metadata?.patientId) {
          throw new Error('Missing order metadata')
        }

        // Save the paid order to Supabase after Stripe confirms payment.
        const order = await createOrder({
          userId: metadata.userId,
          patientId: metadata.patientId,
          cartItems: JSON.parse(metadata.cartItems),
          totalAmount: parseFloat(metadata.totalAmount),
          deliveryAddress: metadata.deliveryAddress,
          paymentMethod: metadata.paymentMethod ?? 'card',
          paymentStatus: 'paid',  // ✅ Stripe payment confirmed
        })

        if (order) {
          setOrderId(order.$id)
          setStatus('success')
        } else {
          setStatus('error')
        }
      } catch (err) {
        console.error('Error saving order:', err)
        setStatus('error')
      }
    }

    saveOrder()
  }, [sessionId])

  return (
    <div className="min-h-screen bg-dark-200 flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-md rounded-2xl border border-dark-500 bg-dark-400 p-8 text-center space-y-6">
        {/* Logo */}
        <BrandLogo alt="carepulse" className="h-8 w-fit mx-auto" />

        {/* Loading */}
        {status === 'loading' && (
          <div className="space-y-4">
            <div className="size-12 rounded-full border-4 border-green-500 border-t-transparent animate-spin mx-auto" />
            <p className="text-14-regular text-dark-700">Saving your order...</p>
          </div>
        )}

        {/* Success */}
        {status === 'success' && (
          <div className="space-y-4">
            <div className="text-6xl">🎉</div>
            <h1 className="text-24-bold text-white">Order Placed!</h1>
            <p className="text-14-regular text-dark-700">
              Your payment was successful and your order has been recorded.
            </p>
            {orderId && (
              <div className="rounded-lg bg-dark-300 px-4 py-3">
                <p className="text-12-regular text-dark-600">Order ID</p>
                <p className="text-14-medium text-green-500 font-mono">
                  #{orderId.slice(-8).toUpperCase()}
                </p>
              </div>
            )}
            <p className="text-12-regular text-dark-600">
              We&apos;ll start processing your order shortly.
            </p>
            <div className="flex flex-col gap-3 pt-2">
              <Link
                href="/dashboard"
                className="shad-primary-btn rounded-md py-3 text-14-medium text-center"
              >
                View My Orders
              </Link>
              <Link
                href="/product"
                className="shad-gray-btn rounded-md py-3 text-14-medium text-center"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        )}

        {/* Error */}
        {status === 'error' && (
          <div className="space-y-4">
            <div className="text-6xl">⚠️</div>
            <h1 className="text-24-bold text-white">Something went wrong</h1>
            <p className="text-14-regular text-dark-700">
              Your payment may have gone through but we couldn&apos;t save your order.
              Please contact support with your session ID.
            </p>
            {sessionId && (
              <div className="rounded-lg bg-dark-300 px-4 py-3">
                <p className="text-12-regular text-dark-600">Session ID</p>
                <p className="text-12-regular text-dark-600 font-mono break-all">
                  {sessionId}
                </p>
              </div>
            )}
            <Link
              href="/product"
              className="shad-gray-btn rounded-md py-3 text-14-medium text-center block"
            >
              Back to Pharmacy
            </Link>
          </div>
        )}
      </div>

      <p className="text-14-regular text-dark-600 mt-8">© 2026 CarePulse</p>
    </div>
  )
}

export default SuccessContent
