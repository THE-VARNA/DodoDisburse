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

  try {
    // Never cast amountMinor to a plain floating-point; keep as BigInt for SPL instruction
    const amountBigInt = BigInt(amountMinor);

    const connection = new Connection(rpcUrl, 'confirmed');
    const treasury = Keypair.fromSecretKey(bs58.decode(treasurySecretKey));
    const mintPubkey = new PublicKey(usdcMint);
    
    let recipientPubkey: PublicKey;
    try {
      recipientPubkey = new PublicKey(recipientWallet);
    } catch {
      throw new Error("Invalid Wallet Address: The provided recipient address is not a valid Solana public key.");
    }

    // Get or create treasury ATA
    const treasuryAta = await getOrCreateAssociatedTokenAccount(
      connection,
      treasury,
      mintPubkey,
      treasury.publicKey,
    );

    // Get or create recipient ATA
    let recipientAta;
    try {
      recipientAta = await getOrCreateAssociatedTokenAccount(
        connection,
        treasury, // payer for ATA creation
        mintPubkey,
        recipientPubkey,
      );
    } catch (err: any) {
      if (err.name === 'TokenOwnerOffCurveError' || String(err).includes('off the curve')) {
        throw new Error("Recipient address is invalid: This address is a smart contract (PDA) and cannot receive tokens directly without an associated account.");
      }
      throw err;
    }

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
  } catch (err: any) {
    const msg = String(err);
    if (msg.includes('insufficient funds')) {
      throw new Error("Treasury Insufficient Funds: The company wallet does not have enough Mock USDC to cover this payout.");
    }
    if (msg.includes('Simulation failed')) {
      throw new Error("Transaction Failed: Solana was unable to process this payment. This usually happens if the treasury is empty or the recipient address is blocked.");
    }
    throw err;
  }
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
