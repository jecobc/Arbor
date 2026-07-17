import type { Metadata } from 'next';
import './globals.css';
import { WalletProvider } from '@/lib/WalletContext';
import NavBar from '@/components/NavBar';

export const metadata: Metadata = {
  title: 'Arbor — Milestone Escrow with Dispute Arbitration',
  description: 'A ledger & seal styled milestone escrow dApp on Stellar Soroban.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-serif min-h-screen">
        <WalletProvider>
          <NavBar />
          <main className="max-w-5xl mx-auto px-4 sm:px-6 pb-16">{children}</main>
        </WalletProvider>
      </body>
    </html>
  );
}
