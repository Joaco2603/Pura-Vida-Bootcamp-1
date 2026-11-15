import { useEffect, useState } from 'react'
import { gamesBy, friendlyError } from '../lib/contract'
import { toHex } from '../lib/pgn'

export function History({ address }: { address?: string }) {
  const [hashes, setHashes] = useState<string[]>([])
  const [msg, setMsg] = useState('')
  useEffect(() => {
    if (!address) return
    gamesBy(address)
      .then((list) => setHashes(list.map((b) => toHex(new Uint8Array(b)))))
      .catch((e) => setMsg(friendlyError(e)))
  }, [address])
  if (!address) return <p>Conectá tu wallet para ver tu historial.</p>
  return (
    <section>
      <h2>Mis partidas</h2>
      {msg && <p>{msg}</p>}
      {hashes.length === 0 ? <p>Sin partidas.</p> : <ul>{hashes.map((h) => <li key={h}><code>{h}</code></li>)}</ul>}
    </section>
  )
}
