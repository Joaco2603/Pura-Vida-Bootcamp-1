import { useEffect, useMemo, useRef, useState } from 'react'
import { Chess, type Square } from 'chess.js'
import { hashPgn, toHex } from '../lib/pgn'
import { registerGame, friendlyError } from '../lib/contract'
import { RESULTS } from '../lib/config'

const GLYPH: Record<string, string> = { k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' }
const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']

// índice de RESULTS: 0 = 1-0, 1 = 0-1, 2 = ½-½
type Outcome = { result: number; reason: string }

function naturalOutcome(chess: Chess): Outcome | undefined {
  if (chess.isCheckmate()) return { result: chess.turn() === 'w' ? 1 : 0, reason: 'Jaque mate' }
  if (chess.isStalemate()) return { result: 2, reason: 'Ahogado' }
  if (chess.isInsufficientMaterial()) return { result: 2, reason: 'Material insuficiente' }
  if (chess.isThreefoldRepetition()) return { result: 2, reason: 'Triple repetición' }
  if (chess.isDraw()) return { result: 2, reason: 'Regla de 50 movimientos' }
  return undefined
}

type RegState = { status: 'idle' | 'waiting' | 'busy' | 'done' | 'error'; msg: string }

export function PlayGame({ address }: { address?: string }) {
  const [chess] = useState(() => new Chess())
  const [, setVersion] = useState(0) // fuerza re-render tras mutar chess
  const [selected, setSelected] = useState<Square>()
  const [flipped, setFlipped] = useState(false)
  const [white, setWhite] = useState('')
  const [black, setBlack] = useState('')
  const [manual, setManual] = useState<Outcome>() // abandono / tablas acordadas
  const [reg, setReg] = useState<RegState>({ status: 'idle', msg: '' })
  const registering = useRef(false)

  const outcome = manual ?? naturalOutcome(chess)
  const over = outcome !== undefined
  const moves = chess.history()
  const names = { w: white.trim(), b: black.trim() }

  const targets = useMemo(
    () => (selected ? new Set(chess.moves({ square: selected, verbose: true }).map((m) => m.to)) : new Set<string>()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selected, moves.length],
  )

  function bump() { setVersion((v) => v + 1) }

  function clickSquare(sq: Square) {
    if (over) return
    const piece = chess.get(sq)
    if (selected && targets.has(sq)) {
      chess.move({ from: selected, to: sq, promotion: 'q' })
      setSelected(undefined)
      bump()
      return
    }
    setSelected(piece && piece.color === chess.turn() ? sq : undefined)
  }

  function undo() {
    if (over || moves.length === 0) return
    chess.undo(); setSelected(undefined); bump()
  }

  function resign() {
    if (over || moves.length === 0) return
    const loser = chess.turn()
    setManual({ result: loser === 'w' ? 1 : 0, reason: `Abandono de ${loser === 'w' ? 'blancas' : 'negras'}` })
  }

  function agreeDraw() {
    if (over || moves.length === 0) return
    setManual({ result: 2, reason: 'Tablas acordadas' })
  }

  function newGame() {
    chess.reset(); setManual(undefined); setSelected(undefined)
    setReg({ status: 'idle', msg: '' }); registering.current = false
    bump()
  }

  function pgnText() {
    chess.setHeader('White', names.w || '?')
    chess.setHeader('Black', names.b || '?')
    chess.setHeader('Result', outcome ? ['1-0', '0-1', '1/2-1/2'][outcome.result] : '*')
    return chess.pgn()
  }

  async function register() {
    if (!outcome || registering.current) return
    if (moves.length === 0) return setReg({ status: 'error', msg: 'La partida no tiene jugadas.' })
    if (!names.w || !names.b) return setReg({ status: 'waiting', msg: 'Completá los nombres de blancas y negras para registrar.' })
    if (!address) return setReg({ status: 'waiting', msg: 'Conectá tu wallet: la partida se registra automáticamente al conectar.' })
    registering.current = true
    setReg({ status: 'busy', msg: 'Firmá la transacción en Freighter…' })
    try {
      const h = await hashPgn(pgnText())
      await registerGame(address, h, names.w, names.b, outcome.result)
      setReg({ status: 'done', msg: `✅ Registrada on-chain. Hash: ${toHex(h)}` })
    } catch (e) {
      registering.current = false
      setReg({ status: 'error', msg: '❌ ' + friendlyError(e) })
    }
  }

  // Registro automático al terminar la partida (o al conectar wallet / completar nombres después).
  useEffect(() => {
    if (over && (reg.status === 'idle' || reg.status === 'waiting')) void register()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [over, address, names.w, names.b])

  const ranks = flipped ? [1, 2, 3, 4, 5, 6, 7, 8] : [8, 7, 6, 5, 4, 3, 2, 1]
  const files = flipped ? [...FILES].reverse() : FILES
  const last = chess.history({ verbose: true }).at(-1)
  const checkSq = chess.inCheck()
    ? chess.board().flat().find((p) => p && p.type === 'k' && p.color === chess.turn())?.square
    : undefined

  return (
    <section className="play">
      <h2 className="title"><small>Jugá la</small>Partida</h2>
      <div className="play-layout">
      <div className="board-wrap">
      <div className={`board${over ? ' board-over' : ''}`} role="grid" aria-label="Tablero">
        {ranks.map((r) =>
          files.map((f) => {
            const sq = `${f}${r}` as Square
            const p = chess.get(sq)
            const dark = (FILES.indexOf(f) + r) % 2 === 1
            const cls = [
              'sq',
              dark ? 'sq-dark' : 'sq-light',
              selected === sq && 'sq-sel',
              (last?.from === sq || last?.to === sq) && 'sq-last',
              checkSq === sq && 'sq-check',
              targets.has(sq) && (p ? 'sq-capture' : 'sq-target'),
            ].filter(Boolean).join(' ')
            return (
              <button key={sq} className={cls} onClick={() => clickSquare(sq)} aria-label={sq}>
                {p && <span className={p.color === 'w' ? 'pc-w' : 'pc-b'}>{GLYPH[p.type]}</span>}
              </button>
            )
          }),
        )}
      </div>
      </div>

      <aside className="panel">
      <div className="play-names">
        <label><span className="label">Blancas</span>
          <input placeholder="Nombre" value={white} disabled={reg.status === 'busy' || reg.status === 'done'} onChange={(e) => setWhite(e.target.value)} />
        </label>
        <label><span className="label">Negras</span>
          <input placeholder="Nombre" value={black} disabled={reg.status === 'busy' || reg.status === 'done'} onChange={(e) => setBlack(e.target.value)} />
        </label>
      </div>

      <p className={`play-status${over ? ' is-over' : ''}`}>
        {over
          ? `${outcome.reason} — ${RESULTS[outcome.result]}`
          : `Turno de ${chess.turn() === 'w' ? 'blancas' : 'negras'}${chess.inCheck() ? ' (jaque)' : ''}`}
      </p>

      <div className="play-actions">
        <button onClick={() => setFlipped((v) => !v)}>Girar</button>
        <button disabled={over || moves.length === 0} onClick={undo}>Deshacer</button>
        <button disabled={over || moves.length === 0} onClick={resign}>Abandonar</button>
        <button disabled={over || moves.length === 0} onClick={agreeDraw}>Tablas</button>
        <button className="btn-red" disabled={reg.status === 'busy'} onClick={newGame}>Nueva</button>
      </div>

      {moves.length > 0 && (
        <ol className="play-moves">
          {moves.filter((_, i) => i % 2 === 0).map((m, i) => (
            <li key={i}>{m} {moves[i * 2 + 1] ?? ''}</li>
          ))}
        </ol>
      )}

      {over && (
        <>
          {reg.msg && <p className="msg">{reg.msg}</p>}
          {reg.status === 'error' && <button className="btn-red" onClick={() => void register()}>Reintentar registro</button>}
          <details>
            <summary>PGN</summary>
            <textarea readOnly rows={6} value={pgnText()} />
          </details>
        </>
      )}
      </aside>
      </div>
    </section>
  )
}
