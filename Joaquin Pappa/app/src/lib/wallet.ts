import { isConnected, requestAccess, signTransaction } from '@stellar/freighter-api'
import { NETWORK_PASSPHRASE } from './config'

export async function connectWallet(): Promise<string> {
  const c = await isConnected()
  if (!c.isConnected) throw new Error('Freighter no está instalado')
  const r = await requestAccess()
  if (r.error) throw new Error(String(r.error.message ?? r.error))
  return r.address
}

export function makeSigner(address: string) {
  return async (xdr: string, opts?: { networkPassphrase?: string }) => {
    const r = await signTransaction(xdr, {
      networkPassphrase: opts?.networkPassphrase ?? NETWORK_PASSPHRASE,
      address,
    })
    if (r.error) throw new Error(String(r.error.message ?? r.error))
    return { signedTxXdr: r.signedTxXdr, signerAddress: r.signerAddress }
  }
}
