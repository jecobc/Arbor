'use client';

import { createContext, useCallback, useContext, useState, ReactNode } from 'react';
import { connectWallet, disconnectWallet, mapWalletError } from './wallet';
import { AppError } from './types';

interface WalletState {
  address: string | null;
  connecting: boolean;
  error: AppError | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  clearError: () => void;
}

const WalletContext = createContext<WalletState | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<AppError | null>(null);

  const connect = useCallback(async () => {
    setConnecting(true);
    setError(null);
    try {
      const addr = await connectWallet();
      setAddress(addr);
    } catch (err) {
      setError(err instanceof AppError ? err : mapWalletError(err));
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    disconnectWallet();
    setAddress(null);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return (
    <WalletContext.Provider value={{ address, connecting, error, connect, disconnect, clearError }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWallet must be used within WalletProvider');
  return ctx;
}
