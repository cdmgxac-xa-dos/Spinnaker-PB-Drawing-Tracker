import { useEffect, useRef, useState } from 'react'
import { Eraser } from 'lucide-react'

/**
 * The drawn strokes rarely fill the whole pad, so exporting the raw canvas
 * bakes in a lot of empty margin — which then makes "center the signature"
 * downstream impossible, since there's nothing to distinguish ink from
 * blank space once it's a flat image. Trim to the actual ink's bounding box
 * (plus a small margin) so the exported image is just the signature.
 */
function cropToInk(canvas: HTMLCanvasElement): string {
  const ctx = canvas.getContext('2d')
  if (!ctx) return canvas.toDataURL('image/png')

  const { width, height } = canvas
  const { data } = ctx.getImageData(0, 0, width, height)
  let minX = width,
    minY = height,
    maxX = -1,
    maxY = -1
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const alpha = data[(y * width + x) * 4 + 3]
      if (alpha > 10) {
        if (x < minX) minX = x
        if (x > maxX) maxX = x
        if (y < minY) minY = y
        if (y > maxY) maxY = y
      }
    }
  }
  if (maxX < minX || maxY < minY) return canvas.toDataURL('image/png')

  const margin = 10
  minX = Math.max(0, minX - margin)
  minY = Math.max(0, minY - margin)
  maxX = Math.min(width - 1, maxX + margin)
  maxY = Math.min(height - 1, maxY + margin)

  const cropped = document.createElement('canvas')
  cropped.width = maxX - minX + 1
  cropped.height = maxY - minY + 1
  const croppedCtx = cropped.getContext('2d')!
  croppedCtx.drawImage(canvas, minX, minY, cropped.width, cropped.height, 0, 0, cropped.width, cropped.height)
  return cropped.toDataURL('image/png')
}

export function SignaturePad({
  title = 'Attach your signature',
  description = 'Draw your signature below with your mouse or finger, then use it in the report.',
  onCancel,
  onSave,
}: {
  title?: string
  description?: string
  onCancel: () => void
  onSave: (dataUrl: string) => void
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)
  const hasStrokes = useRef(false)
  const [empty, setEmpty] = useState(true)

  // Size the canvas's backing store to match its rendered CSS size (at device
  // pixel ratio) so strokes stay crisp instead of stretched from a fixed
  // low-res backing store — matters here since this lands on a printed PDF.
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    const c = canvas.getContext('2d')
    if (c) c.scale(dpr, dpr)
  }, [])

  function ctx() {
    const canvas = canvasRef.current
    if (!canvas) return null
    return canvas.getContext('2d')
  }

  function pointerPos(e: React.PointerEvent<HTMLCanvasElement>) {
    const rect = canvasRef.current!.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  function handlePointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    e.preventDefault()
    const c = ctx()
    if (!c) return
    drawing.current = true
    const { x, y } = pointerPos(e)
    c.beginPath()
    c.moveTo(x, y)
    ;(e.target as HTMLCanvasElement).setPointerCapture(e.pointerId)
  }

  function handlePointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return
    const c = ctx()
    if (!c) return
    const { x, y } = pointerPos(e)
    c.lineTo(x, y)
    c.strokeStyle = '#0F172A'
    c.lineWidth = 3
    c.lineCap = 'round'
    c.lineJoin = 'round'
    c.stroke()
    hasStrokes.current = true
    setEmpty(false)
  }

  function handlePointerUp() {
    drawing.current = false
  }

  function handleClear() {
    const canvas = canvasRef.current
    const c = ctx()
    if (!canvas || !c) return
    const dpr = window.devicePixelRatio || 1
    c.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr)
    hasStrokes.current = false
    setEmpty(true)
  }

  function handleSave() {
    const canvas = canvasRef.current
    if (!canvas || !hasStrokes.current) return
    onSave(cropToInk(canvas))
  }

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-pop">
        <h2 className="mb-1 text-base font-bold text-brand-ink">{title}</h2>
        <p className="mb-4 text-sm text-brand-slate">{description}</p>

        <div className="overflow-hidden rounded-xl border-2 border-dashed border-brand-line bg-slate-50">
          <canvas
            ref={canvasRef}
            className="h-[220px] w-full touch-none bg-white"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
          />
        </div>
        {empty && <p className="mt-1 text-xs text-brand-slate">Sign above</p>}

        <div className="mt-5 flex items-center justify-between gap-2">
          <button
            onClick={handleClear}
            className="flex items-center gap-1.5 rounded-lg border border-brand-line px-3 py-2 text-sm font-semibold text-brand-ink hover:bg-slate-50"
          >
            <Eraser size={14} /> Clear
          </button>
          <div className="flex items-center gap-2">
            <button onClick={onCancel} className="rounded-lg border border-brand-line px-4 py-2 text-sm font-semibold text-brand-ink">
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={empty}
              className="rounded-lg bg-brand-ink px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              Use this signature
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
