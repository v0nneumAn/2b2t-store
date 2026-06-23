import fs from 'fs'
import path from 'path'

const CONFIG_PATH = path.join(process.cwd(), 'config.json')

export function loadConfig() {
  const defaults = {
    host: 'localhost',
    port: 25565,
    username: 'DeliveryBot',
    version: '1.20.1',
    auth: 'offline',
    apiPort: 3000,
    backendUrl: 'http://localhost:8000',
    botApiKey: process.env.BOT_API_KEY || '',
    maxTravelDistance: 2000,
    dropRange: 5,
    home: { x: 0, y: 64, z: 0 },
  }

  if (fs.existsSync(CONFIG_PATH)) {
    return { ...defaults, ...JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8')) }
  }
  return defaults
}

export async function pollForJobs(state, executeJob) {
  if (state.inQueue || !state.connected) return

  try {
    const res = await fetch(`${loadConfig().backendUrl}/api/bot/jobs/next`, {
      headers: { 'X-Bot-Key': loadConfig().botApiKey },
    })
    const data = await res.json()
    if (data.job) {
      console.log(`[JOBS] Claimed job ${data.job.id}`)
      await claimJob(data.job.id)
      state.activeJob = data.job
      await executeJob(data.job, state)
    }
  } catch (err) {
    console.error(`[JOBS] Poll error: ${err.message}`)
  }
}

async function claimJob(jobId) {
  await fetch(`${loadConfig().backendUrl}/api/bot/jobs/${jobId}/claim`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Bot-Key': loadConfig().botApiKey },
    body: JSON.stringify({ bot_id: loadConfig().username }),
  })
}

export async function executeJob(job, state) {
  console.log(`[JOBS] Executing job ${job.id}: ${job.job_type}`)
  // TODO: implement depot travel, loading, delivery
  // For scaffold, just mark completed after a delay
  await new Promise((r) => setTimeout(r, 2000))
  await updateJob(job.id, 'completed', { note: 'Scaffold execution complete' })
  state.activeJob = null
}

async function updateJob(jobId, status, payload) {
  await fetch(`${loadConfig().backendUrl}/api/bot/jobs/${jobId}/update`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Bot-Key': loadConfig().botApiKey },
    body: JSON.stringify({ status, payload }),
  })
}
