import { useEffect, useState } from 'react'
import { useCartStore } from '../stores/cartStore'

interface Product {
  id: string
  name: string
  description: string
  price_usd: number
  category: string
}

function Shop() {
  const [products, setProducts] = useState<Product[]>([])
  const addItem = useCartStore((s) => s.addItem)

  useEffect(() => {
    fetch('/api/products')
      .then((r) => r.json())
      .then((data) => setProducts(data))
      .catch((err) => console.error(err))
  }, [])

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Shop</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {products.map((p) => (
          <div key={p.id} className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <h2 className="text-xl font-semibold mb-2">{p.name}</h2>
            <p className="text-gray-400 text-sm mb-4">{p.description}</p>
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold">${p.price_usd.toFixed(2)}</span>
              <button
                onClick={() => addItem(p)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
              >
                Add to Cart
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Shop
