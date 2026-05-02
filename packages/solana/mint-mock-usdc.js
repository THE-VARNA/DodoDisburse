const { Connection, Keypair, Transaction, sendAndConfirmTransaction } = require('@solana/web3.js');
const { createMint, getOrCreateAssociatedTokenAccount, mintTo } = require('@solana/spl-token');
const bs58 = require('bs58').default || require('bs58');

async function main() {
  const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

  // The treasury secret key we generated
  const treasurySecret = '44dEcC89z1SyNHBpA9Kcmb5RcAPcvJTpFuMAoWvAiMkGN5UMV4irMiWzJRjnsEye5Br7D5xtHQWxUuJ4yhr19wdZ';
  const treasury = Keypair.fromSecretKey(bs58.decode(treasurySecret));

  console.log('Treasury:', treasury.publicKey.toBase58());

  // 1. Create a new Mock USDC Mint
  console.log('Creating Mock USDC Mint...');
  const mint = await createMint(
    connection,
    treasury, // payer
    treasury.publicKey, // mint authority
    null, // freeze authority
    6 // 6 decimals like USDC
  );
  console.log('✅ Mock USDC Mint created:', mint.toBase58());

  // 2. Get Treasury ATA
  console.log('Getting Treasury ATA...');
  const treasuryAta = await getOrCreateAssociatedTokenAccount(
    connection,
    treasury,
    mint,
    treasury.publicKey
  );
  console.log('✅ Treasury ATA:', treasuryAta.address.toBase58());

  // 3. Mint 1,000,000 Mock USDC to Treasury
  console.log('Minting 1,000,000 Mock USDC...');
  const amountToMint = 1_000_000 * 1_000_000; // 1M tokens with 6 decimals
  await mintTo(
    connection,
    treasury,
    mint,
    treasuryAta.address,
    treasury.publicKey,
    amountToMint
  );

  console.log('🎉 Successfully funded Treasury with 1,000,000 Mock USDC!');
  console.log('\\n👉 ACTION REQUIRED: Update your Vercel Environment Variables:');
  console.log(`SOLANA_USDC_MINT=${mint.toBase58()}`);
}

main().catch(console.error);
