import { useState } from 'react'
import { connectWallet } from '../lib/wallet'

export function WalletButton({ address, onConnect }: { address?: string; onConnect: (a: string) => void }) {
  const [err, setErr] = useState('')
  if (address) return <span>Conectado: {address.slice(0, 4)}…{address.slice(-4)}</span>
  return (
    <span>
      <button onClick={async () => { try { onConnect(await connectWallet()) } catch (e) { setErr(String((e as Error).message)) } }}>
        Conectar wallet
      </button>
      {err && <small style={{ color: 'crimson' }}> {err}</small>}
    </span>
  )
}
