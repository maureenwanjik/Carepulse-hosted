'use client'

import React from 'react'
import Link from 'next/link'
import Products from '@/components/forms/products'
import { IoIosCart } from 'react-icons/io'
import { Pill } from 'lucide-react'
import { useStateContext } from '@/components/context/StateContext'
import Cart from '@/components/Cart'
import Navbar from '@/components/Navbar'

const Page: React.FC = () => {
  const { totalQuantities, setShowCart, showCart } = useStateContext()

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

  return (
    <div className="min-h-screen bg-dark-200">
      <Navbar rightContent={cartButton} />

      <main className="mx-auto max-w-7xl px-6 py-10">
        {/* Title */}
        <section className="mb-8 space-y-2">
          <h1 className="header inline-flex items-center gap-2"><Pill aria-hidden="true" size={28} /> Online Pharmacy</h1>
          <p className="text-dark-700">
            Browse and order medicines delivered to your door.
          </p>
        </section>

        <Products />
      </main>

      <footer className="border-t border-dark-500 py-6 text-center">
        <p className="text-14-regular text-dark-600">© 2026 CarePulse</p>
      </footer>

      {showCart && <Cart />}
    </div>
  )
}

export default Page
