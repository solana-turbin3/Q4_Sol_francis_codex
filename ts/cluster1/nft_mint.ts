import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { 
    createNft, 
    mplTokenMetadata
} from "@metaplex-foundation/mpl-token-metadata";
import { 
    createSignerFromKeypair, 
    signerIdentity, 
    generateSigner, 
    percentAmount 
} from "@metaplex-foundation/umi";

import wallet from "../Turbin3-wallet.json";
import base58 from "bs58";

const RPC_ENDPOINT = "https://api.devnet.solana.com";
const umi = createUmi(RPC_ENDPOINT);

let keypair = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(wallet));
const myKeypairSigner = createSignerFromKeypair(umi, keypair);
umi.use(signerIdentity(myKeypairSigner));
umi.use(mplTokenMetadata())

const mint = generateSigner(umi);

(async () => {
    try {
        let tx = createNft(umi, {
            mint,
            name: "franciscodex",
            symbol: "999",
            uri: "https://devnet.irys.xyz/HQeagzTkZXHKATdEmtsbncqX8LTSB4dgbLutaqRUpAru",
            sellerFeeBasisPoints: percentAmount(1),
            creators: [
                {
                    address: myKeypairSigner.publicKey,
                    verified: true,
                    share: 100,
                }
            ],
            collection: null,
            uses: null,
        });

        let result = await tx.sendAndConfirm(umi);
        const signature = base58.encode(result.signature);
        
        console.log(`Successfully Minted! Check out your TX here:\nhttps://explorer.solana.com/tx/${signature}?cluster=devnet`)
        console.log("Mint Address: ", mint.publicKey);
    } catch (error) {
        console.error("Error creating NFT:", error);
    }
})();