import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCartStore } from '../stores/cartStore'

function Checkout() {
  const { items, total, clearCart } = useCartStore()
  const navigate = useNavigate()
  const [deliveryType, setDeliveryType] = useState('random')
  const [coords, setCoords] = useState({ x: '', y: '', z: '' })
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Create cart on backend
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
      clearCart()
      navigate(`/order/${order.id}`)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (items.length === 0) {
    return <div className="text-center py-12">Your cart is empty.</div>
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Checkout</h1>
      {error && <div className="bg-red-900 text-white p-4 rounded mb-4">{error}</div>}
      <div className="bg-gray-800 p-6 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
        {items.map((i) => (
          <div key={i.product_id} className="flex justify-between py-2">
            <span>{i.name} x{i.quantity}</span>
            <span>${(i.price_usd * i.quantity).toFixed(2)}</span>
          </div>
        ))}
        <div className="border-t border-gray-700 mt-4 pt-4 text-xl font-bold">
          Total: ${total().toFixed(2)}
        </div>
      </div>
      <form onSubmit={handleSubmit} className="bg-gray-800 p-6 rounded-lg space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Delivery Method</label>
          <select
            value={deliveryType}
            onChange={(e) => setDeliveryType(e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 rounded p-2"
          >
            <option value="random">Random Stash (safest)</option>
            <option value="specified">Specified Coordinates</option>
            <option value="meetup">Seller Meetup</option>
          </select>
        </div>
        {deliveryType === 'specified' && (
          <div className="grid grid-cols-3 gap-4">
            <input
              type="number"
              placeholder="X"
              value={coords.x}
              onChange={(e) => setCoords({ ...coords, x: e.target.value })}
              className="bg-gray-700 border border-gray-600 rounded p-2"
              required
            />
            <input
              type="number"
              placeholder="Y"
              value={coords.y}
              onChange={(e) => setCoords({ ...coords, y: e.target.value })}
              className="bg-gray-700 border border-gray-600 rounded p-2"
              required
            />
            <input
              type="number"
              placeholder="Z"
              value={coords.z}
              onChange={(e) => setCoords({ ...coords, z: e.target.value })}
              className="bg-gray-700 border border-gray-600 rounded p-2"
              required
            />
          </div>
        )}
        <div>
          <label className="block text-sm font-medium mb-2">Email (optional)</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 rounded p-2"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-bold py-3 rounded-lg"
        >
          {loading ? 'Creating order...' : 'Create order & pay with Monero'}
        </button>
      </form>
    </div>
  )
}

export default Checkout
