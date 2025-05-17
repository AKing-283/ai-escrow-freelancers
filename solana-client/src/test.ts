import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { WillEscrowClient } from './client';
import { Job } from './types';
import fs from 'fs';

async function main() {
    const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
    const programId = new PublicKey('GxX6T7QDc5QLtRp73bY98eXfWfpQMyjbey6MkEfnvfHH');
    const payer = Keypair.fromSecretKey(
        Buffer.from(JSON.parse(fs.readFileSync('/Users/puspakd/.config/solana/id.json', 'utf-8')))
    );

    const client = new WillEscrowClient(connection, programId, payer);

    try {
        console.log('Initializing job...');
        const signature = await client.initializeJob(
            1, // 1 SOL
            Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
            'Test job description'
        );
        console.log('Job initialized! Transaction signature:', signature);

        const transaction = await connection.getTransaction(signature);
        const jobAccount = transaction?.transaction.message.accountKeys[1];
        if (!jobAccount) throw new Error('Job account not found in transaction');

        const job: Job = await client.getJobAccount(jobAccount);
        const description = new TextDecoder().decode(job.description).replace(/\0/g, '');
        console.log('Job details:', {
            ...job,
            description,
        });

        console.log('Applying for job...');
        const applySignature = await client.applyForJob(jobAccount);
        console.log('Applied for job! Signature:', applySignature);

        const updatedJob: Job = await client.getJobAccount(jobAccount);
        const updatedDescription = new TextDecoder().decode(updatedJob.description).replace(/\0/g, '');
        console.log('Updated job details:', {
            ...updatedJob,
            description: updatedDescription,
        });

    } catch (error) {
        console.error('Error:', error);
    }
}

main();
