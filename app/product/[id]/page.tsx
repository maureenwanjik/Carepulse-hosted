'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Medicine } from '@/types/appwrite.types'
import { getMedicineById } from '@/lib/actions/medicine.actions'
import MedicineProductImage from '@/components/medicines/MedicineProductImage'
import { useStateContext } from '@/components/context/StateContext'
import { IoIosCart } from 'react-icons/io'
import { AiOutlineMinus, AiOutlinePlus } from 'react-icons/ai'
import Cart from '@/components/Cart'
import Navbar from '@/components/Navbar'
import Link from 'next/link'
import toast from 'react-hot-toast'
import getStripe from '@/lib/getStripe'

const BuyPage: React.FC = () => {
  const { id } = useParams()
  const router = useRouter()
  const [medicine, setMedicine] = useState<Medicine | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { onAdd, qty, incQty, decQty, totalQuantities, setShowCart, showCart } = useStateContext()

  // Fetch medicine details
  useEffect(() => {
    const fetchMedicine = async () => {
      if (!id) return
      try {
        const response = await getMedicineById(id as string)
        setMedicine(response)
      } catch (err) {
        console.error('Error fetching medicine details:', err)
        setError('Failed to fetch medicine details.')
      } finally {
        setLoading(false)
      }
    }
    fetchMedicine()
  }, [id])

  const handleAddToCart = () => {
    if (!medicine) return
    const product = {
      id: medicine.$id,
      name: medicine.medicineName,
      price: medicine.price,
      priceqty: medicine.price,
      quantity: qty,
    }
    onAdd(product, qty)
  }


const handleBuyNow = async () => {
  if (!medicine) return

  const product = {
    id: medicine.$id,
    name: medicine.medicineName,
    price: medicine.price,
    priceqty: medicine.price,
    quantity: qty,
  }

  // Build a one-item cart for immediate checkout
  const buyNowItems = [{ ...product, quantity: qty }]

  try {
    const stripe = await getStripe()

    const response = await fetch('/api/stripe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cartItems: buyNowItems }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      toast.error(errorData.error || 'Checkout failed. Please try again.')
      return
    }

    const data = await response.json()
    toast.loading('Redirecting to checkout...')
    await stripe!.redirectToCheckout({ sessionId: data.id })
  } catch (err) {
    console.error('Buy now error:', err)
    toast.error('An unexpected error occurred. Please try again.')
  }
}
  // Cart button for navbar
  const cartButton = (
    <button
      type="button"
      onClick={() => setShowCart(true)}
      className="relative shad-gray-btn rounded-md px-4 py-2 text-14-medium flex items-center gap-2"
    >
      <IoIosCart className="text-lg" />
      <span>Cart</span>
      {totalQuantities > 0 && (
        <span className="absolute -top-2 -right-2 size-5 rounded-full bg-green-500 text-white text-[11px] font-bold flex items-center justify-center">
          {totalQuantities}
        </span>
      )}
    </button>
  )

  // ── States ──────────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen bg-dark-200">
      <Navbar rightContent={cartButton} />
      <div className="flex items-center justify-center py-32">
        <div className="space-y-4 text-center">
          <div className="size-12 rounded-full border-4 border-green-500 border-t-transparent animate-spin mx-auto" />
          <p className="text-14-regular text-dark-700">Loading medicine details...</p>
        </div>
      </div>
    </div>
  )

  if (error) return (
    <div className="min-h-screen bg-dark-200">
      <Navbar rightContent={cartButton} />
      <div className="flex items-center justify-center py-32">
        <div className="rounded-xl border border-red-700 bg-red-600/10 px-8 py-6 text-center space-y-3">
          <p className="text-16-semibold text-red-500">{error}</p>
          <Link href="/product" className="text-14-regular text-green-500 hover:underline">
            ← Back to Pharmacy
          </Link>
        </div>
      </div>
    </div>
  )

  if (!medicine) return (
    <div className="min-h-screen bg-dark-200">
      <Navbar rightContent={cartButton} />
      <div className="flex items-center justify-center py-32">
        <p className="text-dark-700 text-16-regular">Medicine not found.</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-dark-200">
      <Navbar rightContent={cartButton} />

      <main className="mx-auto max-w-5xl px-6 py-10">
        {/* Back link */}
        <Link
          href="/product"
          className="inline-flex items-center gap-2 text-14-regular text-dark-700 hover:text-white transition-colors mb-8"
        >
          ← Back to Pharmacy
        </Link>

        {/* Product card */}
        <div className="rounded-2xl border border-dark-500 bg-dark-400 overflow-hidden flex flex-col md:flex-row">
          {/* Image */}
          <div className="relative w-full md:w-2/5 h-72 md:h-auto bg-dark-300 flex items-center justify-center flex-shrink-0">
            <MedicineProductImage
              src={medicine.medicineImageUrl}
              name={medicine.medicineName}
              medicineId={medicine.$id}
              fill
              className="object-contain p-8"
            />
            {/* Badges */}
            {medicine.requiresPrescription && (
              <span className="absolute top-3 right-3 rounded-full bg-red-600 px-3 py-1 text-12-semibold text-white">
                Prescription Required
              </span>
            )}
            {medicine.stock === 0 && (
              <div className="absolute inset-0 bg-dark-200/80 flex items-center justify-center">
                <span className="text-16-semibold text-dark-600">Out of Stock</span>
              </div>
            )}
          </div>

          {/* Details */}
          <div className="flex flex-col flex-1 p-8 space-y-6">
            {/* Name + meta */}
            <div className="space-y-2">
              <h1 className="text-32-bold text-white">{medicine.medicineName}</h1>
              <p className="text-14-regular text-dark-700">
                {medicine.dosage} · {medicine.unit} · {medicine.category}
              </p>
              <p className="text-12-regular text-dark-600">
                By {medicine.manufacturer}
              </p>
            </div>

            {/* Description */}
            <p className="text-14-regular text-dark-700 leading-relaxed">
              {medicine.description}
            </p>

            {/* Info grid */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Category', value: medicine.category },
                { label: 'Dosage', value: medicine.dosage },
                { label: 'Unit', value: medicine.unit },
                { label: 'Expiry', value: medicine.expiryDate },
                { label: 'Stock', value: `${medicine.stock} units` },
                { label: 'Prescription', value: medicine.requiresPrescription ? 'Required' : 'Not required' },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-lg bg-dark-300 px-3 py-2">
                  <p className="text-12-regular text-dark-600">{label}</p>
                  <p className="text-14-medium text-white">{value}</p>
                </div>
              ))}
            </div>

            {/* Price */}
            <p className="text-32-bold text-green-500">
              KSh {medicine.price?.toLocaleString()}
            </p>

            {/* Quantity selector */}
            <div className="space-y-2">
              <p className="text-14-medium text-dark-700">Quantity</p>
              <div className="flex items-center gap-3">
                <button
                  onClick={decQty}
                  disabled={qty <= 1}
                  className="size-9 rounded-md border border-dark-500 bg-dark-300 text-white hover:bg-dark-500 transition-colors flex items-center justify-center disabled:opacity-40"
                >
                  <AiOutlineMinus size={16} />
                </button>
                <span className="text-18-bold text-white w-8 text-center">{qty}</span>
                <button
                  onClick={incQty}
                  disabled={qty >= medicine.stock}
                  className="size-9 rounded-md border border-dark-500 bg-dark-300 text-white hover:bg-dark-500 transition-colors flex items-center justify-center disabled:opacity-40"
                >
                  <AiOutlinePlus size={16} />
                </button>
                <span className="text-14-regular text-dark-600 ml-2">
                  Subtotal:{' '}
                  <span className="text-white">
                    KSh {(medicine.price * qty).toLocaleString()}
                  </span>
                </span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleAddToCart}
                disabled={medicine.stock === 0}
                className="shad-gray-btn flex-1 rounded-md py-3 text-14-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add to Cart
              </button>
              <button
                onClick={handleBuyNow}
                disabled={medicine.stock === 0}
                className="shad-primary-btn flex-1 rounded-md py-3 text-14-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Buy Now →
              </button>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-dark-500 py-6 text-center mt-10">
        <p className="text-14-regular text-dark-600">© 2026 CarePulse</p>
      </footer>

      {showCart && <Cart />}
    </div>
  )
}

export default BuyPage
