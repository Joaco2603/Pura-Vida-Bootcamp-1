import type { Chess } from 'chess.js'

// Índices de RESULTS en config.ts: 0 = 1-0, 1 = 0-1, 2 = ½-½
export type Outcome = { result: 0 | 1 | 2; reason: string }

export function boardOutcome(chess: Chess): Outcome | null {
  if (chess.isCheckmate()) return { result: chess.turn() === 'w' ? 1 : 0, reason: 'Jaque mate' }
  if (chess.isStalemate()) return { result: 2, reason: 'Ahogado' }
  if (chess.isInsufficientMaterial()) return { result: 2, reason: 'Material insuficiente' }
  if (chess.isThreefoldRepetition()) return { result: 2, reason: 'Triple repetición' }
  if (chess.isDraw()) return { result: 2, reason: 'Regla de 50 jugadas' }
  return null
}

export function resignOutcome(loser: 'w' | 'b'): Outcome {
  return { result: loser === 'w' ? 1 : 0, reason: `Abandono de ${loser === 'w' ? 'blancas' : 'negras'}` }
}

export const AGREED_DRAW: Outcome = { result: 2, reason: 'Tablas de mutuo acuerdo' }

export const PGN_RESULT = ['1-0', '0-1', '1/2-1/2'] as const
