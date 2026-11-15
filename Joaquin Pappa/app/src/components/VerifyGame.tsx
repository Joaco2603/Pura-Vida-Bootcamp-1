import { useState } from 'react'
import { hashPgn, toHex } from '../lib/pgn'
import { getGame, friendlyError } from '../lib/contract'
import { RESULTS } from '../lib/config'

export function VerifyGame({ address }: { address?: string }) {
  const [pgn, setPgn] = useState('')
  const [msg, setMsg] = useState('')

  async function verify() {
    setMsg('')
    try {
      const h = await hashPgn(pgn)
      const g = await getGame(h, address)
      if (!g) return setMsg(`❌ No registrada o alterada. Hash: ${toHex(h)}`)
      const date = new Date(Number(g.timestamp) * 1000).toLocaleString()
      setMsg(`✅ Auténtica: ${g.white} vs ${g.black}, ${RESULTS[g.result]} — registrada ${date} por ${g.registrar}`)
    } catch (e) { setMsg('❌ ' + friendlyError(e)) }
  }

  return (
    <section>
      <h2>Verificar partida</h2>
      <textarea rows={8} placeholder="Pegá el PGN" value={pgn} onChange={(e) => setPgn(e.target.value)} />
      <button disabled={!pgn} onClick={verify}>Verificar</button>
      <p>{msg}</p>
    </section>
  )
}
