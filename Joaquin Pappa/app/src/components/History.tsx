import { useEffect, useState } from 'react'
import { gamesBy, friendlyError } from '../lib/contract'
import { toHex } from '../lib/pgn'

export function History({ address }: { address?: string }) {
  const [hashes, setHashes] = useState<string[]>([])
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)
  useEffect(() => {
    if (!address) return
    let off = false
    setMsg(''); setLoading(true)
    gamesBy(address)
      .then((list) => { if (!off) setHashes(list.map((b) => toHex(new Uint8Array(b)))) })
      .catch((e) => { if (!off) setMsg(friendlyError(e)) })
      .finally(() => { if (!off) setLoading(false) })
    return () => { off = true }
  }, [address])
  if (!address) return <p>Conectá tu wallet para ver tu historial.</p>
  return (
    <section>
      <h2>Mis partidas</h2>
      {msg && <p>{msg}</p>}
      {loading && <p>Cargando…</p>}
      {!loading && !msg && hashes.length === 0 && <p>Sin partidas.</p>}
      {hashes.length > 0 && <ul>{hashes.map((h) => <li key={h}><code>{h}</code></li>)}</ul>}
    </section>
  )
}
