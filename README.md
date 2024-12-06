<div align="center">
  <h1>Project Payclip</h1>
</div>

**Payclip** - A one-click USDC payment solution on Solana that simplifies crypto
transactions for everyone.
This web3 application allows users to send and receive USDC instantly through
shareable payment links, similar to PayPal or Cash App, but powered by Solana's
blockchain.
The key feature is its accessibility - recipients don't need an existing crypto wallet
to receive funds, making it perfect for crypto beginners.
## Table of Contents
1. [Features](#features)
2. [Getting Started](#getting-started)
3. [Installation](#installation)
4. [Usage](#usage)
5. [Program Details](#program-details)


---

## Features

1. Payclip Program (Main Program)
- Core payment processing logic
- USDC token handling via SPL Token program
- Transaction management

2. Program Data Accounts (PDAs):
- Payment PDA
  - Stores payment-specific data
  - Manages payment amounts
  - Tracks payment status
  - Stores recipient information
  - Handles expiration timing

- User PDA
  - Manages user statistics
  - Stores transaction history
  - Handles aggregated user data

3. Token Account Management
- USDC/USDT token account handling
- Integration with SPL Token Program
- Token transfer logic


---

## Getting Started

### Prerequisites
- **Rust:** Install Rust and Cargo ([Rust installation guide](https://www.rust-lang.org/tools/install)).
- **Anchor Framework:** Ensure Anchor CLI is installed. Follow the [official guide](https://book.anchor-lang.com/getting_started/installation.html).
- **Solana CLI:** Install the Solana CLI for blockchain interactions ([Solana CLI installation guide](https://docs.solana.com/cli/install-solana-cli-tools)).

---

### Installation

1. **Clone the Repository/Main Branch**
   ```bash
   git clone https://github.com/solana-turbin3/Q4_Sol_francis_codex.git
   cd Q4_Sol_francis_codex
   anchor build
   ```
   ### A preview of the test checks:
   
```markdown
  payclip
Vault initialized.
Mint Address: 9Ku7jJo2YbMf6Wn18TRmViUCbpcAHwztdnJKoTDTQ64i
Token accounts created.
Tokens minted to payer account.
Payment created.
Payment processed successfully.
    ✔ Initializes vault, creates, and processes a payment (3072ms)


  1 passing (3s)

Done in 6.06s.
```
   
### Program Details

Program ID: 8jnCz4DqoBt2CZsNpE41FsoAvREfaG4n6bhkZg9fkH7t

IDL: Generated during anchor build and located in target/idl/payclip.json.

Cluster: Devnet (default).
