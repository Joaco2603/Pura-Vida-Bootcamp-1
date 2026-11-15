import { useState } from 'react'
import { WalletButton } from './components/WalletButton'
import { RegisterGame } from './components/RegisterGame'
import { VerifyGame } from './components/VerifyGame'
import { History } from './components/History'
import { PlayOnline } from './components/PlayOnline'

type Tab = 'play' | 'register' | 'verify' | 'history'

export default function App() {
  const [address, setAddress] = useState<string>()
  const [tab, setTab] = useState<Tab>('play')
  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: 16, display: 'grid', gap: 12 }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>♟ Chess Ledger</h1>
        <WalletButton address={address} onConnect={setAddress} />
      </header>
      <nav style={{ display: 'flex', gap: 8 }}>
        <button onClick={() => setTab('play')}>Jugar</button>
        <button onClick={() => setTab('register')}>Registrar</button>
        <button onClick={() => setTab('verify')}>Verificar</button>
        <button onClick={() => setTab('history')}>Historial</button>
      </nav>
      {tab === 'play' && <PlayOnline address={address} />}
      {tab === 'register' && <RegisterGame address={address} />}
      {tab === 'verify' && <VerifyGame address={address} />}
      {tab === 'history' && <History address={address} />}
    </main>
  )
}
