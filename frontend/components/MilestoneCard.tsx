'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Circle, Gavel, PlayCircle, Loader2 } from 'lucide-react';
import { Milestone, MilestoneStatus } from '@/lib/types';
import { stroopsToXlm } from '@/lib/format';
import StampBadge from './StampBadge';

const STEPS: MilestoneStatus[] = ['Funded', 'InProgress', 'Released'];

export function stepIndex(status: MilestoneStatus): number {
  if (status === 'Disputed' || status === 'Refunded') return -1;
  const idx = STEPS.indexOf(status === 'Approved' ? 'Released' : status);
  return idx === -1 ? 0 : idx;
}

export default function MilestoneCard({
  milestone,
  index,
  role,
  ruling,
  busy,
  onStart,
  onApprove,
  onDispute,
  onResolve,
}: {
  milestone: Milestone;
  index: number;
  role: 'client' | 'freelancer' | 'observer';
  ruling: 'Pending' | 'FavorFreelancer' | 'FavorClient' | null;
  busy: boolean;
  onStart: () => void;
  onApprove: () => void;
  onDispute: (reason: string) => void;
  onResolve: () => void;
}) {
  const [reasonOpen, setReasonOpen] = useState(false);
  const [reason, setReason] = useState('');
  const disputed = milestone.status === 'Disputed';
  const settled = milestone.status === 'Released' || milestone.status === 'Refunded';
  const current = stepIndex(milestone.status);
  const xlm = stroopsToXlm(milestone.amount);

  return (
    <div className="ledger-card rounded-lg p-4 sm:p-5 hairline">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-ink/50">Milestone {index + 1}</p>
          <h3 className="font-display text-lg sm:text-xl text-ink">{milestone.title}</h3>
          <p className="font-mono text-sm text-seal mt-0.5">{xlm} XLM</p>
        </div>
        {settled && <StampBadge label={milestone.status.toUpperCase()} />}
        {disputed && <StampBadge label="DISPUTED" />}
      </div>

      {!disputed && (
        <div className="stepper-horizontal flex items-center gap-2 mt-4">
          {STEPS.map((step, i) => (
            <div key={step} className="flex items-center gap-2 flex-1">
              <motion.div
                animate={{ scale: i === current ? 1.15 : 1 }}
                className={`flex items-center gap-1.5 ${i <= current ? 'text-forest' : 'text-ink/30'}`}
              >
                {i < current ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                <span className="text-xs sm:text-sm">{step === 'Released' ? 'Released' : step === 'InProgress' ? 'In Progress' : step}</span>
              </motion.div>
              {i < STEPS.length - 1 && <div className={`h-px flex-1 hairline ${i < current ? 'opacity-100' : 'opacity-40'}`} />}
            </div>
          ))}
        </div>
      )}

      {disputed && (
        <div className="mt-4 flex items-center gap-2 text-seal">
          <Gavel size={18} />
          <span className="text-sm">
            {ruling && ruling !== 'Pending' ? 'Ruling received — ready to resolve' : 'Awaiting arbiter ruling'}
          </span>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {role === 'freelancer' && milestone.status === 'Funded' && (
          <ActionButton onClick={onStart} busy={busy} icon={<PlayCircle size={15} />}>
            Start
          </ActionButton>
        )}
        {role === 'client' && (milestone.status === 'Funded' || milestone.status === 'InProgress') && (
          <ActionButton onClick={onApprove} busy={busy} icon={<CheckCircle2 size={15} />}>
            Approve &amp; Release
          </ActionButton>
        )}
        {(role === 'client' || role === 'freelancer') &&
          (milestone.status === 'Funded' || milestone.status === 'InProgress') &&
          !reasonOpen && (
            <button
              onClick={() => setReasonOpen(true)}
              disabled={busy}
              className="text-xs sm:text-sm border border-seal text-seal rounded px-3 py-1.5 hover:bg-seal/10 transition-colors disabled:opacity-50"
            >
              Raise Dispute
            </button>
          )}
        {reasonOpen && (
          <div className="w-full flex flex-col sm:flex-row gap-2 mt-1">
            <input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Reason, e.g. Deliverable incomplete"
              className="flex-1 border border-hairline rounded px-2.5 py-1.5 text-sm bg-white"
            />
            <button
              onClick={() => {
                onDispute(reason || 'Deliverable incomplete');
                setReasonOpen(false);
              }}
              disabled={busy}
              className="text-xs sm:text-sm bg-seal text-parchment rounded px-3 py-1.5 disabled:opacity-50"
            >
              File Dispute
            </button>
          </div>
        )}
        {disputed && ruling && ruling !== 'Pending' && (
          <ActionButton onClick={onResolve} busy={busy} icon={<Gavel size={15} />}>
            Resolve
          </ActionButton>
        )}
      </div>
    </div>
  );
}

function ActionButton({
  onClick,
  busy,
  icon,
  children,
}: {
  onClick: () => void;
  busy: boolean;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={busy}
      className="flex items-center gap-1.5 text-xs sm:text-sm bg-forest text-parchment rounded px-3 py-1.5 hover:opacity-90 transition-opacity disabled:opacity-50 w-full sm:w-auto justify-center"
    >
      {busy ? <Loader2 size={15} className="animate-spin" /> : icon}
      {children}
    </button>
  );
}
