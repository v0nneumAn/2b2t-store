import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

type Server = '2b2t' | 'donutsmp' | 'other'

interface Apple {
  id: number
  x: number
  size: number
  delay: number
  duration: number
  sway: number
  swayEnd: number
  scale: number
  scaleEnd: number
  spinMid: number
  spin: number
}

const SERVER_CONFIG: Record<Server, { title: string; logo: string; accent: string }> = {
  '2b2t': {
    title: '2b2t Items & Kits',
    logo: '/assets/landing/2b2t_transparent.png',
    accent: '#f97316',
  },
  donutsmp: {
    title: 'Donut SMP Items',
    logo: '/assets/landing/donutsmp_transparent.png',
    accent: '#0ea5e9',
  },
  other: {
    title: 'Minecraft Deliveries',
    logo: '',
    accent: '#a855f7',
  },
}

function Home() {
  const [activeServer, setActiveServer] = useState<Server>('2b2t')
  const [isRaining, setIsRaining] = useState(false)
  const [colourCycle, setColourCycle] = useState(false)
  const [apples, setApples] = useState<Apple[]>([])
  const prefersReducedMotion = useRef(false)
  const appleId = useRef(0)

  useEffect(() => {
    prefersReducedMotion.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }, [])

  const config = SERVER_CONFIG[activeServer]

  const handleServerChange = (server: Server) => {
    setActiveServer(server)
  }

  const triggerGoldenAppleRain = () => {
    if (prefersReducedMotion.current) return

    setColourCycle(true)
    setIsRaining(true)

    const isSmallScreen = window.innerWidth < 640
    const appleCount = isSmallScreen ? 32 : 58
    const newApples: Apple[] = []

    for (let i = 0; i < appleCount; i++) {
      const size = randomBetween(isSmallScreen ? 24 : 26, isSmallScreen ? 44 : 58)
      const sway = randomBetween(-140, 140)
      const scale = randomBetween(0.78, 1.24)
      const spin = randomBetween(-720, 720)

      newApples.push({
        id: appleId.current++,
        x: randomBetween(-5, 100),
        size,
        delay: randomBetween(0, 1.25),
        duration: randomBetween(3.2, 4.8),
        sway,
        swayEnd: -sway * randomBetween(0.2, 0.65),
        scale,
        scaleEnd: scale * randomBetween(0.65, 0.95),
        spinMid: spin * 0.55,
        spin,
      })
    }

    setApples(newApples)

    setTimeout(() => {
      setIsRaining(false)
      setApples([])
    }, 5800)

    setTimeout(() => {
      setColourCycle(false)
    }, 2600)
  }

  const heroTitle = useMemo(() => {
    if (activeServer === 'donutsmp') return 'Donut SMP Items'
    if (activeServer === '2b2t') return '2b2t Items & Kits'
    return 'Minecraft Deliveries'
  }, [activeServer])

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-white overflow-x-hidden">
      {/* Apple rain overlay */}
      {isRaining && (
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_28%_18%,rgba(250,204,21,0.18),transparent_28%),radial-gradient(circle_at_76%_8%,rgba(251,146,60,0.15),transparent_24%)] animate-pulse" />
          {apples.map((apple) => (
            <img
              key={apple.id}
              src="/assets/landing/enchanted_golden_apple.gif"
              alt=""
              className="absolute top-[-90px] object-contain pixelated"
              style={{
                left: `${apple.x.toFixed(2)}vw`,
                width: `${apple.size.toFixed(0)}px`,
                height: `${apple.size.toFixed(0)}px`,
                filter: 'drop-shadow(0 0 12px rgba(250,204,21,0.65))',
                animation: `appleFall ${apple.duration.toFixed(2)}s linear ${apple.delay.toFixed(2)}s forwards`,
                '--sway': `${apple.sway.toFixed(0)}px`,
                '--sway-end': `${apple.swayEnd.toFixed(0)}px`,
                '--scale': apple.scale.toFixed(2),
                '--scale-end': apple.scaleEnd.toFixed(2),
                '--spin-mid': `${apple.spinMid.toFixed(0)}deg`,
                '--spin': `${apple.spin.toFixed(0)}deg`,
              } as React.CSSProperties}
            />
          ))}
        </div>
      )}

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full blur-[120px] transition-colors duration-500"
            style={{ backgroundColor: `${config.accent}10` }}
          />
          <div
            className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full blur-[100px] transition-colors duration-500"
            style={{ backgroundColor: `${config.accent}08` }}
          />
        </div>

        <div className="relative max-w-6xl mx-auto px-4 py-20 lg:py-28">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left content */}
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium transition-colors duration-300"
                style={{ borderColor: `${config.accent}30`, backgroundColor: `${config.accent}10`, color: config.accent }}
              >
                <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: config.accent }} />
                In-game Delivery
              </div>

              {config.logo && (
                <div className="h-12">
                  <img
                    src={config.logo}
                    alt="Server logo"
                    className="h-full w-auto object-contain transition-all duration-300"
                  />
                </div>
              )}

              <h1 className="text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1]">
                The Ultimate Shop for
                <span
                  className="block transition-colors duration-300"
                  style={{ color: config.accent }}
                >
                  {heroTitle}
                </span>
              </h1>

              <p className="text-lg text-zinc-400 max-w-xl leading-relaxed">
                Premium kits, ranks, and items — packaged in{' '}
                <strong className="text-white">shulker boxes</strong> and delivered straight to
                your character. Trusted by thousands of players.
              </p>

              <div className="flex flex-wrap gap-4">
                <Link
                  to="/shop?server=2b2t"
                  onClick={() => handleServerChange('2b2t')}
                  className={`inline-flex items-center justify-center gap-3 px-6 py-3.5 font-semibold rounded-xl transition-all ${
                    activeServer === '2b2t'
                      ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/25'
                      : 'bg-zinc-800 text-zinc-200 border border-zinc-700 hover:bg-zinc-700'
                  }`}
                >
                  <img
                    src="/assets/landing/2b2t_transparent.png"
                    alt="2b2t"
                    className="h-6 w-auto"
                  />
                  <span className="sm:inline hidden">Shop 2b2t</span>
                </Link>
                <Link
                  to="/shop?server=donutsmp"
                  onClick={() => handleServerChange('donutsmp')}
                  className={`inline-flex items-center justify-center gap-3 px-6 py-3.5 font-semibold rounded-xl transition-all ${
                    activeServer === 'donutsmp'
                      ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/25'
                      : 'bg-zinc-800 text-zinc-200 border border-zinc-700 hover:bg-zinc-700'
                  }`}
                >
                  <img
                    src="/assets/landing/donutsmp_transparent.png"
                    alt="Donut SMP"
                    className="h-6 w-auto"
                  />
                  <span className="sm:inline hidden">Shop Donut SMP</span>
                </Link>
              </div>

              <div className="flex items-center gap-8 pt-4">
                <div>
                  <div className="text-2xl font-bold text-white">5,000+</div>
                  <div className="text-sm text-zinc-500">Orders Delivered</div>
                </div>
                <div className="w-px h-10 bg-zinc-800" />
                <div>
                  <div className="text-2xl font-bold text-white">2 min</div>
                  <div className="text-sm text-zinc-500">Avg. Delivery</div>
                </div>
                <div className="w-px h-10 bg-zinc-800" />
                <div>
                  <div className="text-2xl font-bold text-white">100%</div>
                  <div className="text-sm text-zinc-500">Automated</div>
                </div>
              </div>
            </div>

            {/* Right visual */}
            <div className="relative flex items-center justify-center">
              <div
                className="absolute w-72 h-72 lg:w-96 lg:h-96 rounded-full border animate-pulse transition-colors duration-500"
                style={{ borderColor: `${config.accent}20` }}
              />
              <div
                className="absolute w-64 h-64 lg:w-80 lg:h-80 rounded-full border transition-colors duration-500"
                style={{ borderColor: `${config.accent}10` }}
              />
              <button
                type="button"
                onClick={triggerGoldenAppleRain}
                className={`relative w-48 h-48 lg:w-64 lg:h-64 flex items-center justify-center rounded-full bg-zinc-900/50 border border-zinc-800 transition-all hover:scale-105 active:scale-95 ${
                  colourCycle ? 'animate-colour-cycle' : ''
                }`}
                aria-label="Make it rain enchanted golden apples and colour-cycle the shulker box"
              >
                <img
                  src="/assets/landing/shulker_box_white.png"
                  alt="Shulker Box"
                  className="w-32 h-32 lg:w-44 lg:h-44 object-contain"
                  style={{
                    filter: colourCycle
                      ? 'hue-rotate(360deg) saturate(1.75) brightness(1.18)'
                      : 'drop-shadow(0 0 40px rgba(249,115,22,0.35))',
                    transition: 'filter 2.6s linear',
                  }}
                />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800/50 bg-[#0a0a0b]">
        <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-zinc-500">
            © 2026 Shulker.Shop. Not affiliated with Mojang AB, Microsoft, 2b2t or Donut SMP.
          </p>
          <a
            href="https://discord.gg"
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-400 hover:text-white transition-colors"
            aria-label="Join Discord"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.094 13.094 0 01-1.873-.894.077.077 0 01-.008-.128c.126-.093.252-.19.372-.287a.075.075 0 01.077-.011c3.92 1.793 8.18 1.793 12.061 0a.073.073 0 01.078.009c.12.099.246.195.373.289a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.894.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03z" />
            </svg>
          </a>
        </div>
      </footer>

      <style>{`
        @keyframes appleFall {
          0% {
            transform: translateY(0) translateX(0) scale(var(--scale)) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          25% {
            transform: translateY(25vh) translateX(var(--sway)) scale(var(--scale)) rotate(var(--spin-mid));
          }
          100% {
            transform: translateY(110vh) translateX(var(--sway-end)) scale(var(--scale-end)) rotate(var(--spin));
            opacity: 0;
          }
        }
      `}</style>
    </div>
  )
}

function randomBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min
}

export default Home
