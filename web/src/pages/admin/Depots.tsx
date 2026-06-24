import { useEffect, useState } from 'react'
import AdminLayout from '../../components/admin/AdminLayout'
import { adminGet, adminPost } from '../../lib/admin'

interface Depot {
  id: string
  name: string
  x: number
  y: number
  z: number
  dimension: string
  quadrant: string | null
  inventory: Record<string, number>
  is_active: boolean
}

function Depots() {
  const [depots, setDepots] = useState<Depot[]>([])
  const [form, setForm] = useState({
    id: '',
    name: '',
    x: '',
    y: '',
    z: '',
    dimension: 'overworld',
    quadrant: '',
    inventory: '{}',
  })
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const data = await adminGet<Depot[]>('/admin/depots')
      setDepots(data)
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
      const inventory = JSON.parse(form.inventory || '{}')
      const payload = {
        ...form,
        x: Number(form.x),
        y: Number(form.y),
        z: Number(form.z),
        inventory,
      }
      await adminPost('/admin/depots', payload)
      setSuccess('Depot created.')
      setForm({
        id: '',
        name: '',
        x: '',
        y: '',
        z: '',
        dimension: 'overworld',
        quadrant: '',
        inventory: '{}',
      })
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
        <h1 className="text-3xl font-bold">Depots</h1>
        <p className="text-zinc-400 mt-1">Manage stash locations and inventory.</p>
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
                  <th className="px-4 py-3">Coords</th>
                  <th className="px-4 py-3">Inventory</th>
                  <th className="px-4 py-3 text-center">Active</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-zinc-400">
                      Loading…
                    </td>
                  </tr>
                ) : depots.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-zinc-400">
                      No depots yet.
                    </td>
                  </tr>
                ) : (
                  depots.map((d) => (
                    <tr key={d.id} className="hover:bg-zinc-800/30">
                      <td className="px-4 py-3 font-medium">{d.name}</td>
                      <td className="px-4 py-3 font-mono text-xs">
                        {d.x}, {d.y}, {d.z} <span className="text-zinc-500">({d.dimension})</span>
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {Object.entries(d.inventory || {})
                          .map(([k, v]) => `${k}: ${v}`)
                          .join(', ') || '—'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {d.is_active ? (
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
            <h2 className="text-lg font-semibold mb-4">Add Depot</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs text-zinc-400 mb-1">ID (optional)</label>
                <input
                  value={form.id}
                  onChange={(e) => setForm({ ...form, id: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg outline-none focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Name *</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg outline-none focus:border-orange-500"
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">X</label>
                  <input
                    required
                    type="number"
                    value={form.x}
                    onChange={(e) => setForm({ ...form, x: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Y</label>
                  <input
                    required
                    type="number"
                    value={form.y}
                    onChange={(e) => setForm({ ...form, y: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Z</label>
                  <input
                    required
                    type="number"
                    value={form.z}
                    onChange={(e) => setForm({ ...form, z: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg outline-none focus:border-orange-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Inventory JSON</label>
                <textarea
                  value={form.inventory}
                  onChange={(e) => setForm({ ...form, inventory: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg outline-none focus:border-orange-500 font-mono text-xs"
                  rows={3}
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-zinc-800 text-white font-semibold rounded-lg transition-colors"
              >
                {submitting ? 'Creating…' : 'Create Depot'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}

export default Depots
