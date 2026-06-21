import mineflayer from 'mineflayer'
import { pathfinder } from 'mineflayer-pathfinder'
import express from 'express'
import { loadConfig, pollForJobs, executeJob } from './jobs.js'

const CONFIG = loadConfig()

let bot = null
let state = {
  inQueue: true,
  queuePosition: null,
  connected: false,
  health: 20,
  food: 20,
  position: { x: 0, y: 0, z: 0 },
  inventory: [],
  activeJob: null,
  isMoving: false,
}

function createBot() {
  bot = mineflayer.createBot({
    host: CONFIG.host,
    port: CONFIG.port,
    username: CONFIG.username,
    version: CONFIG.version,
    auth: CONFIG.auth,
    checkTimeoutInterval: 60000,
  })

  bot.loadPlugin(pathfinder)

  bot.on('login', () => {
    console.log(`[${new Date().toISOString()}] Logged in as ${bot.username}`)
    state.connected = true
  })

  bot.on('spawn', () => {
    state.inQueue = false
    state.queuePosition = null
    console.log(`[${new Date().toISOString()}] Spawned in world`)
  })

  bot.on('messagestr', (msg) => {
    const queueMatch = msg.match(/Position in queue: (\d+)/)
    if (queueMatch) {
      state.queuePosition = parseInt(queueMatch[1])
      state.inQueue = true
      return
    }
    if (msg.includes('Connecting to the server')) {
      state.inQueue = false
    }
  })

  bot.on('physicsTick', () => {
    if (!bot.entity) return
    state.position = {
      x: Math.floor(bot.entity.position.x),
      y: Math.floor(bot.entity.position.y),
      z: Math.floor(bot.entity.position.z),
    }
    state.health = bot.health
    state.food = bot.food
    state.inventory = bot.inventory.items().map((i) => ({
      name: i.name,
      count: i.count,
      slot: i.slot,
    }))
  })

  bot.on('end', () => {
    console.log(`[${new Date().toISOString()}] Disconnected. Reconnecting in 30s...`)
    state.connected = false
    setTimeout(createBot, 30000)
  })

  bot.on('error', (err) => {
    console.error(`[ERROR] ${err.message}`)
  })
}

// HTTP API for backend/agent integration
const app = express()
app.use(express.json())

app.get('/state', (_req, res) => res.json(state))

app.post('/act', async (req, res) => {
  const { action, params = {} } = req.body
  if (action === 'say') {
    bot.chat(params.message)
    return res.json({ success: true })
  }
  if (action === 'disconnect') {
    bot.quit()
    return res.json({ success: true })
  }
  res.status(400).json({ success: false, error: `Unknown action: ${action}` })
})

app.listen(CONFIG.apiPort, '0.0.0.0', () => {
  console.log(`Bot API listening on 0.0.0.0:${CONFIG.apiPort}`)
})

createBot()

// Poll backend for delivery jobs every 10s
setInterval(() => pollForJobs(state, executeJob), 10000)
