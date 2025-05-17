'use client';

import { useState } from 'react';
import { useWeb3 } from '../../context/Web3Context';
import { useUserRole } from '../../context/UserRoleContext';
import { useRouter } from 'next/navigation';
import { ethers } from 'ethers';

export default function Deposit() {
  const router = useRouter();
  const { account, contract, connect } = useWeb3();
  const { role, isLoading: isRoleLoading } = useUserRole();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [deadline, setDeadline] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contract || !account) {
      setError('Please connect your wallet first');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

      // Verify contract is properly initialized
      if (!contract) {
        throw new Error('Contract not initialized. Please try reconnecting your wallet.');
      }

      if (typeof contract.postJob !== 'function') {
        console.error('Contract functions:', Object.keys(contract.functions));
        throw new Error('Contract not properly initialized. Please try reconnecting your wallet.');
      }

      // Validate inputs
      if (!title.trim() || !description.trim() || !amount || !deadline) {
        throw new Error('Please fill in all fields');
      }

      const amountInWei = ethers.parseEther(amount);
      const deadlineTimestamp = Math.floor(new Date(deadline).getTime() / 1000);

      // Check if current time is before deadline
      const currentTime = Math.floor(Date.now() / 1000);
      if (deadlineTimestamp <= currentTime) {
        throw new Error('Deadline must be in the future');
      }

      // Post the job
      console.log('Posting job with details:', {
        title,
        description,
        amount: amountInWei.toString(),
        deadline: deadlineTimestamp
      });

      const tx = await contract.postJob(
        deadlineTimestamp,
        `${title}\n\n${description}`,
        { value: amountInWei }
      );

      console.log('Transaction sent:', tx.hash);
      const receipt = await tx.wait();
      console.log('Transaction confirmed:', receipt);

      setSuccess(true);
      setTitle('');
      setDescription('');
      setAmount('');
      setDeadline('');
      router.push('/jobs');
    } catch (err) {
      console.error('Error posting job:', err);
      if (err instanceof Error) {
        if (err.message.includes('Job already exists')) {
          setError('You already have an active job. Please complete or cancel it before posting a new one.');
        } else if (err.message.includes('insufficient funds')) {
          setError('Insufficient funds to post the job. Please ensure you have enough ETH to cover the job amount and gas fees.');
        } else {
          setError(err.message);
        }
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!account) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-sm">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900">Connect Your Wallet</h2>
            <p className="mt-2 text-gray-600">Please connect your wallet to post a job</p>
            <button
              onClick={connect}
              className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Connect Wallet
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isRoleLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (role !== 'client') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-sm">
          <div className="text-center text-red-600">
            <h2 className="text-2xl font-bold">Access Denied</h2>
            <p className="mt-2">Only clients can post jobs</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Post a New Job</h1>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-600">Job posted successfully!</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                Job Title
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Enter job title"
                required
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Job Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Enter detailed job description"
                required
              />
            </div>

            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
                Budget (ETH)
              </label>
              <input
                type="number"
                id="amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                step="0.01"
                min="0"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Enter budget in ETH"
                required
              />
            </div>

            <div>
              <label htmlFor="deadline" className="block text-sm font-medium text-gray-700">
                Deadline
              </label>
              <input
                type="datetime-local"
                id="deadline"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                loading
                  ? 'bg-blue-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
              }`}
            >
              {loading ? 'Posting Job...' : 'Post Job'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
} 