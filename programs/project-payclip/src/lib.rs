use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};


declare_id!("8vuHXvK5vA9XNFoRpqFktB11kNotGR5fexyT2jzgZyof");

#[program]
pub mod payclip {
    use super::*;

    // Initialize the payment vault
    pub fn initialize_vault(
        ctx: Context<InitializeVault>,
        bump: u8,
    ) -> Result<()> {
        ctx.accounts.vault_state.bump = bump;
        ctx.accounts.vault_state.authority = ctx.accounts.authority.key();
        Ok(())
    }

    // Create a new payment
    pub fn create_payment(
        ctx: Context<CreatePayment>,
        amount: u64,
        payment_id: String,
        expiry: i64,
    ) -> Result<()> {
        let payment = &mut ctx.accounts.payment;
        payment.amount = amount;
        payment.recipient = ctx.accounts.recipient.key();
        payment.mint = ctx.accounts.mint.key();
        payment.status = PaymentStatus::Pending;
        payment.payment_id = payment_id;
        payment.created_at = Clock::get()?.unix_timestamp;
        payment.expires_at = expiry;
        
        // Update user stats
        let user_stats = &mut ctx.accounts.user_stats;
        user_stats.total_payments += 1;
        user_stats.total_volume += amount;

        Ok(())
    }

    // Process payment
    pub fn process_payment(
        ctx: Context<ProcessPayment>,
        amount: u64,
    ) -> Result<()> {
        let payment = &mut ctx.accounts.payment;
        require!(payment.status == PaymentStatus::Pending, ErrorCode::InvalidPaymentStatus);
        require!(payment.amount == amount, ErrorCode::InvalidAmount);
        require!(
            Clock::get()?.unix_timestamp < payment.expires_at,
            ErrorCode::PaymentExpired
        );

        // Transfer tokens
        let transfer_accounts = Transfer {
            from: ctx.accounts.payer_token_account.to_account_info(),
            to: ctx.accounts.recipient_token_account.to_account_info(),
            authority: ctx.accounts.payer.to_account_info(),
        };
        
        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                transfer_accounts,
            ),
            amount,
        )?;

        payment.status = PaymentStatus::Completed;
        
        // Update user stats
        let user_stats = &mut ctx.accounts.user_stats;
        user_stats.completed_payments += 1;

        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(bump: u8)]
pub struct InitializeVault<'info> {
    #[account(
        init,
        payer = authority,
        space = VaultState::LEN,
        seeds = [b"vault"],
        bump,
    )]
    pub vault_state: Account<'info, VaultState>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(payment_id: String)]
pub struct CreatePayment<'info> {
    #[account(
        init,
        payer = payer,
        space = Payment::LEN,
        seeds = [b"payment", payment_id.as_bytes()],
        bump,
    )]
    pub payment: Account<'info, Payment>,
    
    #[account(
        init,
        payer = payer,
        space = UserStats::LEN,
        seeds = [b"user_stats", recipient.key().as_ref()],
        bump,
    )]
    pub user_stats: Account<'info, UserStats>,
    
    #[account(mut)]
    pub payer: Signer<'info>,
    pub recipient: SystemAccount<'info>,
    pub mint: Account<'info, Mint>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ProcessPayment<'info> {
    #[account(
        mut,
        constraint = payment.recipient == recipient.key(),
        constraint = payment.mint == mint.key(),
    )]
    pub payment: Account<'info, Payment>,
    
    #[account(mut)]
    pub user_stats: Account<'info, UserStats>,
    
    #[account(mut)]
    pub payer_token_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub recipient_token_account: Account<'info, TokenAccount>,
    
    pub payer: Signer<'info>,
    pub recipient: SystemAccount<'info>,
    pub mint: Account<'info, Mint>,
    pub token_program: Program<'info, Token>,
}

#[account]
pub struct VaultState {
    pub bump: u8,
    pub authority: Pubkey,
}

#[account]
pub struct Payment {
    pub amount: u64,
    pub recipient: Pubkey,
    pub mint: Pubkey,
    pub status: PaymentStatus,
    pub payment_id: String,
    pub created_at: i64,
    pub expires_at: i64,
}

#[account]
pub struct UserStats {
    pub total_payments: u64,
    pub completed_payments: u64,
    pub total_volume: u64,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq)]
pub enum PaymentStatus {
    Pending,
    Completed,
    Cancelled,
}

impl VaultState {
    pub const LEN: usize = 8 + 1 + 32;
}

impl Payment {
    pub const LEN: usize = 8 + 8 + 32 + 32 + 1 + 32 + 8 + 8;
}

impl UserStats {
    pub const LEN: usize = 8 + 8 + 8 + 8;
}

#[error_code]
pub enum ErrorCode {
    #[msg("Invalid payment status")]
    InvalidPaymentStatus,
    #[msg("Invalid payment amount")]
    InvalidAmount,
    #[msg("Payment has expired")]
    PaymentExpired,
}