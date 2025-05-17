use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint,
    entrypoint::ProgramResult,
    pubkey::Pubkey,
    msg,
    program_error::ProgramError,
    sysvar::{rent::Rent, Sysvar},
};

#[derive(BorshSerialize, BorshDeserialize, Debug, Clone)]
pub struct Job {
    pub is_initialized: bool,          // 1 byte
    pub owner: Pubkey,                 // 32 bytes
    pub freelancer: Option<Pubkey>,    // 1 + 32 bytes
    pub amount: u64,                   // 8 bytes
    pub release_time: i64,             // 8 bytes
    pub description: [u8; 100],        // 100 bytes (fixed)
    pub is_completed: bool,            // 1 byte
}

#[derive(BorshDeserialize)]
pub struct InitializeJobArgs {
    pub amount: u64,
    pub release_time: i64,
    pub description: [u8; 100],
}

#[derive(BorshSerialize, BorshDeserialize)]
pub enum WillEscrowInstruction {
    InitializeJob,
    ApplyForJob,
    ReleaseFunds,
}

// Entry point
entrypoint!(process_instruction);

fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    if instruction_data.is_empty() {
        msg!("Error: Instruction data is empty");
        return Err(ProgramError::InvalidInstructionData);
    }

    let instruction = instruction_data[0];
    msg!("Processing instruction: {}", instruction);

    match instruction {
        0 => { // InitializeJob
            msg!("AI Escrow: Initialize job");
            let accounts_iter = &mut accounts.iter();
            let owner = next_account_info(accounts_iter)?;
            let job_account = next_account_info(accounts_iter)?;
            let rent_sysvar = next_account_info(accounts_iter)?;

            if !owner.is_signer {
                msg!("Error: Owner must be a signer");
                return Err(ProgramError::MissingRequiredSignature);
            }

            // Log account sizes
            msg!("Job account data length: {}", job_account.data_len());
            msg!("Job account lamports: {}", job_account.lamports());

            // Parse instruction data
            if instruction_data.len() < 117 { // 1 + 8 + 8 + 100
                msg!("Error: Invalid instruction data length");
                return Err(ProgramError::InvalidInstructionData);
            }

            let amount = u64::from_le_bytes(instruction_data[1..9].try_into().unwrap());
            let release_time = i64::from_le_bytes(instruction_data[9..17].try_into().unwrap());
            let description = instruction_data[17..117].try_into().unwrap();

            msg!("Parsed instruction data: amount={}, release_time={}", amount, release_time);

            // Check rent exemption
            let rent = &Rent::from_account_info(rent_sysvar)?;
            if !rent.is_exempt(job_account.lamports(), job_account.data_len()) {
                msg!("Error: Account not rent exempt");
                return Err(ProgramError::AccountNotRentExempt);
            }

            let mut job = Job {
                is_initialized: true,
                owner: *owner.key,
                freelancer: None,
                amount,
                release_time,
                description,
                is_completed: false,
            };

            msg!("Created job struct successfully");
            job.serialize(&mut &mut job_account.data.borrow_mut()[..])?;
            msg!("Job initialized successfully");
            Ok(())
        }
        1 => { // ApplyForJob
            msg!("AI Escrow: Apply for job");
            let accounts_iter = &mut accounts.iter();
            let freelancer = next_account_info(accounts_iter)?;
            let job_account = next_account_info(accounts_iter)?;

            if !freelancer.is_signer {
                return Err(ProgramError::MissingRequiredSignature);
            }

            let mut job = Job::try_from_slice(&job_account.data.borrow())?;
            if job.freelancer.is_some() {
                return Err(ProgramError::AccountAlreadyInitialized);
            }

            job.freelancer = Some(*freelancer.key);
            job.serialize(&mut &mut job_account.data.borrow_mut()[..])?;
            msg!("Job application successful");
            Ok(())
        }
        2 => { // ReleaseFunds
            msg!("AI Escrow: Release funds");
            let accounts_iter = &mut accounts.iter();
            let owner = next_account_info(accounts_iter)?;
            let job_account = next_account_info(accounts_iter)?;
            let freelancer = next_account_info(accounts_iter)?;

            if !owner.is_signer {
                return Err(ProgramError::MissingRequiredSignature);
            }

            let mut job = Job::try_from_slice(&job_account.data.borrow())?;
            if job.owner != *owner.key {
                return Err(ProgramError::InvalidAccountData);
            }

            if job.freelancer.is_none() {
                return Err(ProgramError::InvalidAccountData);
            }

            if job.freelancer.unwrap() != *freelancer.key {
                return Err(ProgramError::InvalidAccountData);
            }

            let current_time = solana_program::clock::Clock::get()?.unix_timestamp;
            if current_time < job.release_time {
                return Err(ProgramError::InvalidAccountData);
            }

            job.is_completed = true;
            job.serialize(&mut &mut job_account.data.borrow_mut()[..])?;
            msg!("Funds released successfully");
            Ok(())
        }
        _ => {
            msg!("Error: Invalid instruction");
            Err(ProgramError::InvalidInstructionData)
        }
    }
}
