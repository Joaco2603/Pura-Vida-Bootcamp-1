import { useState } from 'react'
import { WalletButton } from './components/WalletButton'
import { RegisterGame } from './components/RegisterGame'
import { VerifyGame } from './components/VerifyGame'
import { History } from './components/History'
import { PlayGame } from './components/PlayGame'

type Tab = 'play' | 'register' | 'verify' | 'history'

const TABS: { id: Tab; label: string }[] = [
  { id: 'play', label: 'Jugar' },
  { id: 'register', label: 'Registrar' },
  { id: 'verify', label: 'Verificar' },
  { id: 'history', label: 'Historial' },
]

export default function App() {
  const [address, setAddress] = useState<string>()
  const [tab, setTab] = useState<Tab>('play')
  return (
    <>
      <header className="hero">
        <div className="topbar">
          <span className="topbar-line" />
          <nav className="tabs">
            {TABS.map((t) => (
              <button key={t.id} className={tab === t.id ? 'tab active' : 'tab'} onClick={() => setTab(t.id)}>
                {t.label}
              </button>
            ))}
          </nav>
          <span className="topbar-line" />
        </div>
        <div className="hero-frame">
          <h1>Chess Ledger</h1>
          <p className="hero-sub">On-chain registry</p>
          <WalletButton address={address} onConnect={setAddress} />
        </div>
      </header>
      <main className="content">
        {tab === 'play' && <PlayGame address={address} />}
        {tab === 'register' && <RegisterGame address={address} />}
        {tab === 'verify' && <VerifyGame address={address} />}
        {tab === 'history' && <History address={address} />}
      </main>
      <footer className="footer">Stellar · Soroban · Testnet</footer>
    </>
  )
}
