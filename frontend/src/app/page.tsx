'use client';

import { useState } from 'react';
import { WillEscrowClient } from '../lib/client';
import { Connection, Keypair, PublicKey } from '@solana/web3.js';

export default function Home() {
  const [amount, setAmount] = useState('');
  const [releaseTime, setReleaseTime] = useState('');
  const [description, setDescription] = useState('');
  const [jobId, setJobId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const initializeJob = async () => {
    try {
      setLoading(true);
      setError('');

      // Connect to Solana devnet
      const connection = new Connection(
        process.env.NEXT_PUBLIC_SOLANA_NETWORK === 'mainnet-beta'
          ? 'https://api.mainnet-beta.solana.com'
          : 'https://api.devnet.solana.com',
        'confirmed'
      );
      
      // In a real app, you would get this from a wallet like Phantom
      const payer = Keypair.generate();
      
      // Get program ID from environment variable
      const programId = new PublicKey(process.env.NEXT_PUBLIC_PROGRAM_ID || '');
      
      const client = new WillEscrowClient(connection, programId, payer);
      
      const jobId = await client.initializeJob(
        parseFloat(amount),
        Math.floor(new Date(releaseTime).getTime() / 1000),
        description
      );
      
      setJobId(jobId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">AI Escrow for Freelancers</h1>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Amount (SOL)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="Enter amount in SOL"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Release Time</label>
            <input
              type="datetime-local"
              value={releaseTime}
              onChange={(e) => setReleaseTime(e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2 border rounded"
              rows={4}
              placeholder="Enter job description"
            />
          </div>

          <button
            onClick={initializeJob}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:bg-blue-300"
          >
            {loading ? 'Creating Job...' : 'Create Job'}
          </button>

          {error && (
            <div className="text-red-600 mt-4">
              {error}
            </div>
          )}

          {jobId && (
            <div className="mt-4 p-4 bg-green-100 rounded">
              <p className="font-medium">Job Created Successfully!</p>
              <p className="text-sm mt-2">Job ID: {jobId}</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
