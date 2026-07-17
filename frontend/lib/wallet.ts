'use client';

import {
  StellarWalletsKit,
  WalletNetwork,
  allowAllModules,
  FREIGHTER_ID,
} from '@creit.tech/stellar-wallets-kit';
import { NETWORK_PASSPHRASE, STELLAR_NETWORK } from './env';
import { AppError } from './types';

let kit: StellarWalletsKit | null = null;

export function getKit(): StellarWalletsKit {
  if (typeof window === 'undefined') {
    throw new AppError('generic', 'wallet only available in the browser');
  }
  if (!kit) {
    kit = new StellarWalletsKit({
      network: STELLAR_NETWORK === 'public' ? WalletNetwork.PUBLIC : WalletNetwork.TESTNET,
      selectedWalletId: FREIGHTER_ID,
      modules: allowAllModules(),
    });
  }
  return kit;
}

export async function connectWallet(): Promise<string> {
  const walletsKit = getKit();
  return new Promise((resolve, reject) => {
    walletsKit
      .openModal({
        onWalletSelected: async (option) => {
          try {
            walletsKit.setWallet(option.id);
            const { address } = await walletsKit.getAddress();
            resolve(address);
          } catch (err) {
            reject(mapWalletError(err));
          }
        },
        onClosed: (err) => {
          if (err) reject(mapWalletError(err));
        },
      })
      .catch((err) => reject(mapWalletError(err)));
  });
}

export function disconnectWallet() {
  kit = null;
}

export function mapWalletError(err: unknown): AppError {
  const message = err instanceof Error ? err.message : String(err);
  const lower = message.toLowerCase();
  if (lower.includes('not detected') || lower.includes('not installed') || lower.includes('no wallet')) {
    return new AppError('wallet-missing', 'No Stellar wallet extension detected.');
  }
  if (lower.includes('reject') || lower.includes('declin') || lower.includes('user cancel')) {
    return new AppError('rejected', 'Transaction was declined in the wallet.');
  }
  if (lower.includes('not authorized') || lower.includes('permission') || lower.includes('auth')) {
    return new AppError('unauthorized', "You don't have permission for this action.");
  }
  return new AppError('generic', message);
}

export async function signXdr(xdr: string, address: string): Promise<string> {
  try {
    const walletsKit = getKit();
    const { signedTxXdr } = await walletsKit.signTransaction(xdr, {
      address,
      networkPassphrase: NETWORK_PASSPHRASE,
    });
    return signedTxXdr;
  } catch (err) {
    throw mapWalletError(err);
  }
}
