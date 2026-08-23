'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { Headphones, Volume2, VolumeX, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

interface SoundPreset {
  desc: string
  emoji: string
  id: string
  name: string
  type: 'campfire' | 'rain' | 'stream' | 'waves'
}

const PRESETS: SoundPreset[] = [
  { desc: '洱海与海东公路的潮汐律动', emoji: '🌊', id: 'waves', name: '海浪潮汐', type: 'waves' },
  { desc: '江南茶园与古镇屋檐下的淅沥细雨', emoji: '🌧️', id: 'rain', name: '林间细雨', type: 'rain' },
  { desc: '禾木图瓦木屋旁的温暖篝火微鸣', emoji: '🏕️', id: 'campfire', name: '壁炉篝火', type: 'campfire' },
  { desc: '九溪十八涧的潺潺清泉水流', emoji: '🍃', id: 'stream', name: '山涧溪流', type: 'stream' },
]

export function AmbienceSoundPlayer() {
  const [isOpen, setIsOpen] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentPreset, setCurrentPreset] = useState<SoundPreset>(PRESETS[0])
  const [volume, setVolume] = useState(0.4)

  const audioCtxRef = useRef<AudioContext | null>(null)
  const gainNodeRef = useRef<GainNode | null>(null)
  const sourceNodeRef = useRef<AudioNode | null>(null)
  const lfoIntervalRef = useRef<number | null>(null)

  // 停止当前音频
  const stopAudio = () => {
    if (lfoIntervalRef.current) {
      clearInterval(lfoIntervalRef.current)
      lfoIntervalRef.current = null
    }
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.disconnect()
      }
      catch {}
      sourceNodeRef.current = null
    }
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      audioCtxRef.current.suspend().catch(() => {})
    }
    setIsPlaying(false)
  }

  // 启动合成白噪音 (Web Audio API)
  const startAudio = async (preset: SoundPreset) => {
    stopAudio()

    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!AudioContextClass)
      return

    if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
      audioCtxRef.current = new AudioContextClass()
    }

    const ctx = audioCtxRef.current
    if (ctx.state === 'suspended') {
      await ctx.resume()
    }

    const bufferSize = ctx.sampleRate * 2
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const output = noiseBuffer.getChannelData(0)

    // 生成粉红噪声 / 棕色噪声
    let b0 = 0
    let b1 = 0
    let b2 = 0
    let b3 = 0
    let b4 = 0
    let b5 = 0
    let b6 = 0
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1
      b0 = 0.99886 * b0 + white * 0.0555179
      b1 = 0.99332 * b1 + white * 0.0750759
      b2 = 0.96900 * b2 + white * 0.1538520
      b3 = 0.86650 * b3 + white * 0.3104856
      b4 = 0.55000 * b4 + white * 0.5329522
      b5 = -0.7616 * b5 - white * 0.0168980
      output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11
      b6 = white * 0.115926
    }

    const whiteNoise = ctx.createBufferSource()
    whiteNoise.buffer = noiseBuffer
    whiteNoise.loop = true

    // 滤波器
    const filter = ctx.createBiquadFilter()
    const gainNode = ctx.createGain()
    gainNode.gain.setValueAtTime(volume * 0.6, ctx.currentTime)
    gainNodeRef.current = gainNode

    if (preset.type === 'waves') {
      // 海浪：低通滤波 + 周期性潮汐增益调制
      filter.type = 'lowpass'
      filter.frequency.setValueAtTime(450, ctx.currentTime)
      whiteNoise.connect(filter)
      filter.connect(gainNode)

      let phase = 0
      lfoIntervalRef.current = window.setInterval(() => {
        if (!gainNodeRef.current || !ctx)
          return
        phase += 0.05
        const swell = (Math.sin(phase) + 1) / 2
        const currentGain = volume * (0.15 + swell * 0.65)
        gainNodeRef.current.gain.setTargetAtTime(currentGain, ctx.currentTime, 0.2)
        filter.frequency.setTargetAtTime(250 + swell * 400, ctx.currentTime, 0.2)
      }, 100)
    }
    else if (preset.type === 'rain') {
      // 细雨：带通滤波 + 细微起伏
      filter.type = 'bandpass'
      filter.frequency.setValueAtTime(1200, ctx.currentTime)
      filter.Q.setValueAtTime(0.8, ctx.currentTime)
      whiteNoise.connect(filter)
      filter.connect(gainNode)
    }
    else if (preset.type === 'campfire') {
      // 篝火：低频微鸣
      filter.type = 'lowpass'
      filter.frequency.setValueAtTime(320, ctx.currentTime)
      whiteNoise.connect(filter)
      filter.connect(gainNode)
    }
    else {
      // 溪流
      filter.type = 'bandpass'
      filter.frequency.setValueAtTime(800, ctx.currentTime)
      filter.Q.setValueAtTime(1.2, ctx.currentTime)
      whiteNoise.connect(filter)
      filter.connect(gainNode)
    }

    gainNode.connect(ctx.destination)
    whiteNoise.start()
    sourceNodeRef.current = whiteNoise
    setIsPlaying(true)
  }

  // 调节音量
  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol)
    if (gainNodeRef.current && audioCtxRef.current) {
      gainNodeRef.current.gain.setTargetAtTime(newVol * 0.6, audioCtxRef.current.currentTime, 0.1)
    }
  }

  // 切换播放/暂停
  const togglePlay = () => {
    if (isPlaying) {
      stopAudio()
    }
    else {
      startAudio(currentPreset)
    }
  }

  // 切换音效
  const selectPreset = (preset: SoundPreset) => {
    setCurrentPreset(preset)
    if (isPlaying) {
      startAudio(preset)
    }
  }

  useEffect(() => {
    return () => {
      stopAudio()
    }
  }, [])

  return (
    <div className="fixed bottom-6 right-6 z-40 select-none">
      {/* 展开的电台面板 */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="mb-3 w-72 rounded-3xl border border-stone-200/90 bg-[#FDFBF7]/96 p-4 shadow-2xl backdrop-blur-xl text-stone-900"
            exit={{ opacity: 0, scale: 0.9, y: 15 }}
            initial={{ opacity: 0, scale: 0.9, y: 15 }}
            transition={{ damping: 20, duration: 0.25, stiffness: 300 }}
          >
            {/* 顶栏 */}
            <div className="flex items-center justify-between border-b border-stone-200/80 pb-2.5 mb-3">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-700 text-white text-xs">
                  🎧
                </span>
                <div>
                  <span className="block font-serif text-xs font-bold">旅人伴听 · 自然白噪音</span>
                  <span className="block text-[9px] text-stone-400 font-mono">AMBIENCE RADIO</span>
                </div>
              </div>
              <button
                aria-label="关闭伴听面板"
                className="rounded-lg p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-700 cursor-pointer"
                onClick={() => setIsOpen(false)}
                type="button"
              >
                <X size={14} />
              </button>
            </div>

            {/* 预设音效选择 */}
            <div className="space-y-1.5 mb-3.5">
              {PRESETS.map(preset => (
                <button
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-bold transition-all cursor-pointer ${
                    currentPreset.id === preset.id
                      ? 'bg-emerald-700 text-white shadow-sm'
                      : 'bg-stone-100/80 text-stone-700 hover:bg-stone-200/70'
                  }`}
                  key={preset.id}
                  onClick={() => selectPreset(preset)}
                  type="button"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{preset.emoji}</span>
                    <span>{preset.name}</span>
                  </div>
                  {currentPreset.id === preset.id && isPlaying && (
                    <span className="flex items-center gap-0.5">
                      <span className="h-2.5 w-0.5 animate-pulse bg-amber-300" />
                      <span className="h-3.5 w-0.5 animate-pulse delay-75 bg-amber-300" />
                      <span className="h-2 w-0.5 animate-pulse delay-150 bg-amber-300" />
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* 音量与主控制按钮 */}
            <div className="flex items-center gap-3 border-t border-stone-200/80 pt-3">
              <button
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-bold text-xs shadow-sm transition-all cursor-pointer ${
                  isPlaying
                    ? 'bg-amber-500 text-stone-950 hover:bg-amber-600'
                    : 'bg-emerald-700 text-white hover:bg-emerald-800'
                }`}
                onClick={togglePlay}
                type="button"
              >
                {isPlaying ? <VolumeX size={15} /> : <Volume2 size={15} />}
              </button>

              <div className="flex-1">
                <input
                  aria-label="白噪音音量调节"
                  className="h-1.5 w-full bg-stone-200 rounded-lg appearance-none cursor-pointer accent-emerald-700"
                  max="1"
                  min="0"
                  onChange={e => handleVolumeChange(Number.parseFloat(e.target.value))}
                  step="0.05"
                  type="range"
                  value={volume}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 悬浮主触发按钮 */}
      <motion.button
        className={`group relative flex h-12 w-12 items-center justify-center rounded-full border shadow-xl backdrop-blur-md transition-all cursor-pointer ${
          isPlaying
            ? 'border-emerald-500 bg-emerald-700 text-white shadow-emerald-800/30 ring-4 ring-emerald-500/20'
            : 'border-stone-200/90 bg-[#FDFBF7] text-stone-800 hover:bg-emerald-50 hover:border-emerald-600/50 shadow-black/10'
        }`}
        onClick={() => setIsOpen(prev => !prev)}
        title="旅人伴听 · 自然白噪音"
        type="button"
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
      >
        <Headphones className={`h-5 w-5 transition-transform ${isPlaying ? 'animate-bounce text-amber-300' : 'group-hover:text-emerald-700'}`} />
        {isPlaying && (
          <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex h-3.5 w-3.5 rounded-full bg-amber-500" />
          </span>
        )}
      </motion.button>
    </div>
  )
}
