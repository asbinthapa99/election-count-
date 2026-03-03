'use client'

import { useEffect, useRef } from 'react'

interface Particle {
    x: number
    y: number
    z: number
    vx: number
    vy: number
    vz: number
    size: number
    color: string
    opacity: number
}

const COLORS = [
    'rgba(220, 38, 38, ',   // red
    'rgba(37, 99, 235, ',   // blue
    'rgba(16, 185, 129, ',  // green
    'rgba(245, 158, 11, ',  // amber
    'rgba(139, 92, 246, ',  // purple
    'rgba(6, 182, 212, ',   // cyan
]

export default function ParticleBackground() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const animRef = useRef<number>(0)
    const particlesRef = useRef<Particle[]>([])
    const mouseRef = useRef({ x: 0, y: 0 })

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        const resize = () => {
            canvas.width = canvas.offsetWidth * window.devicePixelRatio
            canvas.height = canvas.offsetHeight * window.devicePixelRatio
            ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
        }
        resize()
        window.addEventListener('resize', resize)

        // Create particles
        const COUNT = 60
        const particles: Particle[] = []
        for (let i = 0; i < COUNT; i++) {
            particles.push({
                x: Math.random() * canvas.offsetWidth,
                y: Math.random() * canvas.offsetHeight,
                z: Math.random() * 600 + 100,
                vx: (Math.random() - 0.5) * 0.4,
                vy: (Math.random() - 0.5) * 0.3,
                vz: (Math.random() - 0.5) * 0.8,
                size: Math.random() * 4 + 1.5,
                color: COLORS[Math.floor(Math.random() * COLORS.length)],
                opacity: Math.random() * 0.5 + 0.2,
            })
        }
        particlesRef.current = particles

        const handleMouse = (e: MouseEvent) => {
            const rect = canvas.getBoundingClientRect()
            mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top }
        }
        canvas.addEventListener('mousemove', handleMouse)

        let time = 0
        const animate = () => {
            time += 0.005
            const w = canvas.offsetWidth
            const h = canvas.offsetHeight
            ctx.clearRect(0, 0, w, h)

            // Sort by z for depth
            particles.sort((a, b) => b.z - a.z)

            const perspective = 600

            for (const p of particles) {
                // 3D perspective projection
                const scale = perspective / (perspective + p.z)
                const screenX = w / 2 + (p.x - w / 2) * scale
                const screenY = h / 2 + (p.y - h / 2) * scale
                const screenSize = p.size * scale

                // Float animation
                p.x += p.vx + Math.sin(time + p.z * 0.01) * 0.15
                p.y += p.vy + Math.cos(time * 0.8 + p.x * 0.005) * 0.1
                p.z += p.vz

                // Wrap around
                if (p.x < -20) p.x = w + 20
                if (p.x > w + 20) p.x = -20
                if (p.y < -20) p.y = h + 20
                if (p.y > h + 20) p.y = -20
                if (p.z < 50) p.z = 700
                if (p.z > 700) p.z = 50

                // Draw glowing orb
                const depthOpacity = p.opacity * scale
                const gradient = ctx.createRadialGradient(screenX, screenY, 0, screenX, screenY, screenSize * 3)
                gradient.addColorStop(0, p.color + depthOpacity + ')')
                gradient.addColorStop(0.4, p.color + depthOpacity * 0.5 + ')')
                gradient.addColorStop(1, p.color + '0)')

                ctx.beginPath()
                ctx.arc(screenX, screenY, screenSize * 3, 0, Math.PI * 2)
                ctx.fillStyle = gradient
                ctx.fill()

                // Core dot
                ctx.beginPath()
                ctx.arc(screenX, screenY, screenSize * 0.6, 0, Math.PI * 2)
                ctx.fillStyle = p.color + Math.min(depthOpacity * 2, 0.9) + ')'
                ctx.fill()
            }

            // Draw subtle connecting lines between nearby particles
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const a = particles[i], b = particles[j]
                    const scaleA = perspective / (perspective + a.z)
                    const scaleB = perspective / (perspective + b.z)
                    const ax = w / 2 + (a.x - w / 2) * scaleA
                    const ay = h / 2 + (a.y - h / 2) * scaleA
                    const bx = w / 2 + (b.x - w / 2) * scaleB
                    const by = h / 2 + (b.y - h / 2) * scaleB
                    const dist = Math.hypot(ax - bx, ay - by)
                    if (dist < 120) {
                        const lineOpacity = (1 - dist / 120) * 0.12
                        ctx.beginPath()
                        ctx.moveTo(ax, ay)
                        ctx.lineTo(bx, by)
                        ctx.strokeStyle = `rgba(148, 163, 184, ${lineOpacity})`
                        ctx.lineWidth = 0.5
                        ctx.stroke()
                    }
                }
            }

            animRef.current = requestAnimationFrame(animate)
        }

        animate()

        return () => {
            cancelAnimationFrame(animRef.current)
            window.removeEventListener('resize', resize)
            canvas.removeEventListener('mousemove', handleMouse)
        }
    }, [])

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full pointer-events-auto"
            style={{ opacity: 0.7 }}
        />
    )
}
