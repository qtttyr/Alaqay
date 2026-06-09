import { useCallback, useEffect, useRef, useState } from "react"

interface TimeDrumPickerProps {
  value: string
  onChange: (value: string) => void
  onClose: () => void
}

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"))
const MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]
const MINUTE_STRINGS = MINUTES.map((m) => String(m).padStart(2, "0"))
const ITEM_HEIGHT = 40

function nearestMinuteIndex(minute: number) {
  let closest = 0
  let closestDiff = Infinity
  for (let i = 0; i < MINUTES.length; i++) {
    const diff = Math.abs(MINUTES[i] - minute)
    if (diff < closestDiff) {
      closestDiff = diff
      closest = i
    }
  }
  return closest
}

export function TimeDrumPicker({ value, onChange, onClose }: TimeDrumPickerProps) {
  const [hour, setHour] = useState(value.split(":")[0] || "07")
  const [minute, setMinute] = useState(
    value.split(":")[1] ? MINUTE_STRINGS[nearestMinuteIndex(parseInt(value.split(":")[1]))] : "00",
  )

  const hourIdx = HOURS.indexOf(hour)
  const minIdx = MINUTE_STRINGS.indexOf(minute)

  const hoursRef = useRef<HTMLDivElement>(null)
  const minutesRef = useRef<HTMLDivElement>(null)
  const tickingRef = useRef(false)

  // Scroll into position on first render
  useEffect(() => {
    if (hoursRef.current && hourIdx >= 0) {
      hoursRef.current.scrollTop = hourIdx * ITEM_HEIGHT
    }
    if (minutesRef.current && minIdx >= 0) {
      minutesRef.current.scrollTop = minIdx * ITEM_HEIGHT
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const snapScroll = useCallback((el: HTMLDivElement, items: readonly string[]) => {
    const idx = Math.round(el.scrollTop / ITEM_HEIGHT)
    const clamped = Math.max(0, Math.min(items.length - 1, idx))
    el.scrollTo({ top: clamped * ITEM_HEIGHT, behavior: "smooth" })
    return items[clamped]
  }, [])

  const handleScrollEnd = useCallback(
    (type: "hour" | "minute") => {
      tickingRef.current = false
      if (type === "hour") {
        if (hoursRef.current) setHour(snapScroll(hoursRef.current, HOURS))
      } else {
        if (minutesRef.current) setMinute(snapScroll(minutesRef.current, MINUTE_STRINGS))
      }
    },
    [snapScroll],
  )

  const onScroll = useCallback(
    (type: "hour" | "minute") => {
      if (!tickingRef.current) {
        tickingRef.current = true
        requestAnimationFrame(() => handleScrollEnd(type))
      }
    },
    [handleScrollEnd],
  )

  const handleDone = () => {
    onChange(`${hour}:${minute}`)
    onClose()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") onClose()
  }

  return (
    <div className="drum-overlay" onClick={onClose} onKeyDown={handleKeyDown}>
      <div className="drum-sheet" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Select time">
        {/* Header */}
        <div className="drum-header">
          <button type="button" className="drum-action" onClick={onClose}>
            Cancel
          </button>
          <span className="drum-title">Set time</span>
          <button type="button" className="drum-action primary" onClick={handleDone}>
            Done
          </button>
        </div>

        {/* Drums */}
        <div className="drum-body">
          <div className="drum-col">
            <div className="drum-highlight" aria-hidden />
            <div
              className="drum-scroll"
              ref={hoursRef}
              onScroll={() => onScroll("hour")}
              tabIndex={0}
              role="listbox"
              aria-label="Hours"
            >
              <div className="drum-padding" />
              {HOURS.map((h) => (
                <div
                  key={h}
                  className={`drum-item${h === hour ? " selected" : ""}`}
                  role="option"
                  aria-selected={h === hour}
                >
                  {h}
                </div>
              ))}
              <div className="drum-padding" />
            </div>
          </div>

          <span className="drum-colon" aria-hidden>:</span>

          <div className="drum-col">
            <div className="drum-highlight" aria-hidden />
            <div
              className="drum-scroll"
              ref={minutesRef}
              onScroll={() => onScroll("minute")}
              tabIndex={0}
              role="listbox"
              aria-label="Minutes"
            >
              <div className="drum-padding" />
              {MINUTE_STRINGS.map((m) => (
                <div
                  key={m}
                  className={`drum-item${m === minute ? " selected" : ""}`}
                  role="option"
                  aria-selected={m === minute}
                >
                  {m}
                </div>
              ))}
              <div className="drum-padding" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
