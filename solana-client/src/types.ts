import { PublicKey } from '@solana/web3.js';

export enum WillEscrowInstruction {
    InitializeJob = 0,
    ApplyForJob = 1,
    ReleaseFunds = 2,
}

export class Job {
    is_initialized: boolean;
    owner: PublicKey;
    freelancer: PublicKey | null;
    amount: number;
    release_time: number;
    description: Uint8Array;
    is_completed: boolean;

    constructor(fields: {
        is_initialized: boolean;
        owner: PublicKey;
        freelancer: PublicKey | null;
        amount: number;
        release_time: number;
        description: Uint8Array;
        is_completed: boolean;
    }) {
        this.is_initialized = fields.is_initialized;
        this.owner = fields.owner;
        this.freelancer = fields.freelancer;
        this.amount = fields.amount;
        this.release_time = fields.release_time;
        this.description = fields.description;
        this.is_completed = fields.is_completed;
    }

    static schema = new Map([
        [
            Job,
            {
                kind: 'struct',
                fields: [
                    ['is_initialized', 'u8'],
                    ['owner', { kind: 'array', type: 'u8', len: 32 }],
                    ['freelancer', { kind: 'option', type: { kind: 'array', type: 'u8', len: 32 } }],
                    ['amount', 'u64'],
                    ['release_time', 'i64'],
                    ['description', { kind: 'array', type: 'u8', len: 100 }],
                    ['is_completed', 'u8'],
                ],
            },
        ],
    ]);
}
