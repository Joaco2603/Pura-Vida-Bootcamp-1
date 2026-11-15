import { useState } from 'react'
import { connectWallet } from '../lib/wallet'

export function WalletButton({ address, onConnect }: { address?: string; onConnect: (a: string) => void }) {
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  if (address) return <span>Conectado: {address.slice(0, 4)}…{address.slice(-4)}</span>
  return (
    <span>
      <button disabled={busy} onClick={async () => { setErr(''); setBusy(true); try { onConnect(await connectWallet()) } catch (e) { setErr(String((e as Error).message)) } finally { setBusy(false) } }}>
        {busy ? 'Conectando…' : 'Conectar wallet'}
      </button>
      {err && <small style={{ color: 'crimson' }}> {err}</small>}
    </span>
  )
}
