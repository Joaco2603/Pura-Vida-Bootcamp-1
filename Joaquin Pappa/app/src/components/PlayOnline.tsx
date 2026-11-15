import { useEffect, useMemo, useRef, useState } from 'react'
import Peer, { type DataConnection } from 'peerjs'
import { Chess } from 'chess.js'
import { Chessboard, defaultSquareStyle } from 'react-chessboard'
import { parseMsg, type Msg } from '../lib/multiplayer'
import { AGREED_DRAW, boardOutcome, PGN_RESULT, resignOutcome, type Outcome } from '../lib/game'
import { hashPgn, toHex } from '../lib/pgn'
import { registerGame, friendlyError } from '../lib/contract'
import { RESULTS } from '../lib/config'

// react-chessboard v5 solo define columnas: forzar 8 filas iguales y celdas sin desborde
const BOARD_SIZE = { boardStyle: { gridTemplateRows: 'repeat(8, 1fr)', width: '100%', aspectRatio: '1 / 1' }, squareStyle: { ...defaultSquareStyle, minHeight: 0, minWidth: 0, overflow: 'hidden' } }

type Phase = 'lobby' | 'waiting' | 'connecting' | 'playing'
type Color = 'w' | 'b'

export function PlayOnline({ address }: { address?: string }) {
  const [name, setName] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [roomCode, setRoomCode] = useState('')
  const [phase, setPhase] = useState<Phase>('lobby')
  const [color, setColor] = useState<Color>('w')
  const [opponent, setOpponent] = useState('')
  const [fen, setFen] = useState(new Chess().fen())
  const [moves, setMoves] = useState<string[]>([])
  const [outcome, setOutcome] = useState<Outcome | null>(null)
  const [drawOffered, setDrawOfferedState] = useState<'me' | 'them' | null>(null)
  const [promotion, setPromotion] = useState('q')
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)
  const [registered, setRegistered] = useState('')

  const peerRef = useRef<Peer | null>(null)
  const connRef = useRef<DataConnection | null>(null)
  const chessRef = useRef(new Chess())
  const colorRef = useRef<Color>('w')
  const outcomeRef = useRef<Outcome | null>(null)
  // onData se registra una vez por conexión: la oferta de tablas se lee vía ref
  const drawOfferedRef = useRef<'me' | 'them' | null>(null)
  function setDrawOffered(v: 'me' | 'them' | null) {
    drawOfferedRef.current = v
    setDrawOfferedState(v)
  }

  useEffect(() => () => peerRef.current?.destroy(), [])

  function sync() {
    const c = chessRef.current
    setFen(c.fen())
    setMoves(c.history())
    const o = boardOutcome(c)
    if (o) finish(o)
  }

  function finish(o: Outcome) {
    if (outcomeRef.current) return
    outcomeRef.current = o
    setOutcome(o)
    setDrawOffered(null)
  }

  function send(m: Msg) {
    connRef.current?.send(m)
  }

  function onData(raw: unknown) {
    const m = parseMsg(raw)
    if (!m) return
    const c = chessRef.current
    switch (m.t) {
      case 'hello':
        setOpponent(m.name || 'Rival')
        break
      case 'move': {
        if (outcomeRef.current || c.turn() === colorRef.current) return
        if (m.ply !== c.history().length) return setMsg('⚠️ Desincronización con el rival.')
        try {
          c.move({ from: m.from, to: m.to, promotion: m.promotion })
        } catch {
          return setMsg('⚠️ El rival envió una jugada ilegal; ignorada.')
        }
        setDrawOffered(null)
        sync()
        break
      }
      case 'resign':
        finish(resignOutcome(colorRef.current === 'w' ? 'b' : 'w'))
        break
      case 'draw-offer':
        if (!outcomeRef.current) setDrawOffered('them')
        break
      case 'draw-accept':
        if (drawOfferedRef.current === 'me') finish(AGREED_DRAW)
        break
    }
  }

  function attach(conn: DataConnection) {
    conn.on('open', () => {
      connRef.current = conn
      conn.send({ t: 'hello', name: name.trim() || 'Anónimo' } satisfies Msg)
      setPhase('playing')
      setMsg('')
    })
    conn.on('data', onData)
    conn.on('close', () => { if (!outcomeRef.current) setMsg('⚠️ El rival se desconectó.') })
    conn.on('error', (e) => setMsg('❌ ' + e.message))
  }

  function newPeer() {
    peerRef.current?.destroy()
    connRef.current = null
    chessRef.current = new Chess()
    outcomeRef.current = null
    setOutcome(null); setRegistered(''); setDrawOffered(null); setOpponent('')
    setFen(chessRef.current.fen()); setMoves([])
    const p = new Peer()
    p.on('error', (e) => { setMsg('❌ ' + e.message); setPhase('lobby') })
    peerRef.current = p
    return p
  }

  function host() {
    const p = newPeer()
    colorRef.current = 'w'; setColor('w')
    setPhase('waiting')
    p.on('open', (id) => setRoomCode(id))
    p.on('connection', (conn) => {
      if (connRef.current) return conn.close() // sala de 2 jugadores
      attach(conn)
    })
  }

  function join() {
    const code = joinCode.trim()
    if (!code) return setMsg('Pegá el código de sala.')
    const p = newPeer()
    colorRef.current = 'b'; setColor('b')
    setPhase('connecting')
    p.on('open', () => attach(p.connect(code, { reliable: true })))
  }

  function onPieceDrop({ sourceSquare, targetSquare }: { sourceSquare: string; targetSquare: string | null }) {
    const c = chessRef.current
    if (!targetSquare || outcomeRef.current || c.turn() !== colorRef.current) return false
    const ply = c.history().length
    let mv
    try {
      mv = c.move({ from: sourceSquare, to: targetSquare, promotion })
    } catch {
      return false
    }
    send({ t: 'move', ply, from: mv.from, to: mv.to, promotion: mv.promotion })
    setDrawOffered(null)
    sync()
    return true
  }

  function resign() {
    if (outcomeRef.current || !confirm('¿Abandonar la partida?')) return
    send({ t: 'resign' })
    finish(resignOutcome(colorRef.current))
  }

  function offerDraw() {
    send({ t: 'draw-offer' }); setDrawOffered('me')
  }

  function acceptDraw() {
    send({ t: 'draw-accept' }); finish(AGREED_DRAW)
  }

  const view = useMemo(() => new Chess(fen), [fen])
  const myName = name.trim() || 'Anónimo'
  const white = color === 'w' ? myName : opponent || 'Rival'
  const black = color === 'b' ? myName : opponent || 'Rival'

  function fullPgn() {
    const c = new Chess()
    for (const m of moves) c.move(m)
    c.setHeader('White', white)
    c.setHeader('Black', black)
    if (outcome) c.setHeader('Result', PGN_RESULT[outcome.result])
    return c.pgn()
  }

  async function register() {
    if (!address) return setMsg('Conectá tu wallet primero.')
    if (!outcome) return
    setBusy(true); setMsg('')
    try {
      const h = await hashPgn(fullPgn())
      await registerGame(address, h, white, black, outcome.result)
      setRegistered(toHex(h))
    } catch (e) { setMsg('❌ ' + friendlyError(e)) } finally { setBusy(false) }
  }

  if (phase !== 'playing') {
    return (
      <section style={{ display: 'grid', gap: 8 }}>
        <h2>Jugar online</h2>
        <input placeholder="Tu nombre" value={name} onChange={(e) => setName(e.target.value)} disabled={phase !== 'lobby'} />
        {phase === 'lobby' && (
          <>
            <button onClick={host}>Crear sala (blancas)</button>
            <div style={{ display: 'flex', gap: 8 }}>
              <input style={{ flex: 1 }} placeholder="Código de sala" value={joinCode} onChange={(e) => setJoinCode(e.target.value)} />
              <button style={{ width: 'auto' }} onClick={join}>Unirse (negras)</button>
            </div>
          </>
        )}
        {phase === 'waiting' && (
          <p>
            {roomCode ? <>Compartí este código con tu rival: <code style={{ userSelect: 'all' }}>{roomCode}</code></> : 'Creando sala…'}
          </p>
        )}
        {phase === 'connecting' && <p>Conectando…</p>}
        <p>{msg}</p>
        <div style={{ width: '100%', maxWidth: 480, margin: '0 auto', opacity: 0.6 }}>
          <Chessboard options={{ ...BOARD_SIZE, position: fen, boardOrientation: phase === 'connecting' ? 'black' : 'white', allowDragging: false }} />
        </div>
      </section>
    )
  }

  const myTurn = !outcome && view.turn() === color
  return (
    <section style={{ display: 'grid', gap: 8 }}>
      <h2>{white} (♔) vs {black} (♚)</h2>
      <div style={{ width: '100%', maxWidth: 480, margin: '0 auto' }}>
        <Chessboard
          options={{
            ...BOARD_SIZE,
            position: fen,
            boardOrientation: color === 'w' ? 'white' : 'black',
            allowDragging: myTurn,
            canDragPiece: ({ piece }) => piece.pieceType[0] === color,
            onPieceDrop,
          }}
        />
      </div>
      {!outcome && (
        <>
          <p>{myTurn ? 'Tu turno' : 'Turno del rival'}{view.isCheck() ? ' — ¡Jaque!' : ''}</p>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <label>Coronar a{' '}
              <select value={promotion} onChange={(e) => setPromotion(e.target.value)}>
                <option value="q">Dama</option><option value="r">Torre</option><option value="b">Alfil</option><option value="n">Caballo</option>
              </select>
            </label>
            <button onClick={resign}>Abandonar</button>
            {drawOffered === 'them'
              ? <button onClick={acceptDraw}>Aceptar tablas</button>
              : <button onClick={offerDraw} disabled={drawOffered === 'me'}>{drawOffered === 'me' ? 'Tablas ofrecidas…' : 'Ofrecer tablas'}</button>}
          </div>
        </>
      )}
      <p style={{ fontFamily: 'monospace' }}>{moves.map((m, i) => (i % 2 === 0 ? `${i / 2 + 1}. ${m}` : m)).join(' ') || '—'}</p>
      {outcome && (
        <div style={{ display: 'grid', gap: 8 }}>
          <strong>Fin: {RESULTS[outcome.result]} ({outcome.reason})</strong>
          <textarea readOnly rows={5} value={fullPgn()} />
          {registered
            ? <p>✅ Registrada. Hash: {registered}</p>
            : <button disabled={busy || moves.length === 0} onClick={register}>{busy ? 'Firmando…' : 'Registrar on-chain'}</button>}
          {moves.length === 0 && <p>Sin jugadas: no se puede registrar.</p>}
          <button onClick={() => { peerRef.current?.destroy(); setPhase('lobby'); setMsg('') }}>Nueva partida</button>
        </div>
      )}
      <p>{msg}</p>
    </section>
  )
}
