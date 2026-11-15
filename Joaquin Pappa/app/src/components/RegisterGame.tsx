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
    setBusy(true); setMsg('')
    try {
      const h = await hashPgn(pgn)
      await registerGame(address, h, white, black, result)
      setMsg(`✅ Registrada. Hash: ${toHex(h)}`)
    } catch (e) { setMsg('❌ ' + friendlyError(e)) } finally { setBusy(false) }
  }

  return (
    <section>
      <h2>Registrar partida</h2>
      <input placeholder="Blancas" value={white} onChange={(e) => setWhite(e.target.value)} />
      <input placeholder="Negras" value={black} onChange={(e) => setBlack(e.target.value)} />
      <select value={result} onChange={(e) => setResult(Number(e.target.value))}>
        {RESULTS.map((r, i) => <option key={r} value={i}>{r}</option>)}
      </select>
      <textarea rows={8} placeholder="Pegá el PGN" value={pgn} onChange={(e) => setPgn(e.target.value)} />
      <button disabled={busy || !pgn || !white || !black} onClick={submit}>{busy ? 'Firmando…' : 'Registrar'}</button>
      <p>{msg}</p>
    </section>
  )
}
