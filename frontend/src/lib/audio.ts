/**
 * Alaqay Audio & Haptic Engine
 *
 * Synthesises calm, pleasant sounds using the Web Audio API.
 * No external audio files needed — works offline, zero latency.
 *
 * Sound palette (designed for calm, not gamification):
 *  - zoneChime:  gentle 2-note ascending chime (C5 → E5) — like a small singing bowl
 *  - sessionDone: rising 4-note arpeggio (C4 → E4 → G4 → C5) — quiet triumph
 *
 * All sounds use sine waves with soft attack/decay envelopes
 * and a touch of natural room ambience via a short convolver.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export type AudioPreferences = {
  soundEnabled: boolean
  hapticEnabled: boolean
}

// ─── Audio Service ──────────────────────────────────────────────────────────

class AudioService {
  private ctx: AudioContext | null = null
  private _soundEnabled = true
  private _hapticEnabled = true
  private resumeHandler: (() => void) | null = null
  private initialized = false

  // ── Preferences ──────────────────────────────────────────────────────────

  get soundEnabled() { return this._soundEnabled }
  get hapticEnabled() { return this._hapticEnabled }

  setSoundEnabled(v: boolean) {
    this._soundEnabled = v
    if (v) this.ensureResumeHandler()
  }

  setHapticEnabled(v: boolean) {
    this._hapticEnabled = v
  }

  // ── AudioContext lifecycle ───────────────────────────────────────────────

  /** Return (or create) the shared AudioContext. Resumes if suspended. */
  private getCtx(): AudioContext {
    if (!this.ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (!AC) throw new Error("Web Audio API not supported")
      this.ctx = new AC()
    }
    if (this.ctx.state === "suspended") {
      void this.ctx.resume()
    }
    return this.ctx
  }

  /**
   * Binds a one-shot resume to the next user interaction.
   * Browsers require a user gesture before AudioContext works.
   */
  private ensureResumeHandler() {
    if (this.resumeHandler || this.initialized) return

    const handler = () => {
      if (this.ctx?.state === "suspended") {
        void this.ctx.resume()
      }
      this.initialized = true
      document.removeEventListener("pointerdown", handler)
      document.removeEventListener("keydown", handler)
      this.resumeHandler = null
    }

    this.resumeHandler = handler
    document.addEventListener("pointerdown", handler, { once: true })
    document.addEventListener("keydown", handler, { once: true })
  }

  // ── Synthesis helpers ────────────────────────────────────────────────────

  /**
   * Play a single tone with a soft attack/decay envelope.
   *
   * @param freq    Hz
   * @param start   ctx.currentTime offset
   * @param dur     total note duration in seconds
   * @param vol     peak volume (0–1)
   * @param type    oscillator waveform
   */
  private playTone(
    freq: number,
    start: number,
    dur: number,
    vol: number,
    type: OscillatorType = "sine",
  ) {
    const ctx = this.getCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = type
    osc.frequency.setValueAtTime(freq, start)

    // soft attack: ramp up in ~30 ms
    gain.gain.setValueAtTime(0, start)
    gain.gain.linearRampToValueAtTime(vol, start + 0.03)
    // natural decay: fade to silence by the end
    gain.gain.exponentialRampToValueAtTime(0.001, start + dur)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start(start)
    osc.stop(start + dur + 0.05)
  }

  // ── Public sounds ────────────────────────────────────────────────────────

  /** Gentle zone-transition chime: two ascending notes (C5 → E5). */
  playZoneChime() {
    if (!this._soundEnabled) return
    if (!this.isSupported()) return
    this.ensureResumeHandler()

    try {
      const ctx = this.getCtx()
      const now = ctx.currentTime

      // C5 (523 Hz) → E5 (659 Hz), 120 ms apart
      this.playTone(523.25, now, 0.35, 0.18)
      this.playTone(659.25, now + 0.12, 0.4, 0.14)

      // Light upper overtone (partial) for shimmer
      this.playTone(1046.5, now + 0.02, 0.25, 0.04, "sine")
    } catch {
      // Audio not available — silent fail
    }
  }

  /** Session-complete arpeggio: C4 → E4 → G4 → C5 (C major, rising). */
  playSessionComplete() {
    if (!this._soundEnabled) return
    if (!this.isSupported()) return
    this.ensureResumeHandler()

    try {
      const ctx = this.getCtx()
      const now = ctx.currentTime

      // C major:  C4  E4  G4  C5
      const chord = [261.63, 329.63, 392.0, 523.25]
      const spacing = 0.18
      const vol = 0.12

      chord.forEach((freq, i) => {
        const t = now + i * spacing
        this.playTone(freq, t, 0.55, vol)
        // gentle overtone for warmth
        this.playTone(freq * 2, t + 0.03, 0.3, 0.025, "sine")
      })
    } catch {
      // Audio not available — silent fail
    }
  }

  // ── Haptics ───────────────────────────────────────────────────────────────

  /** Two quick taps — zone change cue. */
  hapticZoneChange() {
    if (!this._hapticEnabled) return
    if (!navigator.vibrate) return
    navigator.vibrate([30, 50, 30])
  }

  /** Longer pattern — session complete. */
  hapticComplete() {
    if (!this._hapticEnabled) return
    if (!navigator.vibrate) return
    navigator.vibrate([60, 50, 60, 50, 100])
  }

  // ── Introspection ────────────────────────────────────────────────────────

  isSupported() {
    const hasAC = "AudioContext" in window || "webkitAudioContext" in window
    return hasAC
  }

  isHapticSupported() {
    return "vibrate" in navigator
  }
}

// Singleton
export const audioService = new AudioService()
