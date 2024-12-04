import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey, Keypair, SystemProgram } from "@solana/web3.js";
import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { Payclip } from "../target/types/payclip";

describe("payclip", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Payclip as Program<Payclip>;

  const payer = provider.wallet.publicKey; // Wallet publicKey
  const payerKeypair = provider.wallet as anchor.Wallet; // Wallet as Keypair

  it("Initializes vault, creates, and processes a payment", async () => {
    // Vault initialization
    const [vaultPDA, bump] = PublicKey.findProgramAddressSync(
      [Buffer.from("vault")],
      program.programId
    );

    await program.methods
      .initializeVault(bump) 
      .accounts({
        vaultState: vaultPDA,
        authority: payer,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
    console.log("Vault initialized.");

    // Create mint
    const mint = await createMint(
      provider.connection,
      payerKeypair.payer, // Keypair for signing
      payer,
      null,
      9 // Decimals
    );
    console.log("Mint Address:", mint.toBase58());

    // Token accounts
    const payerTokenAccount = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      payerKeypair.payer,
      mint,
      payer
    );
    const recipient = Keypair.generate();
    const recipientTokenAccount = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      payerKeypair.payer,
      mint,
      recipient.publicKey
    );
    console.log("Token accounts created.");

    // Mint tokens to the payer
    await mintTo(
      provider.connection,
      payerKeypair.payer,
      mint,
      payerTokenAccount.address,
      payer,
      1000 * 1e9
    );
    console.log("Tokens minted to payer account.");

    // Create payment
    const paymentId = "test_payment_001";
    const [paymentPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("payment"), Buffer.from(paymentId)],
      program.programId
    );
    const [userStatsPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("user_stats"), recipient.publicKey.toBuffer()],
      program.programId
    );

    await program.methods
      .createPayment(new anchor.BN(500), paymentId, Math.floor(Date.now() / 1000) + 600)
      .accounts({
        payment: paymentPDA,
        userStats: userStatsPDA,
        payer: payer,
        recipient: recipient.publicKey,
        mint: mint,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
    console.log("Payment created.");

    // Process payment
    await program.methods
      .processPayment(new anchor.BN(500))
      .accounts({
        payment: paymentPDA,
        userStats: userStatsPDA,
        payerTokenAccount: payerTokenAccount.address,
        recipientTokenAccount: recipientTokenAccount.address,
        payer: payer,
        recipient: recipient.publicKey,
        mint: mint,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();
    console.log("Payment processed successfully.");
  });
});
