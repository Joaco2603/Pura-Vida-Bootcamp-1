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
  return (
    <section className="narrow">
      <h2 className="title"><small>Revisá tus</small>Partidas</h2>
      {!address && <p className="lead">Conectá tu wallet para ver tu historial.</p>}
      {msg && <p className="msg">{msg}</p>}
      {loading && <p className="lead">Cargando…</p>}
      {address && !loading && !msg && hashes.length === 0 && <p className="lead">Sin partidas.</p>}
      {hashes.length > 0 && (
        <ul className="history">
          {hashes.map((h, i) => (
            <li key={h}><span className="history-n">{String(i + 1).padStart(2, '0')}</span><code>{h}</code></li>
          ))}
        </ul>
      )}
    </section>
  )
}
