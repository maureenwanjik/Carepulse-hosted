'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useStateContext } from '@/components/context/StateContext'
import { AiOutlineMinus, AiOutlinePlus, AiOutlineLeft, AiOutlineShopping } from 'react-icons/ai'
import { TiDeleteOutline } from 'react-icons/ti'
import getStripe from '@/lib/getStripe'
import toast from 'react-hot-toast'

const Cart: React.FC = () => {
  const {
    totalPrice,
    totalQuantities,
    cartItems,
    setShowCart,
    toggleCartItemQuantity,
    onRemove,
  } = useStateContext()

  const cartRef = useRef<HTMLDivElement>(null)
  const [step, setStep] = useState<'cart' | 'address'>('cart')
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [addressError, setAddressError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Get userId and patientId from cookies via a fetch
  const [userId, setUserId] = useState('')
  const [patientId, setPatientId] = useState('')

  useEffect(() => {
    // Fetch user context from a simple API route
    fetch('/api/user-context')
      .then((r) => r.json())
      .then((data) => {
        setUserId(data.userId ?? '')
        setPatientId(data.patientId ?? '')
      })
      .catch(() => {})
  }, [])

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (cartRef.current && !cartRef.current.contains(event.target as Node)) {
        setShowCart(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [setShowCart])

  const handleProceedToAddress = () => {
    if (cartItems.length === 0) return
    setStep('address')
  }

  const handleCheckout = async () => {
    if (!deliveryAddress.trim()) {
      setAddressError('Please enter a delivery address.')
      return
    }
    setAddressError('')
    setIsLoading(true)

    try {
      const stripe = await getStripe()

      const response = await fetch('/api/stripe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cartItems,
          userId,
          patientId,
          deliveryAddress: deliveryAddress.trim(),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        toast.error(errorData.error || 'An error occurred during checkout.')
        return
      }

      const data = await response.json()
      toast.loading('Redirecting to checkout...')
      await stripe!.redirectToCheckout({ sessionId: data.id })
    } catch (ex) {
      console.error(ex)
      toast.error('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex justify-end">
      <div
        ref={cartRef}
        className="relative flex h-full w-full max-w-md flex-col border-l border-dark-500 bg-dark-300 shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-dark-500 px-6 py-4">
          <button
            type="button"
            onClick={() => {
              if (step === 'address') {
                setStep('cart')
              } else {
                setShowCart(false)
              }
            }}
            className="flex items-center gap-2 text-dark-700 hover:text-white transition-colors"
          >
            <AiOutlineLeft size={18} />
            <span className="text-16-semibold text-white">
              {step === 'address' ? 'Delivery Details' : 'Your Cart'}
            </span>
          </button>
          <span className="text-14-regular text-dark-700">
            {totalQuantities} item{totalQuantities !== 1 ? 's' : ''}
          </span>
        </div>

        {/* ── Step 1: Cart ── */}
        {step === 'cart' && (
          <>
            {cartItems.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-10">
                <AiOutlineShopping size={80} className="text-dark-600" />
                <p className="text-18-bold text-white">Your cart is empty</p>
                <p className="text-14-regular text-dark-700 text-center">
                  Add some medicines to get started.
                </p>
                <button
                  type="button"
                  onClick={() => setShowCart(false)}
                  className="shad-primary-btn rounded-md px-6 py-2 text-14-medium mt-2"
                >
                  Continue Shopping
                </button>
              </div>
            ) : (
              <>
                <ul className="remove-scrollbar flex-1 overflow-y-auto px-6 py-4 space-y-3">
                  {cartItems.map((item) => (
                    <li
                      key={item.id}
                      className="rounded-xl border border-dark-500 bg-dark-400 px-4 py-3 space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-14-medium text-white">{item.name}</p>
                          <p className="text-12-regular text-green-500 mt-0.5">
                            KES {item.priceqty.toLocaleString()}
                          </p>
                        </div>
                        <button
                          onClick={() => onRemove(item)}
                          className="text-dark-600 hover:text-red-400 transition-colors mt-0.5"
                        >
                          <TiDeleteOutline size={20} />
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleCartItemQuantity(item.id, 'dec')}
                            className="size-7 rounded border border-dark-500 bg-dark-300 text-white hover:bg-dark-500 transition-colors flex items-center justify-center"
                          >
                            <AiOutlineMinus size={14} />
                          </button>
                          <span className="text-14-medium text-white w-6 text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => toggleCartItemQuantity(item.id, 'inc')}
                            className="size-7 rounded border border-dark-500 bg-dark-300 text-white hover:bg-dark-500 transition-colors flex items-center justify-center"
                          >
                            <AiOutlinePlus size={14} />
                          </button>
                        </div>
                        <p className="text-14-medium text-white">
                          KES {(item.priceqty * item.quantity).toLocaleString()}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>

                <div className="border-t border-dark-500 px-6 py-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-16-semibold text-white">Total</span>
                    <span className="text-18-bold text-green-500">
                      KES {totalPrice.toLocaleString()}
                    </span>
                  </div>
                  <button
                    onClick={handleProceedToAddress}
                    className="shad-primary-btn w-full rounded-md py-3 text-14-medium"
                  >
                    Continue →
                  </button>
                </div>
              </>
            )}
          </>
        )}

        {/* ── Step 2: Delivery Address ── */}
        {step === 'address' && (
          <div className="flex flex-1 flex-col px-6 py-6 space-y-6">
            {/* Order summary */}
            <div className="rounded-xl border border-dark-500 bg-dark-400 p-4 space-y-2">
              <p className="text-12-regular text-dark-700 mb-2">Order Summary</p>
              {cartItems.map((item) => (
                <div key={item.id} className="flex justify-between text-14-regular">
                  <span className="text-dark-700">
                    {item.name} × {item.quantity}
                  </span>
                  <span className="text-white">
                    KES {(item.priceqty * item.quantity).toLocaleString()}
                  </span>
                </div>
              ))}
              <div className="flex justify-between text-16-semibold border-t border-dark-500 pt-2 mt-2">
                <span className="text-white">Total</span>
                <span className="text-green-500">KES {totalPrice.toLocaleString()}</span>
              </div>
            </div>

            {/* Delivery address input */}
            <div className="space-y-2">
              <label className="shad-input-label text-14-medium text-dark-700">
                Delivery Address *
              </label>
              <textarea
                value={deliveryAddress}
                onChange={(e) => {
                  setDeliveryAddress(e.target.value)
                  setAddressError('')
                }}
                placeholder="e.g. 123 Kimathi St, Nairobi CBD, Nairobi"
                rows={3}
                className="shad-textArea w-full rounded-md border border-dark-500 bg-dark-400 px-3 py-2 text-14-regular text-white placeholder:text-dark-600 outline-none resize-none"
              />
              {addressError && (
                <p className="text-12-regular text-red-400">{addressError}</p>
              )}
            </div>

            {/* Payment note */}
            <div className="rounded-lg border border-dark-500 bg-dark-400 p-3 flex gap-3">
              <span className="text-xl">💳</span>
              <div>
                <p className="text-14-medium text-white">Payment via Stripe</p>
                <p className="text-12-regular text-dark-600">
                  You&apos;ll be redirected to Stripe&apos;s secure checkout.
                </p>
              </div>
            </div>

            <div className="mt-auto space-y-3">
              <button
                onClick={handleCheckout}
                disabled={isLoading}
                className="shad-primary-btn w-full rounded-md py-3 text-14-medium disabled:opacity-50"
              >
                {isLoading ? 'Redirecting...' : 'Pay Now →'}
              </button>
              <button
                onClick={() => setStep('cart')}
                className="shad-gray-btn w-full rounded-md py-3 text-14-medium"
              >
                ← Back to Cart
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Cart