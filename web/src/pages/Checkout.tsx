import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCartStore } from '../stores/cartStore'

type Step = 'account' | 'payment' | 'processing'

function Checkout() {
  const navigate = useNavigate()
  const { items, total, clearCart } = useCartStore()

  const [step, setStep] = useState<Step>('account')
  const [deliveryType, setDeliveryType] = useState('random')
  const [coords, setCoords] = useState({ x: '', y: '', z: '' })
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')

  const STEPS = [
    { id: 'account', label: 'Account' },
    { id: 'payment', label: 'Payment' },
    { id: 'processing', label: 'Processing' },
  ] as const

  const canContinue = () => {
    if (deliveryType === 'specified') {
      return coords.x && coords.y && coords.z && email.trim().length > 0
    }
    return email.trim().length > 0
  }

  const handlePay = async () => {
    setStep('processing')
    setError('')

    try {
      const cartRes = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: crypto.randomUUID(),
          items: items.map((i) => ({ product_id: i.product_id, quantity: i.quantity })),
        }),
      })
      const cart = await cartRes.json()

      const payload: any = {
        cart_id: cart.id,
        delivery_type: deliveryType,
        customer_email: email,
      }
      if (deliveryType === 'specified') {
        payload.delivery_coords = {
          x: parseInt(coords.x),
          y: parseInt(coords.y),
          z: parseInt(coords.z),
          dimension: 'overworld',
        }
      }

      const orderRes = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!orderRes.ok) {
        const data = await orderRes.json()
        throw new Error(data.detail || 'Order failed')
      }

      const order = await orderRes.json()

      const checkoutRes = await fetch(`/api/payments/checkout/${order.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success_url: `${window.location.origin}/order/${order.id}?success=true`,
          cancel_url: `${window.location.origin}/order/${order.id}?canceled=true`,
        }),
      })

      if (!checkoutRes.ok) {
        const data = await checkoutRes.json()
        throw new Error(data.detail || 'Checkout session failed')
      }

      const checkout = await checkoutRes.json()
      clearCart()
      window.location.href = checkout.checkout_url
    } catch (err: any) {
      setError(err.message)
      setStep('payment')
    }
  }

  if (items.length === 0 && step !== 'processing') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Your cart is empty</h1>
        <p className="text-zinc-400 mb-6">Add some items before checking out.</p>
        <button
          onClick={() => navigate('/shop')}
          className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition-colors"
        >
          Browse shop
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">Checkout</h1>
      <p className="text-zinc-400 mb-8">Complete your purchase in a few quick steps.</p>

      {/* Stepper */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((s, idx) => {
          const active = step === s.id
          const completed =
            STEPS.findIndex((x) => x.id === step) > idx
          return (
            <div key={s.id} className="flex items-center flex-1">
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                  active
                    ? 'bg-orange-500 text-white'
                    : completed
                    ? 'bg-zinc-700 text-zinc-300'
                    : 'bg-zinc-900 border border-zinc-800 text-zinc-500'
                }`}
              >
                {completed ? (
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  idx + 1
                )}
              </div>
              <span
                className={`ml-2 text-sm font-medium ${
                  active ? 'text-white' : completed ? 'text-zinc-300' : 'text-zinc-500'
                }`}
              >
                {s.label}
              </span>
              {idx < STEPS.length - 1 && (
                <div className="flex-1 h-px bg-zinc-800 mx-3" />
              )}
            </div>
          )
        })}
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-200 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Step content */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 lg:p-8">
        {step === 'account' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold mb-1">Account & delivery</h2>
              <p className="text-zinc-400 text-sm">How should we deliver your order?</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-orange-500/50"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Delivery method</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { id: 'random', label: 'Random stash', desc: 'Safest' },
                  { id: 'specified', label: 'Coordinates', desc: 'You choose' },
                  { id: 'meetup', label: 'Meetup', desc: 'In-person' },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setDeliveryType(m.id)}
                    className={`text-left px-4 py-3 rounded-xl border transition-colors ${
                      deliveryType === m.id
                        ? 'bg-orange-500/10 border-orange-500/50'
                        : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    <div className="font-semibold text-sm">{m.label}</div>
                    <div className="text-zinc-400 text-xs">{m.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {deliveryType === 'specified' && (
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1.5 text-zinc-400">X</label>
                  <input
                    type="number"
                    value={coords.x}
                    onChange={(e) => setCoords({ ...coords, x: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-orange-500/50"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5 text-zinc-400">Y</label>
                  <input
                    type="number"
                    value={coords.y}
                    onChange={(e) => setCoords({ ...coords, y: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-orange-500/50"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5 text-zinc-400">Z</label>
                  <input
                    type="number"
                    value={coords.z}
                    onChange={(e) => setCoords({ ...coords, z: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-orange-500/50"
                    required
                  />
                </div>
              </div>
            )}

            <div className="pt-2">
              <button
                onClick={() => setStep('payment')}
                disabled={!canContinue()}
                className="w-full py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-zinc-800 disabled:text-zinc-500 text-white font-semibold rounded-lg transition-colors"
              >
                Continue to payment
              </button>
            </div>
          </div>
        )}

        {step === 'payment' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold mb-1">Review & pay</h2>
              <p className="text-zinc-400 text-sm">Double-check your order before paying.</p>
            </div>

            <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 space-y-3">
              {items.map((item) => (
                <div key={item.product_id} className="flex justify-between text-sm">
                  <span className="text-zinc-300">
                    {item.name} <span className="text-zinc-500">× {item.quantity}</span>
                  </span>
                  <span className="font-medium">${(item.price_usd * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <div className="border-t border-zinc-800 pt-3 flex justify-between items-center">
                <span className="text-zinc-400">Total</span>
                <span className="text-xl font-bold">${total().toFixed(2)}</span>
              </div>
            </div>

            <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-zinc-400">Delivery</span>
                <span className="capitalize">{deliveryType.replace('-', ' ')}</span>
              </div>
              {deliveryType === 'specified' && (
                <div className="flex justify-between">
                  <span className="text-zinc-400">Coordinates</span>
                  <span>
                    {coords.x}, {coords.y}, {coords.z}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-zinc-400">Email</span>
                <span>{email}</span>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setStep('account')}
                className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold rounded-lg transition-colors"
              >
                Back
              </button>
              <button
                onClick={handlePay}
                className="flex-[2] py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition-colors"
              >
                Pay with Stripe
              </button>
            </div>
          </div>
        )}

        {step === 'processing' && (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin mx-auto mb-6" />
            <h2 className="text-xl font-bold mb-2">Creating your order…</h2>
            <p className="text-zinc-400">You will be redirected to Stripe to complete payment.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Checkout
