import { Chess } from 'chess.js'

export function canonicalMoves(pgn: string): string {
  const chess = new Chess()
  chess.loadPgn(pgn) // lanza error si el PGN es inválido
  const moves = chess.history()
  if (moves.length === 0) throw new Error('El PGN no tiene jugadas')
  return moves.join(' ')
}

export async function hashPgn(pgn: string): Promise<Uint8Array> {
  const data = new TextEncoder().encode(canonicalMoves(pgn))
  return new Uint8Array(await crypto.subtle.digest('SHA-256', data))
}

export function toHex(b: Uint8Array): string {
  return Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('')
}
