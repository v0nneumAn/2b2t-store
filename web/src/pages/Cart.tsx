import { Link, useNavigate } from 'react-router-dom'
import { useCartStore } from '../stores/cartStore'

function Cart() {
  const { items, removeItem, total, clearCart } = useCartStore()
  const navigate = useNavigate()

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold mb-4">Your cart is empty</h1>
        <Link to="/shop" className="text-blue-400 hover:underline">
          Continue shopping
        </Link>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Cart</h1>
      <div className="space-y-4">
        {items.map((item) => (
          <div
            key={item.product_id}
            className="bg-gray-800 p-4 rounded-lg flex items-center justify-between"
          >
            <div>
              <h2 className="font-semibold">{item.name}</h2>
              <p className="text-gray-400">Qty: {item.quantity}</p>
            </div>
            <div className="flex items-center gap-4">
              <span>${(item.price_usd * item.quantity).toFixed(2)}</span>
              <button
                onClick={() => removeItem(item.product_id)}
                className="text-red-400 hover:text-red-300"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-8 flex items-center justify-between">
        <button onClick={clearCart} className="text-gray-400 hover:text-white">
          Clear cart
        </button>
        <div className="text-2xl font-bold">Total: ${total().toFixed(2)}</div>
      </div>
      <div className="mt-8 text-right">
        <button
          onClick={() => navigate('/checkout')}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg"
        >
          Checkout
        </button>
      </div>
    </div>
  )
}

export default Cart
