import { Link, useNavigate } from 'react-router-dom'
import { useCartStore } from '../stores/cartStore'

function Cart() {
  const { items, removeItem, updateQuantity, total, clearCart } = useCartStore()
  const navigate = useNavigate()

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <svg
          className="w-16 h-16 mx-auto mb-4 text-zinc-700"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4M3 6h18M16 10a4 4 0 01-8 0" />
        </svg>
        <h1 className="text-2xl font-bold mb-2">Your cart is empty</h1>
        <p className="text-zinc-400 mb-6">Looks like you haven’t added anything yet.</p>
        <Link
          to="/shop"
          className="inline-block px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition-colors"
        >
          Continue shopping
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-1">Cart</h1>
          <p className="text-zinc-400 text-sm">Review your items before checkout.</p>
        </div>
        <button
          onClick={clearCart}
          className="text-sm text-zinc-400 hover:text-red-400 transition-colors"
        >
          Clear cart
        </button>
      </div>

      <div className="space-y-4 mb-8">
        {items.map((item) => (
          <div
            key={item.product_id}
            className="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-xl p-4"
          >
            <div>
              <h2 className="font-semibold">{item.name}</h2>
              <p className="text-zinc-400 text-sm">${item.price_usd.toFixed(2)} each</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center bg-zinc-950 border border-zinc-800 rounded-lg">
                <button
                  onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                  className="px-2.5 py-1.5 text-zinc-400 hover:text-white"
                >
                  −
                </button>
                <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                  className="px-2.5 py-1.5 text-zinc-400 hover:text-white"
                >
                  +
                </button>
              </div>
              <span className="w-20 text-right font-semibold">
                ${(item.price_usd * item.quantity).toFixed(2)}
              </span>
              <button
                onClick={() => removeItem(item.product_id)}
                className="p-2 text-zinc-500 hover:text-red-400 transition-colors"
                aria-label="Remove item"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <span className="text-zinc-400 text-lg">Total</span>
          <span className="text-3xl font-bold">${total().toFixed(2)}</span>
        </div>
        <div className="flex gap-3">
          <Link
            to="/shop"
            className="flex-1 text-center py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold rounded-lg transition-colors"
          >
            Continue shopping
          </Link>
          <button
            onClick={() => navigate('/checkout')}
            className="flex-[2] py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition-colors"
          >
            Checkout
          </button>
        </div>
      </div>
    </div>
  )
}

export default Cart
