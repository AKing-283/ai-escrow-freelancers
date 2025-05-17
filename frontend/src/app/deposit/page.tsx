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

      // Verify contract is properly initialized
      if (!contract) {
        throw new Error('Contract not initialized. Please try reconnecting your wallet.');
      }

      if (typeof contract.postJob !== 'function') {
        console.error('Contract functions:', Object.keys(contract.functions));
        throw new Error('Contract not properly initialized. Please try reconnecting your wallet.');
      }

      // Validate inputs
      if (!title.trim() || !description.trim() || !deadline) {
        throw new Error('Please fill in all fields');
      }

      // Parse and validate the deadline
      const deadlineDate = new Date(deadline);
      if (isNaN(deadlineDate.getTime())) {
        throw new Error('Invalid deadline date');
      }

      const deadlineTimestamp = Math.floor(deadlineDate.getTime() / 1000);

      // Check if current time is before deadline
      const currentTime = Math.floor(Date.now() / 1000);
      if (deadlineTimestamp <= currentTime) {
        throw new Error('Deadline must be in the future');
      }

      // Validate budget
      if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
        throw new Error('Please enter a valid budget amount');
      }

      // Convert budget to wei
      const budgetInWei = ethers.parseEther(amount);

      // Create the job
      console.log('Creating job with details:', {
        title,
        description,
        deadline: deadlineTimestamp,
        budget: budgetInWei.toString(),
        formattedDeadline: new Date(deadlineTimestamp * 1000).toLocaleString()
      });

      const tx = await contract.postJob(
        deadlineTimestamp,
        `${title}\n\n${description}`,
        { value: budgetInWei }
      );

      console.log('Transaction sent:', tx.hash);
      const receipt = await tx.wait();
      console.log('Transaction confirmed:', receipt);
      console.log('Full transaction receipt:', JSON.stringify(receipt, null, 2));

      // Log all events in the transaction
      console.log('All events in transaction:', receipt.logs.map((log: any) => ({
        address: log.address,
        topics: log.topics,
        data: log.data,
        fragment: log.fragment ? {
          name: log.fragment.name,
          inputs: log.fragment.inputs
        } : null
      })));

      // Get the job ID from the event
      const event = receipt.logs.find(
        (log: any) => {
          try {
            console.log('Checking log:', {
              address: log.address,
              topics: log.topics,
              fragment: log.fragment ? {
                name: log.fragment.name,
                inputs: log.fragment.inputs
              } : null
            });
            return log.fragment && log.fragment.name === 'JobPosted';
          } catch (err) {
            console.error('Error checking log:', err);
            return false;
          }
        }
      );
      
      if (!event) {
        console.error('No JobPosted event found in logs');
        // Instead of throwing error, just redirect to jobs list
        setSuccess(true);
        setTimeout(() => {
          router.push('/jobs');
        }, 2000);
        return;
      }

      const jobId = event.args[0];
      console.log('Job created with ID:', jobId);

      // Wait a moment for the blockchain to update
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Verify the job was created
      try {
        const jobExists = await contract.jobs(jobId);
        console.log('Job verification result:', jobExists);
        if (!jobExists) {
          console.error('Job verification failed - job does not exist');
          throw new Error('Job creation verification failed');
        }
      } catch (verifyErr) {
        console.error('Error verifying job creation:', verifyErr);
        // Still consider it a success and redirect
        setSuccess(true);
        setTimeout(() => {
          router.push('/jobs');
        }, 2000);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/jobs');
      }, 2000);
    } catch (err) {
      console.error('Error creating job:', err);
      if (err instanceof Error) {
        if (err.message.includes('insufficient funds')) {
          setError('Insufficient funds to create the job. Please ensure you have enough ETH for the budget and gas fees.');
        } else if (err.message.includes('user rejected')) {
          setError('Transaction was rejected. Please try again.');
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
                Title
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
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
              className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-400"
            >
              {loading ? 'Posting Job...' : 'Post Job'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
} 