'use client';

import { useState } from 'react';
import { useWeb3 } from '../../context/Web3Context';
import { ethers } from 'ethers';

export default function Deposit() {
  const { account, contract, connect } = useWeb3();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('0.0000001');
  const [releaseTime, setReleaseTime] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contract || !account) {
      setError('Please connect your wallet first');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const releaseTimestamp = Math.floor(new Date(releaseTime).getTime() / 1000);
      const amountInWei = ethers.parseEther(amount);

      const tx = await contract.createEscrow(
        account,
        releaseTimestamp,
        {
          value: amountInWei,
          gasLimit: 500000
        }
      );

      await tx.wait();
      setSuccess('Escrow created successfully!');
      setTitle('');
      setDescription('');
      setAmount('0.0000001');
      setReleaseTime('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create escrow');
    } finally {
      setIsLoading(false);
    }
  };

  if (!account) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Connect Your Wallet</h1>
          <button
            onClick={connect}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Create New Escrow</h1>
          
          {error && (
            <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg">
              {error}
            </div>
          )}
          
          {success && (
            <div className="mb-4 p-4 bg-green-50 text-green-700 rounded-lg">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Project Title
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter project title"
                required
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Project Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter project description"
                rows={4}
                required
              />
            </div>

            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                Project Budget (ETH)
              </label>
              <input
                type="number"
                id="amount"
                value={amount}
                onChange={(e) => {
                  const value = e.target.value;
                  if (parseFloat(value) < 0.0000001) {
                    setAmount('0.0000001');
                  } else {
                    setAmount(value);
                  }
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0.0000001"
                step="0.0000001"
                min="0.0000001"
                max="0.1"
                required
              />
              <p className="mt-1 text-sm text-gray-500">
                Minimum amount: 0.0000001 ETH. This is the absolute minimum possible amount.
              </p>
            </div>

            <div>
              <label htmlFor="releaseTime" className="block text-sm font-medium text-gray-700 mb-1">
                Release Time
              </label>
              <input
                type="datetime-local"
                id="releaseTime"
                value={releaseTime}
                onChange={(e) => setReleaseTime(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3 px-4 rounded-lg text-white font-medium ${
                isLoading
                  ? 'bg-blue-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isLoading ? 'Creating Escrow...' : 'Create Escrow'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
} 