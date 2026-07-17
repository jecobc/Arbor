'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Loader2, XCircle, ExternalLink } from 'lucide-react';

export type TxState = { status: 'idle' } | { status: 'pending' } | { status: 'success'; hash: string } | { status: 'error'; message: string };

export function explorerTxUrl(hash: string) {
  return `https://stellar.expert/explorer/testnet/tx/${hash}`;
}

export default function TxStatusToast({ state, onDismiss }: { state: TxState; onDismiss: () => void }) {
  return (
    <AnimatePresence>
      {state.status !== 'idle' && (
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 30, opacity: 0 }}
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[92vw] max-w-md"
        >
          <div className="ledger-card rounded-lg p-4 flex items-center gap-3">
            {state.status === 'pending' && (
              <>
                <Loader2 className="animate-spin text-seal shrink-0" size={20} />
                <p className="text-sm">Transaction pending…</p>
              </>
            )}
            {state.status === 'success' && (
              <>
                <CheckCircle2 className="text-forest shrink-0" size={20} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">Transaction succeeded</p>
                  <a
                    href={explorerTxUrl(state.hash)}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-mono text-forest underline flex items-center gap-1 truncate"
                  >
                    {state.hash.slice(0, 12)}… <ExternalLink size={12} />
                  </a>
                </div>
              </>
            )}
            {state.status === 'error' && (
              <>
                <XCircle className="text-red-700 shrink-0" size={20} />
                <p className="text-sm flex-1">{state.message}</p>
              </>
            )}
            <button onClick={onDismiss} className="text-ink/40 hover:text-ink text-xs shrink-0">
              ✕
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
