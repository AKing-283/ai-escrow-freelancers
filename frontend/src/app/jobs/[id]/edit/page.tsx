'use client';

import { useState, useEffect } from 'react';
import { useWeb3 } from '@/context/Web3Context';
import { useUserRole } from '@/context/UserRoleContext';
import { useRouter } from 'next/navigation';
import { ethers } from 'ethers';

interface JobDetails {
  title: string;
  description: string;
  budget: string;
  deadline: number;
  owner: string;
  freelancer: string;
  isCompleted: boolean;
  isVerified: boolean;
  isApproved: boolean;
}

export default function EditJobPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { account, contract, connect } = useWeb3();
  const { role, isLoading: isRoleLoading } = useUserRole();
  const [jobDetails, setJobDetails] = useState<JobDetails | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchJobDetails = async () => {
      if (!contract || !account || !params.id) return;

      try {
        setLoading(true);
        setError(null);

        // First check if the job exists
        const jobExists = await contract.jobs(params.id);
        if (!jobExists) {
          throw new Error('Job not found');
        }

        // Get job details
        const details = await contract.getJobDetails(params.id);
        
        // Check if the current user is the job owner
        if (details.owner !== account) {
          throw new Error('You are not authorized to edit this job');
        }

        // Check if the job is already completed or verified
        if (details.isCompleted || details.isVerified) {
          throw new Error('Cannot edit a completed or verified job');
        }

        const [title, ...descParts] = details.description.split('\n\n');
        const description = descParts.join('\n\n');

        // Format the deadline for the datetime-local input
        const deadlineDate = new Date(Number(details.deadline) * 1000);
        const formattedDeadline = deadlineDate.toISOString().slice(0, 16);

        setJobDetails(details);
        setTitle(title);
        setDescription(description);
        setDeadline(formattedDeadline);
      } catch (err) {
        console.error('Error fetching job details:', err);
        if (err instanceof Error) {
          if (err.message.includes('Job not found')) {
            setError('This job no longer exists');
          } else if (err.message.includes('not authorized')) {
            setError('You are not authorized to edit this job');
          } else if (err.message.includes('completed or verified')) {
            setError('Cannot edit a completed or verified job');
          } else {
            setError(err.message);
          }
        } else {
          setError('Failed to fetch job details');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchJobDetails();
  }, [contract, params.id, account]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contract || !account || !jobDetails) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

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

      // Update the job
      console.log('Updating job with details:', {
        title,
        description,
        deadline: deadlineTimestamp,
        formattedDeadline: new Date(deadlineTimestamp * 1000).toLocaleString()
      });

      const tx = await contract.updateDeadline(
        params.id,
        deadlineTimestamp,
        `${title}\n\n${description}`
      );

      console.log('Transaction sent:', tx.hash);
      const receipt = await tx.wait();
      console.log('Transaction confirmed:', receipt);

      setSuccess(true);
      setTimeout(() => {
        router.push(`/jobs/${params.id}`);
      }, 2000);
    } catch (err) {
      console.error('Error updating job:', err);
      if (err instanceof Error) {
        if (err.message.includes('insufficient funds')) {
          setError('Insufficient funds to update the job. Please ensure you have enough ETH for gas fees.');
        } else {
          setError(err.message);
        }
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  if (!account) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-sm">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900">Connect Your Wallet</h2>
            <p className="mt-2 text-gray-600">Please connect your wallet to edit the job</p>
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

  if (isRoleLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-sm">
          <div className="text-center text-red-600">
            <h2 className="text-2xl font-bold">Error</h2>
            <p className="mt-2">{error}</p>
            <button
              onClick={() => router.push('/jobs')}
              className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Back to Jobs
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Edit Job</h1>
            <button
              onClick={() => router.push(`/jobs/${params.id}`)}
              className="text-blue-600 hover:text-blue-700"
            >
              Back to Job Details
            </button>
          </div>

          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-600">Job updated successfully! Redirecting...</p>
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
              <label htmlFor="deadline" className="block text-sm font-medium text-gray-700">
                New Deadline
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

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Current Job Details</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <p>Budget: {ethers.formatEther(jobDetails?.budget || '0')} ETH</p>
                <p>Current Deadline: {new Date(Number(jobDetails?.deadline || 0) * 1000).toLocaleString()}</p>
                <p>Status: {jobDetails?.isCompleted ? 'Completed' : jobDetails?.isVerified ? 'Verified' : 'Active'}</p>
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                saving
                  ? 'bg-blue-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
              }`}
            >
              {saving ? 'Updating Job...' : 'Update Job'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
} 