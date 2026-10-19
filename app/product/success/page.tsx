import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Stripe from 'stripe'
import Image from 'next/image'
import Link from 'next/link'
import { createOrder } from '@/lib/actions/order.actions'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' })

const SuccessPage = async ({
  searchParams,
}: {
  searchParams: { session_id?: string }
}) => {
  const sessionId = searchParams?.session_id

  // No session ID — redirect away
  if (!sessionId) redirect('/product')

  // ── Retrieve Stripe session ───────────────────────────────────────────────
  let session: Stripe.Checkout.Session
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId)
  } catch {
    redirect('/product')
  }

  // Payment not completed
  if (session.payment_status !== 'paid') redirect('/product?canceled=true')

  // ── Extract metadata ──────────────────────────────────────────────────────
  const {
    userId,
    patientId,
    deliveryAddress,
    paymentMethod,
    cartItems: cartItemsJson,
    totalAmount,
  } = session.metadata ?? {}

  // ── Save order to Appwrite (only if not already saved) ───────────────────
  // We use the Stripe session ID as a idempotency check via notes field
  if (userId && patientId && cartItemsJson) {
    try {
      const cartItems = JSON.parse(cartItemsJson)
      await createOrder({
        userId,
        patientId,
        cartItems,
        totalAmount: parseFloat(totalAmount ?? '0'),
        deliveryAddress: deliveryAddress ?? '',
        paymentMethod: paymentMethod ?? 'card',
        paymentStatus: 'paid',
        notes: `Stripe session: ${sessionId}`,
      })
    } catch (error) {
      // Log but don't block the success page
      console.error('Failed to save order after payment:', error)
    }
  }

  return (
    <div className="flex h-screen max-h-screen px-[5%]">
      <div className="success-img">
        {/* Logo */}
        <Link href="/">
          <Image
            src="/assets/icons/logo-full.svg"
            height={1000}
            width={1000}
            alt="logo"
            className="h-10 w-fit"
          />
        </Link>

        {/* Success content */}
        <section className="flex flex-col items-center space-y-4">
          <div className="text-7xl">🎉</div>
          <h2 className="header mb-2 max-w-[600px] text-center">
            Payment <span className="text-green-500">successful!</span>
          </h2>
          <p className="text-dark-700 text-center max-w-md">
            Your order has been placed and will be delivered to{' '}
            <span className="text-white">{deliveryAddress}</span>.
            We&apos;ll notify you when it&apos;s on its way.
          </p>
        </section>

        {/* Order summary */}
        <section className="request-details flex-col items-start">
          <p className="text-14-regular text-dark-700 mb-3">Order Summary</p>
          {cartItemsJson && JSON.parse(cartItemsJson).map((item: any, i: number) => (
            <div key={i} className="flex items-center justify-between w-full gap-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">💊</span>
                <div>
                  <p className="text-14-medium text-white">{item.medicineName}</p>
                  <p className="text-12-regular text-dark-700">Qty: {item.quantity}</p>
                </div>
              </div>
              <p className="text-14-medium text-green-500">
                KES {(item.unitPrice * item.quantity).toLocaleString()}
              </p>
            </div>
          ))}
          <div className="flex justify-between w-full border-t border-dark-500 pt-3 mt-1">
            <span className="text-16-semibold text-white">Total Paid</span>
            <span className="text-18-bold text-green-500">
              KES {parseFloat(totalAmount ?? '0').toLocaleString()}
            </span>
          </div>
        </section>

        {/* Action buttons */}
        <div className="flex gap-4">
          <Link
            href="/product"
            className="shad-gray-btn rounded-md px-6 py-2 text-14-medium"
          >
            Continue Shopping
          </Link>
          <Link
            href="/dashboard"
            className="shad-primary-btn rounded-md px-6 py-2 text-14-medium"
          >
            View My Orders →
          </Link>
        </div>

        <p className="copyright">© 2026 CarePulse</p>
      </div>
    </div>
  )
}

export default SuccessPage