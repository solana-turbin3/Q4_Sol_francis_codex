import { Keypair, PublicKey, Connection, Commitment } from "@solana/web3.js";
import { getOrCreateAssociatedTokenAccount, mintTo } from '@solana/spl-token';
import wallet from "../Turbin3-wallet.json"

// Import our keypair from the wallet file
const keypair = Keypair.fromSecretKey(new Uint8Array(wallet));

//Create a Solana devnet connection
const commitment: Commitment = "confirmed";
const connection = new Connection("https://api.devnet.solana.com", commitment);

const token_decimals = 1_000_000n;

// Mint address
const mint = new PublicKey("9rxVXJ12mBoRrtegEjjs7KBkHuYaDJ5YjrbY4ZEuyQPy");

(async () => {
    try {
        // Create an ATA
        const ata = await getOrCreateAssociatedTokenAccount(
            connection,      // connection
            keypair,        // payer
            mint,           // mint
            keypair.publicKey, // owner
            false,          // allowOwnerOffCurve
            'confirmed'     // commitment
        );
        
        console.log(`Your ata is: ${ata.address.toBase58()}`);

        // Mint to ATA
        const mintTx = await mintTo(
            connection,     // connection
            keypair,        // payer
            mint,           // mint
            ata.address,    // destination
            keypair,        // authority
            1n * token_decimals, // amount
            []             // multiSigners
        );
        
        console.log(`Your mint txid: ${mintTx}`);
    } catch(error) {
        console.log(`Oops, something went wrong: ${error}`)
    }
})()