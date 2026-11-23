interface AdSlotProps {
  side: 'left' | 'right'
}

export function AdSlot({ side }: AdSlotProps) {
  return (
    <aside className="no-print flex w-36 shrink-0 flex-col gap-3 border-slate-200 bg-slate-50 p-3" style={{ borderLeftWidth: side === 'right' ? 1 : 0, borderRightWidth: side === 'left' ? 1 : 0 }}>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Advertisement</p>
      <div className="flex flex-1 items-center justify-center rounded-md border border-dashed border-slate-300 bg-white p-3 text-center text-[11px] leading-snug text-slate-400">
        Reserved {side} rail. Offline placeholder — no network request.
      </div>
    </aside>
  )
}
