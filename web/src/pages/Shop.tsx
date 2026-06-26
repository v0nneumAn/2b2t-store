import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useCartStore } from '../stores/cartStore'

interface Product {
  id: string
  name: string
  description: string
  price_usd: number
  category: string
  server: string
  image_url: string | null
}

type Server = '2b2t' | 'donutsmp' | 'other'
type Category = 'all' | 'items' | 'ranks' | 'packs' | 'kits'

const SERVER_TABS: { id: Server; label: string; logo: string; accent: string }[] = [
  { id: '2b2t', label: '2b2t', logo: '/assets/landing/2b2t_transparent.png', accent: '#f97316' },
  { id: 'donutsmp', label: 'Donut SMP', logo: '/assets/landing/donutsmp_transparent.png', accent: '#0ea5e9' },
]

const CATEGORY_FILTERS: { id: Category; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'items', label: 'Items' },
  { id: 'ranks', label: 'Ranks' },
  { id: 'packs', label: 'Packs' },
  { id: 'kits', label: 'Kits' },
]

function Shop() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchParams, setSearchParams] = useSearchParams()

  const initialServer = (searchParams.get('server') as Server) || '2b2t'
  const [activeServer, setActiveServer] = useState<Server>(
    SERVER_TABS.some((s) => s.id === initialServer) ? initialServer : '2b2t'
  )
  const [activeCategory, setActiveCategory] = useState<Category>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [quantities, setQuantities] = useState<Record<string, number>>({})

  const { items, addItemWithQuantity } = useCartStore()
  const cartMap = useMemo(() => {
    const map: Record<string, number> = {}
    items.forEach((i) => (map[i.product_id] = i.quantity))
    return map
  }, [items])

  useEffect(() => {
    fetch('/api/products')
      .then((r) => r.json())
      .then((data) => {
        setProducts(data)
        const initialQuantities: Record<string, number> = {}
        data.forEach((p: Product) => (initialQuantities[p.id] = 1))
        setQuantities(initialQuantities)
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false))
  }, [])

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesServer = p.server === activeServer
      const matchesCategory = activeCategory === 'all' || p.category === activeCategory
      const q = searchQuery.toLowerCase()
      const matchesSearch =
        q === '' ||
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
      return matchesServer && matchesCategory && matchesSearch
    })
  }, [products, activeServer, activeCategory, searchQuery])

  const handleServerChange = (server: Server) => {
    setActiveServer(server)
    setSearchParams({ server })
  }

  const adjustQty = (productId: string, delta: number) => {
    setQuantities((prev) => ({
      ...prev,
      [productId]: Math.max(1, (prev[productId] || 1) + delta),
    }))
  }

  const handleAdd = (product: Product) => {
    const qty = quantities[product.id] || 1
    addItemWithQuantity(
      { id: product.id, name: product.name, price_usd: product.price_usd },
      qty
    )
    setQuantities((prev) => ({ ...prev, [product.id]: 1 }))
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8 text-center text-zinc-400">
        Loading catalog…
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Section header */}
      <div className="mb-10">
        <div className="text-orange-500 text-sm font-semibold uppercase tracking-wider mb-2">
          Catalog
        </div>
        <h1 className="text-3xl lg:text-4xl font-bold mb-3">Browse Products</h1>
        <p className="text-zinc-400 max-w-2xl">
          Select a server below to view its dedicated item catalog. All products ship inside
          secured shulker boxes.
        </p>
      </div>

      {/* Server tabs */}
      <div className="flex gap-2 mb-8 border-b border-zinc-800 pb-1">
        {SERVER_TABS.map((server) => (
          <button
            key={server.id}
            onClick={() => handleServerChange(server.id)}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-colors ${
              activeServer === server.id
                ? 'border-white text-white'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <img src={server.logo} alt={server.label} className="h-5 w-auto" />
            {server.label}
          </button>
        ))}
      </div>

      {/* Search + filters */}
      <div className="flex flex-col lg:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search items…"
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500/50"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {CATEGORY_FILTERS.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeCategory === cat.id
                  ? 'bg-orange-500 text-white'
                  : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:bg-zinc-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Product grid */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-16 text-zinc-400">
          <svg
            className="w-12 h-12 mx-auto mb-4 text-zinc-600"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <div className="text-lg font-semibold text-white mb-1">No items found</div>
          <div>Try searching for another keyword or selecting a different category.</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => {
            const inCartQty = cartMap[product.id] || 0
            const qty = quantities[product.id] || 1
            const accent = activeServer === 'donutsmp' ? '#0ea5e9' : '#f97316'

            return (
              <div
                key={product.id}
                className="group bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden hover:border-zinc-700 transition-colors"
              >
                {/* Image */}
                <div className="aspect-[16/10] bg-zinc-950 flex items-center justify-center p-6 border-b border-zinc-800/50">
                  <img
                    src={product.image_url || '/assets/landing/placeholder.png'}
                    alt={product.name}
                    className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      const target = e.currentTarget
                      if (target.src !== window.location.origin + '/assets/landing/placeholder.png') {
                        target.src = '/assets/landing/placeholder.png'
                      }
                    }}
                  />
                </div>

                {/* Body */}
                <div className="p-5">
                  {inCartQty > 0 && (
                    <div className="flex items-center gap-1.5 text-xs font-semibold mb-3" style={{ color: accent }}>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: accent }} />
                      {inCartQty} in cart
                    </div>
                  )}

                  <h3 className="text-lg font-bold mb-2">{product.name}</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed mb-5 line-clamp-3">
                    {product.description}
                  </p>

                  <div className="flex items-end justify-between gap-4">
                    <span className="text-2xl font-bold">${product.price_usd.toFixed(2)}</span>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center bg-zinc-950 border border-zinc-800 rounded-lg">
                        <button
                          onClick={() => adjustQty(product.id, -1)}
                          className="px-2.5 py-1.5 text-zinc-400 hover:text-white"
                        >
                          −
                        </button>
                        <span className="w-8 text-center text-sm font-medium">{qty}</span>
                        <button
                          onClick={() => adjustQty(product.id, 1)}
                          className="px-2.5 py-1.5 text-zinc-400 hover:text-white"
                        >
                          +
                        </button>
                      </div>
                      <button
                        onClick={() => handleAdd(product)}
                        className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors"
                        style={{ backgroundColor: accent }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = activeServer === 'donutsmp' ? '#0284c7' : '#ea580c')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = accent)}
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default Shop
