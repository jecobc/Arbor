export type MilestoneStatus =
  | 'Funded'
  | 'InProgress'
  | 'Approved'
  | 'Released'
  | 'Disputed'
  | 'Refunded';

export interface Milestone {
  title: string;
  amount: bigint;
  status: MilestoneStatus;
}

export interface EscrowData {
  id: number;
  client: string;
  freelancer: string;
  token: string;
  arbiterContract: string;
  milestones: Milestone[];
  createdAt: number;
}

export type Ruling = 'Pending' | 'FavorFreelancer' | 'FavorClient';

export interface Dispute {
  disputeId: number;
  escrowId: number;
  milestoneIndex: number;
  raisedBy: string;
  reason: string;
  ruling: Ruling;
}

export type AppErrorKind = 'wallet-missing' | 'rejected' | 'unauthorized' | 'awaiting-ruling' | 'generic';

export class AppError extends Error {
  kind: AppErrorKind;
  constructor(kind: AppErrorKind, message: string) {
    super(message);
    this.kind = kind;
  }
}
