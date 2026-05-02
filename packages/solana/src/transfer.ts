import {
  Connection,
  Keypair,
  PublicKey,
  sendAndConfirmTransaction,
  Transaction,
} from '@solana/web3.js';
import {
  createTransferInstruction,
  getOrCreateAssociatedTokenAccount,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import bs58 from 'bs58';

export interface TransferParams {
  rpcUrl: string;
  treasurySecretKey: string; // base58 encoded
  usdcMint: string;
  recipientWallet: string;
  /** Amount in USDC minor units (6 decimals). Pass as number; converted to BigInt here. */
  amountMinor: number;
}

export interface TransferResult {
  signature: string;
  recipientAta: string;
}

export async function transferUsdc(params: TransferParams): Promise<TransferResult> {
  const { rpcUrl, treasurySecretKey, usdcMint, recipientWallet, amountMinor } = params;

  // Never cast amountMinor to a plain floating-point; keep as BigInt for SPL instruction
  const amountBigInt = BigInt(amountMinor);

  const connection = new Connection(rpcUrl, 'confirmed');
  const treasury = Keypair.fromSecretKey(bs58.decode(treasurySecretKey));
  const mintPubkey = new PublicKey(usdcMint);
  const recipientPubkey = new PublicKey(recipientWallet);

  // Get or create treasury ATA
  const treasuryAta = await getOrCreateAssociatedTokenAccount(
    connection,
    treasury,
    mintPubkey,
    treasury.publicKey,
  );

  // Get or create recipient ATA
  const recipientAta = await getOrCreateAssociatedTokenAccount(
    connection,
    treasury, // payer for ATA creation
    mintPubkey,
    recipientPubkey,
  );

  // Build transfer instruction with BigInt amount
  const transferIx = createTransferInstruction(
    treasuryAta.address,
    recipientAta.address,
    treasury.publicKey,
    amountBigInt,
    [],
    TOKEN_PROGRAM_ID,
  );

  const tx = new Transaction().add(transferIx);
  const signature = await sendAndConfirmTransaction(connection, tx, [treasury], {
    commitment: 'confirmed',
  });

  return {
    signature,
    recipientAta: recipientAta.address.toBase58(),
  };
}

export async function getTreasuryBalance(params: {
  rpcUrl: string;
  treasurySecretKey: string;
  usdcMint: string;
}): Promise<bigint> {
  const connection = new Connection(params.rpcUrl, 'confirmed');
  const treasury = Keypair.fromSecretKey(bs58.decode(params.treasurySecretKey));
  const mintPubkey = new PublicKey(params.usdcMint);

  try {
    const ata = await getOrCreateAssociatedTokenAccount(
      connection,
      treasury,
      mintPubkey,
      treasury.publicKey,
    );
    const balance = await connection.getTokenAccountBalance(ata.address);
    return BigInt(balance.value.amount);
  } catch {
    return BigInt(0);
  }
}
