'use client';

import {
  Contract,
  rpc,
  TransactionBuilder,
  Address,
  Account,
  Keypair,
  nativeToScVal,
  scValToNative,
  xdr,
  BASE_FEE,
} from '@stellar/stellar-sdk';
import { NETWORK_PASSPHRASE, STELLAR_RPC_URL } from './env';
import { signXdr, mapWalletError } from './wallet';
import { AppError } from './types';

export function server() {
  return new rpc.Server(STELLAR_RPC_URL);
}

export async function readContract(contractId: string, method: string, args: xdr.ScVal[] = []) {
  const srv = server();
  const contract = new Contract(contractId);
  // A throwaway, never-funded source account is sufficient for a read-only simulation.
  const account = new Account(Keypair.random().publicKey(), '0');
  const tx = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase: NETWORK_PASSPHRASE })
    .addOperation(contract.call(method, ...args))
    .setTimeout(30)
    .build();

  const sim = await srv.simulateTransaction(tx);
  if (rpc.Api.isSimulationError(sim)) {
    throw new AppError('generic', sim.error);
  }
  if (!sim.result) {
    throw new AppError('generic', 'empty simulation result');
  }
  return scValToNative(sim.result.retval);
}

export async function writeContract(
  contractId: string,
  method: string,
  args: xdr.ScVal[],
  sourceAddress: string,
): Promise<{ hash: string }> {
  const srv = server();
  const contract = new Contract(contractId);

  let account;
  try {
    account = await srv.getAccount(sourceAddress);
  } catch {
    throw new AppError('generic', 'Source account not found on the network. Fund it via Friendbot first.');
  }

  let tx = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase: NETWORK_PASSPHRASE })
    .addOperation(contract.call(method, ...args))
    .setTimeout(60)
    .build();

  const sim = await srv.simulateTransaction(tx);
  if (rpc.Api.isSimulationError(sim)) {
    const message = sim.error ?? 'simulation failed';
    if (message.toLowerCase().includes('auth')) {
      throw new AppError('unauthorized', "You don't have permission for this action.");
    }
    throw new AppError('generic', message);
  }

  const prepared = rpc.assembleTransaction(tx, sim).build();
  const signedXdr = await signXdr(prepared.toXDR(), sourceAddress);

  const signedTx = TransactionBuilder.fromXDR(signedXdr, NETWORK_PASSPHRASE);
  const sendResult = await srv.sendTransaction(signedTx);

  if (sendResult.status === 'ERROR') {
    throw new AppError('generic', `Transaction rejected: ${JSON.stringify(sendResult.errorResult)}`);
  }

  const hash = sendResult.hash;
  let confirmed = false;
  for (let i = 0; i < 20 && !confirmed; i++) {
    await new Promise((r) => setTimeout(r, 1500));
    const poll = await srv.getTransaction(hash);
    if (poll.status === 'FAILED') {
      throw new AppError('generic', 'Transaction failed on-chain.');
    }
    if (poll.status === 'SUCCESS') confirmed = true;
  }

  return { hash };
}

export function addrArg(address: string): xdr.ScVal {
  return new Address(address).toScVal();
}

export function u32Arg(n: number): xdr.ScVal {
  return nativeToScVal(n, { type: 'u32' });
}

export function u64Arg(n: number | bigint): xdr.ScVal {
  return nativeToScVal(BigInt(n), { type: 'u64' });
}

export function i128Arg(n: bigint): xdr.ScVal {
  return nativeToScVal(n, { type: 'i128' });
}

export function strArg(s: string): xdr.ScVal {
  return nativeToScVal(s, { type: 'string' });
}

export function milestonesArg(items: { title: string; amount: bigint }[]): xdr.ScVal {
  return xdr.ScVal.scvVec(
    items.map((m) =>
      xdr.ScVal.scvVec([strArg(m.title), i128Arg(m.amount)]),
    ),
  );
}

export { mapWalletError };
