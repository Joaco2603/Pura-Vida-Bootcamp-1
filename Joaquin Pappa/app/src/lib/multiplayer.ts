// Protocolo P2P (PeerJS/WebRTC). El host juega con blancas.
export type Msg =
  | { t: 'hello'; name: string }
  | { t: 'move'; ply: number; from: string; to: string; promotion?: string }
  | { t: 'resign' }
  | { t: 'draw-offer' }
  | { t: 'draw-accept' }

const SQ = /^[a-h][1-8]$/

// Los datos vienen del otro navegador: validar forma antes de usarlos.
export function parseMsg(x: unknown): Msg | null {
  if (typeof x !== 'object' || x === null) return null
  const m = x as Record<string, unknown>
  switch (m.t) {
    case 'hello':
      return typeof m.name === 'string' ? { t: 'hello', name: m.name.slice(0, 64) } : null
    case 'move':
      if (!Number.isInteger(m.ply) || typeof m.from !== 'string' || typeof m.to !== 'string') return null
      if (!SQ.test(m.from) || !SQ.test(m.to)) return null
      if (m.promotion !== undefined && !(typeof m.promotion === 'string' && /^[qrbn]$/.test(m.promotion))) return null
      return { t: 'move', ply: m.ply as number, from: m.from, to: m.to, promotion: m.promotion as string | undefined }
    case 'resign':
    case 'draw-offer':
    case 'draw-accept':
      return { t: m.t }
    default:
      return null
  }
}
