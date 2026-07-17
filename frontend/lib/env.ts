export const ESCROW_CONTRACT_ADDRESS =
  process.env.NEXT_PUBLIC_ESCROW_CONTRACT_ADDRESS ?? 'PENDING — generate after deployment';
export const ARBITER_CONTRACT_ADDRESS =
  process.env.NEXT_PUBLIC_ARBITER_CONTRACT_ADDRESS ?? 'PENDING — generate after deployment';
export const TOKEN_CONTRACT_ADDRESS =
  process.env.NEXT_PUBLIC_TOKEN_CONTRACT_ADDRESS ?? 'PENDING — generate after deployment';
export const ARBITER_ADDRESS = process.env.NEXT_PUBLIC_ARBITER_ADDRESS ?? '';
export const STELLAR_NETWORK = process.env.NEXT_PUBLIC_STELLAR_NETWORK ?? 'testnet';
export const STELLAR_RPC_URL =
  process.env.NEXT_PUBLIC_STELLAR_RPC_URL ?? 'https://soroban-testnet.stellar.org:443';

export const NETWORK_PASSPHRASE =
  STELLAR_NETWORK === 'testnet'
    ? 'Test SDF Network ; September 2015'
    : 'Public Global Stellar Network ; September 2015';
