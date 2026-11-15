import { useState } from 'react'
import { hashPgn, toHex } from '../lib/pgn'
import { registerGame, friendlyError } from '../lib/contract'
import { RESULTS } from '../lib/config'

export function RegisterGame({ address }: { address?: string }) {
  const [pgn, setPgn] = useState('')
  const [white, setWhite] = useState('')
  const [black, setBlack] = useState('')
  const [result, setResult] = useState(0)
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit() {
    if (!address) return setMsg('Conectá tu wallet primero.')
    const w = white.trim(), b = black.trim()
    if (!w || !b) return setMsg('Completá blancas y negras.')
    setBusy(true); setMsg('')
    try {
      const h = await hashPgn(pgn)
      await registerGame(address, h, w, b, result)
      setMsg(`✅ Registrada. Hash: ${toHex(h)}`)
      setPgn('')
    } catch (e) { setMsg('❌ ' + friendlyError(e)) } finally { setBusy(false) }
  }

  return (
    <section className="narrow">
      <h2 className="title"><small>Registrá la</small>Partida</h2>
      <p className="lead">Pegá el PGN de una partida jugada fuera de la app. Se guarda su hash on-chain junto con jugadores y resultado.</p>
      <div className="form">
        <div className="row">
          <label><span className="label">Blancas</span><input placeholder="Nombre" value={white} onChange={(e) => setWhite(e.target.value)} /></label>
          <label><span className="label">Negras</span><input placeholder="Nombre" value={black} onChange={(e) => setBlack(e.target.value)} /></label>
          <label><span className="label">Resultado</span>
            <select value={result} onChange={(e) => setResult(Number(e.target.value))}>
              {RESULTS.map((r, i) => <option key={r} value={i}>{r}</option>)}
            </select>
          </label>
        </div>
        <label><span className="label">PGN</span><textarea rows={8} placeholder="1. e4 e5 2. Nf3 …" value={pgn} onChange={(e) => setPgn(e.target.value)} /></label>
        <button className="btn-red" disabled={busy || !pgn || !white.trim() || !black.trim()} onClick={submit}>{busy ? 'Firmando…' : 'Registrar'}</button>
        {msg && <p className="msg">{msg}</p>}
      </div>
    </section>
  )
}
