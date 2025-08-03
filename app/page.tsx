"use client"

import type React from "react"

import { useEffect, useRef, useState, Suspense } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { Float, Environment, Html } from "@react-three/drei"
import { motion } from "framer-motion"
import * as THREE from "three"
import {
  Moon,
  Sun,
  Volume2,
  VolumeX,
  AlertCircle,
  HelpCircle,
  EyeOff,
  Activity,
  FastForward,
  Shuffle,
} from "lucide-react"
import { useTheme } from "next-themes"

// Smooth interpolation utility
function lerp(start: number, end: number, factor: number) {
  return start + (end - start) * factor
}

// Enhanced color palettes
const colorPalettes = {
  light: {
    background: "radial-gradient(circle, #fef7f0 0%, #f0f9ff 30%, #fdf2f8 60%, #f0fdf4 100%)",
    core: "#ffffff",
    coreEmissive: "#fef3c7",
    anxiety: "#fda4af", // Soft rose
    overthinking: "#fdba74", // Soft peach
    restlessness: "#c4b5fd", // Soft lavender
    thoughts: {
      worry: "#fb7185", // Rose
      doubt: "#fb923c", // Orange
      fear: "#a78bfa", // Purple
      stress: "#f472b6", // Pink
      rush: "#fbbf24", // Amber
      chaos: "#8b5cf6", // Violet
    },
    particles: "#7dd3fc", // Sky blue
    ambient: "#fde047", // Yellow
    point1: "#f472b6", // Pink
    point2: "#06b6d4", // Cyan
  },
  dark: {
    background: "radial-gradient(circle, #0f0f23 0%, #1e1b4b 50%, #000000 100%)",
    core: "#1e293b",
    coreEmissive: "#334155",
    anxiety: "#dc2626", // Deep red
    overthinking: "#ea580c", // Deep orange
    restlessness: "#7c3aed", // Deep purple
    thoughts: {
      worry: "#ef4444",
      doubt: "#f97316",
      fear: "#8b5cf6",
      stress: "#ec4899",
      rush: "#f59e0b",
      chaos: "#6366f1",
    },
    particles: "#3b82f6",
    ambient: "#6366f1",
    point1: "#8b5cf6",
    point2: "#06b6d4",
  },
}

// Enhanced ambient audio with smoother transitions
class AmbientAudio {
  private audioContext: AudioContext | null = null
  private oscillators: OscillatorNode[] = []
  private gainNodes: GainNode[] = []
  private masterGain: GainNode | null = null

  constructor() {
    if (typeof window !== "undefined") {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      this.masterGain = this.audioContext.createGain()
      this.masterGain.connect(this.audioContext.destination)
      this.masterGain.gain.setValueAtTime(0.3, this.audioContext.currentTime)
    }
  }

  playWindChimes(theme: string) {
    if (!this.audioContext || !this.masterGain) return

    const frequencies = theme === "dark" ? [174, 285, 396, 528] : [528, 639, 741, 852]

    frequencies.forEach((freq, index) => {
      setTimeout(() => {
        const oscillator = this.audioContext!.createOscillator()
        const gainNode = this.audioContext!.createGain()
        const filter = this.audioContext!.createBiquadFilter()

        oscillator.connect(filter)
        filter.connect(gainNode)
        gainNode.connect(this.masterGain!)

        oscillator.frequency.setValueAtTime(freq, this.audioContext!.currentTime)
        oscillator.type = "sine"

        filter.type = "lowpass"
        filter.frequency.setValueAtTime(2000, this.audioContext!.currentTime)
        filter.Q.setValueAtTime(1, this.audioContext!.currentTime)

        gainNode.gain.setValueAtTime(0, this.audioContext!.currentTime)
        gainNode.gain.linearRampToValueAtTime(0.15, this.audioContext!.currentTime + 0.4) // Slower fade in
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext!.currentTime + 4) // Slower fade out

        oscillator.start(this.audioContext!.currentTime)
        oscillator.stop(this.audioContext!.currentTime + 4)
      }, index * 200) // Slower chime interval
    })
  }

  createAmbientDrone(theme: string) {
    if (!this.audioContext || !this.masterGain) return

    this.stop()

    const baseFreq = theme === "dark" ? 40 : 80
    const harmonics = [1, 1.5, 2, 2.5, 3]

    harmonics.forEach((harmonic, index) => {
      const oscillator = this.audioContext!.createOscillator()
      const gainNode = this.audioContext!.createGain()
      const filter = this.audioContext!.createBiquadFilter()

      oscillator.connect(filter)
      filter.connect(gainNode)
      gainNode.connect(this.masterGain!)

      oscillator.frequency.setValueAtTime(baseFreq * harmonic, this.audioContext!.currentTime)
      oscillator.type = index % 2 === 0 ? "sine" : "triangle"

      filter.type = "lowpass"
      filter.frequency.setValueAtTime(800, this.audioContext!.currentTime)

      const volume = 0.03 / (index + 1)
      gainNode.gain.setValueAtTime(0, this.audioContext!.currentTime)
      gainNode.gain.linearRampToValueAtTime(volume, this.audioContext!.currentTime + 3) // Slower fade in

      oscillator.start()

      this.oscillators.push(oscillator)
      this.gainNodes.push(gainNode)
    })
  }

  stop() {
    this.oscillators.forEach((osc) => {
      try {
        osc.stop()
      } catch (e) {
        // Oscillator already stopped
      }
    })
    this.oscillators = []
    this.gainNodes = []
  }
}

// Enhanced floating thought with smoother animations and icons
function FloatingThought({
  position,
  text,
  icon: Icon,
  color,
  onInteract,
  theme,
}: {
  position: [number, number, number]
  text: string
  icon: React.ElementType
  color: string
  onInteract: () => void
  theme: string
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const [hovered, setHovered] = useState(false)
  const [clicked, setClicked] = useState(false)
  const targetScale = useRef(1)
  const currentScale = useRef(1)
  const floatOffset = useRef(Math.random() * Math.PI * 2)

  useFrame((state, delta) => {
    if (meshRef.current && !clicked) {
      // Smooth floating motion (slower)
      const floatY = Math.sin(state.clock.elapsedTime * 0.3 + floatOffset.current) * 0.4 // Slower speed, slightly larger range
      meshRef.current.position.y = position[1] + floatY

      // Smooth rotation (slower)
      meshRef.current.rotation.y += delta * 0.1
      meshRef.current.rotation.x += delta * 0.05

      // Smooth scale interpolation (slower response)
      targetScale.current = hovered ? 1.3 : 1
      currentScale.current = lerp(currentScale.current, targetScale.current, delta * 6) // Slower lerp factor
      meshRef.current.scale.setScalar(currentScale.current)
    }
  })

  const handleClick = () => {
    if (clicked) return
    setClicked(true)
    onInteract()

    // Smooth dissolution animation (slower)
    if (meshRef.current) {
      const mesh = meshRef.current
      const startY = mesh.position.y
      const startScale = mesh.scale.x

      const animate = () => {
        mesh.position.y += 0.015 // Slower float away
        mesh.scale.multiplyScalar(0.995) // Slower shrink
        mesh.rotation.y += 0.03 // Slower rotation

        if (mesh.position.y < startY + 5 && mesh.scale.x > 0.05) {
          requestAnimationFrame(animate)
        }
      }
      animate()
    }
  }

  const palette = colorPalettes[theme as keyof typeof colorPalettes]

  return (
    <Float speed={0.6} rotationIntensity={0.08} floatIntensity={0.4}>
      {" "}
      {/* Slower float speed */}
      <mesh
        ref={meshRef}
        position={position}
        onClick={handleClick}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
      >
        <sphereGeometry args={[0.25, 20, 20]} />
        <meshPhysicalMaterial
          color={color}
          transparent
          opacity={0.8}
          transmission={0.9}
          roughness={0.05}
          metalness={0.1}
          clearcoat={1}
          clearcoatRoughness={0.1}
          ior={1.4}
        />
        <Html distanceFactor={8} position={[0, 0, 0]}>
          <div className="flex items-center space-x-1 text-white dark:text-gray-200 text-xs font-light text-center pointer-events-none px-2 py-1 rounded-full bg-black/20 dark:bg-white/10 backdrop-blur-sm">
            <Icon className="w-3 h-3" />
            <span>{text}</span>
          </div>
        </Html>
      </mesh>
    </Float>
  )
}

// Enhanced mind layer with smoother materials and animations
function MindLayer({
  radius,
  color,
  opacity,
  rotation,
  crackProgress,
  theme,
}: {
  radius: number
  color: string
  opacity: number
  rotation: number
  crackProgress: number
  theme: string
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const targetOpacity = useRef(opacity)
  const currentOpacity = useRef(opacity)

  useFrame((state, delta) => {
    if (meshRef.current) {
      // Smooth rotation (slower)
      meshRef.current.rotation.y += rotation * delta * 40 // Reduced multiplier
      meshRef.current.rotation.x += rotation * 0.5 * delta * 40 // Reduced multiplier

      // Smooth opacity transition (slower)
      targetOpacity.current = opacity * (1 - crackProgress * 0.8)
      currentOpacity.current = lerp(currentOpacity.current, targetOpacity.current, delta * 3) // Slower lerp factor

      if (meshRef.current.material) {
        ;(meshRef.current.material as THREE.MeshPhysicalMaterial).opacity = currentOpacity.current
      }

      // Smooth scale based on crack progress (slower)
      const scale = 1 + crackProgress * 0.15 // Reduced scale expansion
      meshRef.current.scale.setScalar(scale)
    }
  })

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[radius, 40, 40]} />
      <meshPhysicalMaterial
        color={color}
        transparent
        opacity={opacity}
        transmission={0.9}
        roughness={0.02}
        metalness={0.1}
        clearcoat={1}
        clearcoatRoughness={0.05}
        ior={1.5}
        side={THREE.DoubleSide}
        envMapIntensity={0.8}
      />
    </mesh>
  )
}

// Enhanced main 3D scene with smoother animations
function MindOrbScene({ scrollProgress, theme }: { scrollProgress: number; theme: string }) {
  const { camera } = useThree()
  const groupRef = useRef<THREE.Group>(null)
  const [interactedThoughts, setInteractedThoughts] = useState<Set<string>>(new Set())

  // Smooth camera animation
  const targetCameraZ = useRef(8)
  const targetCameraY = useRef(0)
  const currentCameraZ = useRef(8)
  const currentCameraY = useRef(0)

  useFrame((state, delta) => {
    if (camera) {
      // Smooth camera movement (slower)
      targetCameraZ.current = 8 - scrollProgress * 3.5 // Slightly less movement
      targetCameraY.current = scrollProgress * 1.2 // Slightly less movement

      currentCameraZ.current = lerp(currentCameraZ.current, targetCameraZ.current, delta * 2) // Slower lerp factor
      currentCameraY.current = lerp(currentCameraY.current, targetCameraY.current, delta * 2) // Slower lerp factor

      camera.position.z = currentCameraZ.current
      camera.position.y = currentCameraY.current
      camera.lookAt(0, 0, 0)
    }

    // Smooth group rotation (slower)
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.05 // Reduced rotation speed
    }
  })

  // Smooth progress calculations
  const anxietyProgress = Math.max(0, Math.min(1, (scrollProgress - 0.15) * 3)) // Slower reveal
  const overthinkingProgress = Math.max(0, Math.min(1, (scrollProgress - 0.35) * 3)) // Slower reveal
  const restlessnessProgress = Math.max(0, Math.min(1, (scrollProgress - 0.55) * 3)) // Slower reveal
  const dissolutionProgress = Math.max(0, Math.min(1, (scrollProgress - 0.75) * 3)) // Slower reveal

  const handleThoughtInteract = (thoughtId: string) => {
    setInteractedThoughts((prev) => new Set([...prev, thoughtId]))
  }

  const palette = colorPalettes[theme as keyof typeof colorPalettes]

  const thoughts = [
    {
      id: "worry",
      text: "Worry",
      icon: AlertCircle,
      position: [-2.5, 1.2, 1.5] as [number, number, number],
      color: palette.thoughts.worry,
    },
    {
      id: "doubt",
      text: "Doubt",
      icon: HelpCircle,
      position: [2.2, -1.5, 1.2] as [number, number, number],
      color: palette.thoughts.doubt,
    },
    {
      id: "fear",
      text: "Fear",
      icon: EyeOff,
      position: [-1.8, -2.2, 2.1] as [number, number, number],
      color: palette.thoughts.fear,
    },
    {
      id: "stress",
      text: "Stress",
      icon: Activity,
      position: [1.5, 2.3, -1.2] as [number, number, number],
      color: palette.thoughts.stress,
    },
    {
      id: "rush",
      text: "Rush",
      icon: FastForward,
      position: [3.1, 0.2, 0.5] as [number, number, number],
      color: palette.thoughts.rush,
    },
    {
      id: "chaos",
      text: "Chaos",
      icon: Shuffle,
      position: [-3.2, 0.8, -1.1] as [number, number, number],
      color: palette.thoughts.chaos,
    },
  ]

  return (
    <group ref={groupRef}>
      {/* Enhanced core orb */}
      <mesh>
        <sphereGeometry args={[1.2, 50, 50]} />
        <meshPhysicalMaterial
          color={palette.core}
          transparent
          opacity={0.9}
          transmission={0.95}
          roughness={0.01}
          metalness={0.05}
          clearcoat={1}
          clearcoatRoughness={0.01}
          ior={1.5}
          emissive={palette.coreEmissive}
          emissiveIntensity={0.1}
          envMapIntensity={1}
        />
      </mesh>

      {/* Enhanced mind layers */}
      {scrollProgress > 0.15 && (
        <MindLayer
          radius={1.8}
          color={palette.anxiety}
          opacity={0.4}
          rotation={0.005} // Slower rotation
          crackProgress={anxietyProgress}
          theme={theme}
        />
      )}

      {scrollProgress > 0.35 && (
        <MindLayer
          radius={2.4}
          color={palette.overthinking}
          opacity={0.35}
          rotation={-0.004} // Slower rotation
          crackProgress={overthinkingProgress}
          theme={theme}
        />
      )}

      {scrollProgress > 0.55 && (
        <MindLayer
          radius={3.0}
          color={palette.restlessness}
          opacity={0.3}
          rotation={0.006} // Slower rotation
          crackProgress={restlessnessProgress}
          theme={theme}
        />
      )}

      {/* Enhanced floating thoughts */}
      {scrollProgress > 0.25 &&
        scrollProgress < 0.75 &&
        thoughts.map((thought) => (
          <FloatingThought
            key={thought.id}
            position={thought.position}
            text={thought.text}
            icon={thought.icon}
            color={thought.color}
            onInteract={() => handleThoughtInteract(thought.id)}
            theme={theme}
          />
        ))}

      {/* Enhanced peaceful particles */}
      {scrollProgress > 0.75 && (
        <>
          {Array.from({ length: 40 }).map((_, i) => (
            <Float key={i} speed={0.2 + Math.random() * 0.3} rotationIntensity={0.03}>
              {" "}
              {/* Slower particle float */}
              <mesh position={[(Math.random() - 0.5) * 15, (Math.random() - 0.5) * 15, (Math.random() - 0.5) * 15]}>
                {" "}
                {/* Larger spread */}
                <sphereGeometry args={[0.03 + Math.random() * 0.04, 12, 12]} />
                <meshBasicMaterial color={palette.particles} transparent opacity={0.6 + Math.random() * 0.3} />
              </mesh>
            </Float>
          ))}
        </>
      )}

      {/* Enhanced lighting */}
      <ambientLight intensity={theme === "dark" ? 0.4 : 0.7} color={palette.ambient} />
      <pointLight
        position={[8, 8, 8]}
        intensity={theme === "dark" ? 0.8 : 1.2}
        color={palette.point1}
        decay={2}
        distance={20}
      />
      <pointLight position={[-8, -8, -8]} intensity={0.5} color={palette.point2} decay={2} distance={15} />
      <spotLight
        position={[0, 10, 0]}
        angle={Math.PI / 6}
        penumbra={0.5}
        intensity={0.3}
        color={palette.ambient}
        target-position={[0, 0, 0]}
      />
    </group>
  )
}

// Enhanced theme and audio controls
function Controls() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [audioEnabled, setAudioEnabled] = useState(false)
  const audioRef = useRef<AmbientAudio | null>(null)

  useEffect(() => {
    setMounted(true)
    audioRef.current = new AmbientAudio()
  }, [])

  useEffect(() => {
    if (audioRef.current && audioEnabled) {
      audioRef.current.stop()
      setTimeout(() => {
        audioRef.current?.createAmbientDrone(theme || "dark")
      }, 100)
    }
  }, [theme, audioEnabled])

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark"
    setTheme(newTheme)

    if (audioRef.current && audioEnabled) {
      setTimeout(() => {
        audioRef.current?.playWindChimes(newTheme)
      }, 200)
    }
  }

  const toggleAudio = () => {
    if (audioRef.current) {
      if (audioEnabled) {
        audioRef.current.stop()
      } else {
        audioRef.current.createAmbientDrone(theme || "dark")
      }
      setAudioEnabled(!audioEnabled)
    }
  }

  if (!mounted) return null

  return (
    <>
      <motion.button
        onClick={toggleTheme}
        className="fixed top-6 right-6 z-50 p-4 rounded-full bg-white/20 dark:bg-gray-900/30 backdrop-blur-xl border border-white/30 dark:border-gray-700/40 shadow-2xl"
        whileHover={{ scale: 1.1, rotate: 15 }}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0, scale: 0, rotate: -180 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        transition={{ delay: 1, type: "spring", stiffness: 150, damping: 12 }}
      >
        {theme === "dark" ? <Sun className="w-6 h-6 text-amber-400" /> : <Moon className="w-6 h-6 text-indigo-600" />}
      </motion.button>

      <motion.button
        onClick={toggleAudio}
        className="fixed top-6 left-6 z-50 p-4 rounded-full bg-white/20 dark:bg-gray-900/30 backdrop-blur-xl border border-white/30 dark:border-gray-700/40 shadow-2xl"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0, scale: 0, rotate: -180 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        transition={{ delay: 1.2, type: "spring", stiffness: 150, damping: 12 }}
      >
        {audioEnabled ? (
          <Volume2 className="w-6 h-6 text-emerald-400" />
        ) : (
          <VolumeX className="w-6 h-6 text-gray-500" />
        )}
      </motion.button>
    </>
  )
}

// Enhanced scroll progress indicator
function ScrollIndicator({ progress }: { progress: number }) {
  const stages = [
    { name: "Mind", color: "from-blue-400 to-purple-400" },
    { name: "Anxiety", color: "from-rose-400 to-pink-400" },
    { name: "Overthinking", color: "from-orange-400 to-amber-400" },
    { name: "Restlessness", color: "from-purple-400 to-violet-400" },
    { name: "Peace", color: "from-emerald-400 to-cyan-400" },
  ]

  const currentStage = Math.floor(progress * stages.length)
  const stageProgress = (progress * stages.length) % 1

  return (
    <motion.div
      className="fixed left-6 top-1/2 transform -translate-y-1/2 z-40"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 2, type: "spring" }}
    >
      <div className="w-2 h-64 bg-white/20 dark:bg-gray-800/20 rounded-full overflow-hidden backdrop-blur-sm border border-pink-200/30 dark:border-gray-700/30">
        {" "}
        {/* Increased height to h-64 */}
        <motion.div
          className={`w-full bg-gradient-to-t ${stages[Math.min(currentStage, stages.length - 1)]?.color} rounded-full origin-bottom`}
          style={{ height: `${progress * 100}%` }}
          transition={{ type: "spring", stiffness: 100, damping: 20 }}
        />
      </div>
      <motion.div
        className="mt-4 text-xs text-gray-700 dark:text-gray-300/80 text-center font-medium"
        key={currentStage}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {stages[Math.min(currentStage, stages.length - 1)]?.name}
      </motion.div>
    </motion.div>
  )
}

// Enhanced text overlay with smoother transitions
function TextOverlay({ scrollProgress }: { scrollProgress: number }) {
  const messages = [
    { threshold: 0, text: "Enter the temple of your mind", subtext: "Scroll to begin your journey inward" },
    { threshold: 0.2, text: "The first layer reveals", subtext: "Anxiety shows its gentle face" },
    { threshold: 0.4, text: "Thoughts begin to swirl", subtext: "Overthinking takes its form" },
    { threshold: 0.6, text: "Energy seeks release", subtext: "Restlessness stirs within" },
    { threshold: 0.75, text: "All dissolves into peace", subtext: "You have reached your calm core" },
  ]

  const currentMessage = messages
    .slice()
    .reverse()
    .find((msg) => scrollProgress >= msg.threshold)

  // Hide text overlay when final CTA should appear
  if (!currentMessage || scrollProgress > 0.85) return null

  return (
    <motion.div
      className="fixed inset-0 flex items-center justify-center pointer-events-none z-30"
      initial={{ opacity: 0 }}
      animate={{ opacity: scrollProgress > 0.85 ? 0 : 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }} // Slower fade
      key={currentMessage.text}
    >
      <div className="text-center max-w-3xl px-6">
        <motion.h2
          className="text-4xl md:text-6xl font-light text-gray-800 dark:text-gray-100 mb-6 leading-tight"
          initial={{ opacity: 0, y: 40, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }} // Slower animation
          style={{
            textShadow: "0 4px 20px rgba(0,0,0,0.1)",
          }}
        >
          {currentMessage.text}
        </motion.h2>
        <motion.p
          className="text-lg md:text-xl text-gray-600 dark:text-gray-300 leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.4, ease: "easeOut" }} // Slower animation
        >
          {currentMessage.subtext}
        </motion.p>
      </div>
    </motion.div>
  )
}

// Enhanced final call to action
function FinalCTA({ visible }: { visible: boolean }) {
  if (!visible) return null

  return (
    <motion.div
      className="fixed inset-0 flex items-center justify-center z-40 pointer-events-none"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.8, duration: 1.2, ease: "easeOut" }} // Slower fade in
    >
      <div className="text-center max-w-2xl px-6">
        <motion.div
          className="mb-8"
          animate={{
            scale: [1, 1.05, 1],
            opacity: [0.8, 1, 0.8],
          }}
          transition={{
            duration: 5, // Slower pulse
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
        >
          <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-r from-pink-200/40 to-purple-200/40 dark:from-blue-400/30 dark:to-purple-400/30 backdrop-blur-xl flex items-center justify-center border border-pink-200/50 dark:border-gray-700/40">
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-white/40 to-pink-100/30 dark:from-gray-800/30 dark:to-gray-800/10 backdrop-blur-sm" />
          </div>
        </motion.div>

        <motion.h2
          className="text-3xl md:text-5xl font-light text-gray-800 dark:text-gray-100 mb-6 leading-tight"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5, duration: 1 }} // Slower animation
        >
          Welcome to your calm core
        </motion.h2>

        <motion.p
          className="text-lg text-gray-600 dark:text-gray-300 mb-8 leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.8, duration: 1 }} // Slower animation
        >
          You have journeyed through the layers of your mind.
          <br />
          Now, let your healing begin.
        </motion.p>

        <motion.button
          className="px-10 py-4 rounded-full bg-gradient-to-r from-pink-200/40 to-purple-200/40 dark:from-gray-800/30 dark:to-gray-800/10 backdrop-blur-xl border border-pink-200/60 dark:border-gray-700/40 text-gray-800 dark:text-gray-100 font-medium shadow-2xl pointer-events-auto hover:from-pink-200/60 hover:to-purple-200/60 dark:hover:from-gray-700/40 dark:hover:to-gray-700/20 transition-all duration-500"
          whileHover={{ scale: 1.05, y: -3 }}
          whileTap={{ scale: 0.98 }}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.1, duration: 1, type: "spring", stiffness: 100, damping: 15 }} // Slower spring
        >
          Begin Your Healing Journey
        </motion.button>
      </div>
    </motion.div>
  )
}

// Enhanced loading screen
function LoadingScreen() {
  return (
    <motion.div
      className="fixed inset-0 bg-gradient-to-br from-gray-900 via-purple-900/20 to-indigo-900/30 flex items-center justify-center z-50"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1 }}
    >
      <motion.div className="text-center" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}>
        <motion.div
          className="w-20 h-20 mx-auto mb-6 rounded-full border-2 border-white/20 border-t-white/80"
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }} // Slower rotation
        />
        <motion.p
          className="text-white/90 text-lg font-light"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY }} // Slower pulse
        >
          Entering the temple of your mind...
        </motion.p>
      </motion.div>
    </motion.div>
  )
}

// Smooth scroll progress hook
function useScrollProgress() {
  const [scrollProgress, setScrollProgress] = useState(0)
  const smoothProgress = useRef(0)

  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight
      const progress = Math.min(scrolled / maxScroll, 1)
      setScrollProgress(progress)
    }

    // Smooth scroll progress with RAF
    const updateSmoothProgress = () => {
      smoothProgress.current = lerp(smoothProgress.current, scrollProgress, 0.08) // Slower smoothing factor
      requestAnimationFrame(updateSmoothProgress)
    }
    updateSmoothProgress()

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [scrollProgress])

  return scrollProgress
}

export default function MaanShanti3DMind() {
  const [loading, setLoading] = useState(true)
  const scrollProgress = useScrollProgress()
  const { theme } = useTheme()

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 2500)
    return () => clearTimeout(timer)
  }, [])

  if (loading) {
    return <LoadingScreen />
  }

  const palette = colorPalettes[theme as keyof typeof colorPalettes] || colorPalettes.dark

  return (
    <div className="relative overflow-hidden">
      {/* Enhanced 3D Canvas */}
      <div className="fixed inset-0 z-0">
        <Canvas
          camera={{ position: [0, 0, 8], fov: 60 }}
          style={{
            background: palette.background,
          }}
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: "high-performance",
          }}
        >
          <Suspense fallback={null}>
            <MindOrbScene scrollProgress={scrollProgress} theme={theme || "dark"} />
            <Environment preset={theme === "dark" ? "night" : "dawn"} />
          </Suspense>
        </Canvas>
      </div>

      {/* UI Overlays */}
      <Controls />
      <ScrollIndicator progress={scrollProgress} />
      <TextOverlay scrollProgress={scrollProgress} />
      <FinalCTA visible={scrollProgress > 0.87} />

      {/* Scrollable content */}
      <div className="relative z-10 pointer-events-none">
        <div className="h-[600vh]" />
      </div>
    </div>
  )
}
