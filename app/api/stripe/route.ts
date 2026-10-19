// app/api/stripe/route.ts
import { NextRequest } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' })

interface CartItem {
  id: string
  name: string
  priceqty: number
  quantity: number
}

export async function POST(request: NextRequest) {
  try {
    const {
      cartItems,
      userId,
      patientId,
      deliveryAddress,
    }: {
      cartItems: CartItem[]
      userId: string
      patientId: string
      deliveryAddress: string
    } = await request.json()

    const origin = request.headers.get('origin') || 'http://localhost:3000'

    const session = await stripe.checkout.sessions.create({
      submit_type: 'pay',
      mode: 'payment',
      payment_method_types: ['card'],
      billing_address_collection: 'auto',
      line_items: cartItems.map((item) => ({
        price_data: {
          currency: 'kes',
          product_data: { name: item.name },
          unit_amount: item.priceqty * 100,
        },
        adjustable_quantity: { enabled: true, minimum: 1 },
        quantity: item.quantity,
      })),
      metadata: {
        userId,
        patientId,
        deliveryAddress,
        paymentMethod: 'card',
        cartItems: JSON.stringify(
          cartItems.map((item) => ({
            medicineId: item.id,
            medicineName: item.name,
            quantity: item.quantity,
            unitPrice: item.priceqty,
          }))
        ),
        totalAmount: cartItems
          .reduce((sum, item) => sum + item.priceqty * item.quantity, 0)
          .toString(),
      },
      success_url: `${origin}/product/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/product?canceled=true`,
    })

    return Response.json({ id: session.id })
  } catch (error) {
    console.error('Stripe error:', error)
    return Response.json({ error: (error as Error).message }, { status: 500 })
  }
}