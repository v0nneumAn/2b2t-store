import { useEffect, useState } from 'react'
import AdminLayout from '../../components/admin/AdminLayout'
import { adminGet, adminPost } from '../../lib/admin'

interface Bot {
  id: string
  role: string
  bot_type: string
  account_name: string | null
  status: string
  config: Record<string, unknown>
}

function Bots() {
  const [bots, setBots] = useState<Bot[]>([])
  const [selectedRole, setSelectedRole] = useState('')
  const [command, setCommand] = useState('')
  const [commandOutput, setCommandOutput] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const data = await adminGet<Bot[]>('/api/bots')
      setBots(data)
      if (data.length > 0 && !selectedRole) {
        setSelectedRole(data[0].role)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const sendCommand = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedRole || !command) return
    setSending(true)
    setError('')
    setCommandOutput(null)

    try {
      const result = await adminPost<{ response: { embed?: string; multiLineOutput?: string[] } }>(
        `/bots/${selectedRole}/zenith/command`,
        { command }
      )
      const embed = result.response.embed || ''
      const multiLine = result.response.multiLineOutput?.join('\n') || ''
      setCommandOutput(embed + (multiLine ? '\n' + multiLine : ''))
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSending(false)
    }
  }

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Bots</h1>
        <p className="text-zinc-400 mt-1">Manage delivery/advert bots and send ZenithProxy commands.</p>
      </div>

      {error && (
        <div className="mb-4 bg-red-500/10 border border-red-500/30 text-red-200 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-zinc-800 text-zinc-300">
                <tr>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Account</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-zinc-400">
                      Loading…
                    </td>
                  </tr>
                ) : bots.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-zinc-400">
                      No bots registered yet.
                    </td>
                  </tr>
                ) : (
                  bots.map((b) => (
                    <tr
                      key={b.id}
                      onClick={() => setSelectedRole(b.role)}
                      className={`hover:bg-zinc-800/30 cursor-pointer ${
                        selectedRole === b.role ? 'bg-zinc-800/50' : ''
                      }`}
                    >
                      <td className="px-4 py-3 font-medium">{b.role}</td>
                      <td className="px-4 py-3 capitalize">{b.bot_type}</td>
                      <td className="px-4 py-3">{b.account_name || '—'}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold border ${
                            b.status === 'active'
                              ? 'text-green-400 bg-green-400/10 border-green-400/20'
                              : 'text-zinc-400 bg-zinc-800 border-zinc-700'
                          }`}
                        >
                          {b.status}
                        </span>
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
            <h2 className="text-lg font-semibold mb-4">ZenithProxy Command Console</h2>

            <form onSubmit={sendCommand} className="space-y-4">
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Target Bot</label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg outline-none"
                >
                  {bots.map((b) => (
                    <option key={b.id} value={b.role}>
                      {b.role} ({b.bot_type})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-zinc-400 mb-1">Command</label>
                <input
                  value={command}
                  onChange={(e) => setCommand(e.target.value)}
                  placeholder="e.g. status"
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg outline-none focus:border-orange-500 font-mono text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={sending || !selectedRole}
                className="w-full py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-zinc-800 text-white font-semibold rounded-lg transition-colors"
              >
                {sending ? 'Sending…' : 'Send Command'}
              </button>
            </form>

            {commandOutput !== null && (
              <div className="mt-6">
                <div className="text-xs text-zinc-400 mb-1">Response</div>
                <pre className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 text-xs font-mono whitespace-pre-wrap text-zinc-300 max-h-96 overflow-auto">
                  {commandOutput}
                </pre>
              </div>
            )}

            <div className="mt-6 text-xs text-zinc-500">
              <p className="font-semibold text-zinc-400 mb-1">Useful commands:</p>
              <ul className="space-y-1 list-disc list-inside">
                <li>status</li>
                <li>pathfinder goto x y z</li>
                <li>pathfinder click right x y z</li>
                <li>inventory</li>
                <li>sendMessage /kill</li>
                <li>disconnect</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}

export default Bots
