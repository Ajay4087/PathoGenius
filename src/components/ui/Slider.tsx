interface SliderProps {
  min: number
  max: number
  step: number
  value: number
  onChange: (value: number) => void
  ariaLabel: string
  muted?: boolean
}

export function Slider({ min, max, step, value, onChange, ariaLabel, muted = false }: SliderProps) {
  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      aria-label={ariaLabel}
      tabIndex={-1}
      onChange={(event) => onChange(Number(event.target.value))}
      className={`h-2 w-full cursor-pointer ${muted ? 'opacity-50' : ''}`}
    />
  )
}
