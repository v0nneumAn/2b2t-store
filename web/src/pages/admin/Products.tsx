import { useEffect, useState } from 'react'
import AdminLayout from '../../components/admin/AdminLayout'
import { adminGet, adminPost } from '../../lib/admin'

interface Product {
  id: string
  name: string
  description: string
  category: string
  server: string
  price_usd: string
  image_url: string | null
  is_active: boolean
  delivery_types: string[]
  stock_keeping: string
  min_order_qty: number
  max_order_qty: number | null
}

const emptyProduct: Partial<Product> = {
  id: '',
  name: '',
  description: '',
  category: 'items',
  server: '2b2t',
  price_usd: '',
  image_url: '',
  is_active: true,
  delivery_types: ['random'],
  stock_keeping: 'depot',
  min_order_qty: 1,
  max_order_qty: null,
}

function Products() {
  const [products, setProducts] = useState<Product[]>([])
  const [form, setForm] = useState<Partial<Product>>(emptyProduct)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const data = await adminGet<Product[]>('/admin/products')
      setProducts(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    setSuccess('')

    try {
      const payload = {
        ...form,
        price_usd: parseFloat(form.price_usd as string),
        image_url: form.image_url || null,
        max_order_qty: form.max_order_qty ? Number(form.max_order_qty) : null,
      }
      await adminPost('/admin/products', payload)
      setSuccess('Product created.')
      setForm(emptyProduct)
      load()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Products</h1>
        <p className="text-zinc-400 mt-1">Manage catalog items.</p>
      </div>

      {error && (
        <div className="mb-4 bg-red-500/10 border border-red-500/30 text-red-200 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 bg-green-500/10 border border-green-500/30 text-green-200 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-zinc-800 text-zinc-300">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Server</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3 text-right">Price</th>
                  <th className="px-4 py-3 text-center">Active</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-zinc-400">
                      Loading…
                    </td>
                  </tr>
                ) : products.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-zinc-400">
                      No products yet.
                    </td>
                  </tr>
                ) : (
                  products.map((p) => (
                    <tr key={p.id} className="hover:bg-zinc-800/30">
                      <td className="px-4 py-3 font-medium">{p.name}</td>
                      <td className="px-4 py-3 capitalize">{p.server}</td>
                      <td className="px-4 py-3 capitalize">{p.category}</td>
                      <td className="px-4 py-3 text-right">${parseFloat(p.price_usd).toFixed(2)}</td>
                      <td className="px-4 py-3 text-center">
                        {p.is_active ? (
                          <span className="text-green-400">●</span>
                        ) : (
                          <span className="text-zinc-600">●</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <h2 className="text-lg font-semibold mb-4">Add Product</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs text-zinc-400 mb-1">ID (optional)</label>
                <input
                  value={form.id}
                  onChange={(e) => setForm({ ...form, id: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg focus:border-orange-500 outline-none"
                  placeholder="auto-generated"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Name *</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg focus:border-orange-500 outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg outline-none"
                  >
                    <option value="packs">Packs</option>
                    <option value="items">Items</option>
                    <option value="ranks">Ranks</option>
                    <option value="kits">Kits</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Server</label>
                  <select
                    value={form.server}
                    onChange={(e) => setForm({ ...form, server: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg outline-none"
                  >
                    <option value="2b2t">2b2t</option>
                    <option value="donutsmp">Donut SMP</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Price USD *</label>
                <input
                  required
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.price_usd}
                  onChange={(e) => setForm({ ...form, price_usd: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg focus:border-orange-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Image URL</label>
                <input
                  value={form.image_url ?? ''}
                  onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg focus:border-orange-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Delivery Types</label>
                <select
                  multiple
                  value={form.delivery_types}
                  onChange={(e) => {
                    const options = Array.from(e.target.selectedOptions).map((o) => o.value)
                    setForm({ ...form, delivery_types: options })
                  }}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg outline-none"
                  size={3}
                >
                  <option value="random">Random</option>
                  <option value="specified">Specified</option>
                  <option value="meetup">Meetup</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-zinc-800 text-white font-semibold rounded-lg transition-colors"
              >
                {submitting ? 'Creating…' : 'Create Product'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}

export default Products
