import {
    Connection,
    Keypair,
    PublicKey,
    SystemProgram,
    Transaction,
    TransactionInstruction,
    sendAndConfirmTransaction,
} from '@solana/web3.js';
import * as borsh from 'borsh';

function toFixedLengthBytes(str: string, length: number): Uint8Array {
    const buffer = new TextEncoder().encode(str);
    const fixed = new Uint8Array(length);
    fixed.set(buffer.slice(0, length));
    return fixed;
}

class InitializeJobArgs {
    amount: bigint;
    release_time: bigint;
    description: Uint8Array;

    constructor(fields: { amount: bigint; release_time: bigint; description: Uint8Array }) {
        this.amount = fields.amount;
        this.release_time = fields.release_time;
        this.description = fields.description;
    }

    static schema = {
        struct: {
            amount: 'u64',
            release_time: 'i64',
            description: { array: { type: 'u8', len: 100 } }
        }
    };
}

export enum WillEscrowInstruction {
    InitializeJob = 0,
    ApplyForJob = 1,
    ReleaseFunds = 2,
}

export class WillEscrowClient {
    private connection: Connection;
    private programId: PublicKey;
    private payer: Keypair;

    constructor(connection: Connection, programId: PublicKey, payer: Keypair) {
        this.connection = connection;
        this.programId = programId;
        this.payer = payer;
    }

    async initializeJob(amount: number, releaseTime: number, description: string): Promise<string> {
        const jobAccount = Keypair.generate();

        // Create instruction data
        const instructionData = Buffer.alloc(1 + 8 + 8 + 100); // 1 byte for instruction + 8 bytes for amount + 8 bytes for release_time + 100 bytes for description
        instructionData.writeUInt8(WillEscrowInstruction.InitializeJob, 0);
        instructionData.writeBigUInt64LE(BigInt(amount * 1e9), 1);
        instructionData.writeBigInt64LE(BigInt(releaseTime), 9);
        const descriptionBytes = toFixedLengthBytes(description, 100);
        instructionData.set(descriptionBytes, 17);

        // Calculate exact space needed for Job struct
        const JOB_ACCOUNT_SIZE = 1 + // is_initialized (bool)
            32 + // owner (Pubkey)
            1 + 32 + // freelancer (Option<Pubkey>)
            8 + // amount (u64)
            8 + // release_time (i64)
            100 + // description ([u8; 100])
            1; // is_completed (bool)

        const lamports = await this.connection.getMinimumBalanceForRentExemption(JOB_ACCOUNT_SIZE);

        const transaction = new Transaction().add(
            SystemProgram.createAccount({
                fromPubkey: this.payer.publicKey,
                newAccountPubkey: jobAccount.publicKey,
                lamports,
                space: JOB_ACCOUNT_SIZE,
                programId: this.programId,
            }),
            new TransactionInstruction({
                keys: [
                    { pubkey: this.payer.publicKey, isSigner: true, isWritable: true },
                    { pubkey: jobAccount.publicKey, isSigner: true, isWritable: true },
                    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
                ],
                programId: this.programId,
                data: instructionData,
            })
        );

        await sendAndConfirmTransaction(this.connection, transaction, [this.payer, jobAccount]);
        return jobAccount.publicKey.toBase58();
    }
} 