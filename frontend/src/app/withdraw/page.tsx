'use client';

import { useState, useEffect } from 'react';
import { useWeb3 } from '../../context/Web3Context';
import { ethers, formatEther } from 'ethers';
import { formatDistanceToNow } from 'date-fns';

export default function Withdraw() {
  const { account, contract, connect } = useWeb3();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (contract && account) {
      loadJobs();
    }
  }, [contract, account]);

  const loadJobs = async () => {
    if (!contract || !account) {
      setError('Contract or account not initialized');
      return;
    }

    try {
      setError('');
      setLoading(true);

      // Get all jobs where the user is the freelancer
      const filter = contract.filters["JobPosted(address,uint96,uint96,string)"];
      console.log('Fetching jobs with filter:', filter);
      const events = await contract.queryFilter(filter);
      console.log('Found events:', events);
      
      // Format jobs from events
      const formattedJobs = await Promise.all(events.map(async (event: any) => {
        try {
          console.log('Processing event:', event);
          const details = await contract.getJobDetails(event.args.owner);
          console.log('Job details:', details);
          // Only include jobs where the current user is the freelancer
          if (details.freelancer.toLowerCase() === account.toLowerCase()) {
            return {
              id: event.args.owner,
              title: 'Project',
              description: details.description,
              budget: ethers.formatEther(details.amount),
              deadline: Number(details.releaseTime),
              owner: details.owner,
              freelancer: details.freelancer,
              status: details.isCompleted ? 'completed' : 
                     details.isVerified ? 'verified' :
                     details.freelancer !== ethers.ZeroAddress ? 'in-progress' : 'open',
              isApproved: details.isApproved
            };
          }
          return null;
        } catch (err) {
          console.error('Error processing event:', err);
          return null;
        }
      }));

      // Filter out null values
      const filteredJobs = formattedJobs.filter(job => job !== null);
      console.log('Formatted jobs:', filteredJobs);
      setJobs(filteredJobs);
    } catch (error: any) {
      console.error('Error loading jobs:', error);
      setError(error.message || 'Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  const handleRelease = async (owner: string) => {
    if (!contract || !account) {
      setError('Contract or account not initialized');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const tx = await contract.releaseFunds(owner);
      await tx.wait();
      setSuccess('Funds released successfully!');
      await loadJobs();
    } catch (error: any) {
      console.error('Error releasing funds:', error);
      setError(error.message || 'Error releasing funds');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Withdraw Funds</h1>
          {!account && (
            <button
              onClick={connect}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Connect Wallet
            </button>
          )}
        </div>

        {account && (
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold mb-4">Available Jobs</h2>
            
            {loading ? (
              <p className="text-gray-500">Loading jobs...</p>
            ) : jobs.length === 0 ? (
              <p className="text-gray-500">No jobs available for withdrawal.</p>
            ) : (
              <div className="space-y-4">
                {jobs.map((job, index) => (
                  <div
                    key={index}
                    className="border p-4 rounded-lg flex justify-between items-center"
                  >
                    <div>
                      <p className="font-medium">From: {job.owner}</p>
                      <p className="text-sm text-gray-600">
                        Amount: {job.budget} ETH
                      </p>
                      <p className="text-sm text-gray-600">
                        Deadline: {job.deadline}
                      </p>
                    </div>
                    {!job.isCompleted &&
                      job.deadline <= new Date().getTime() && (
                        <button
                          onClick={() => handleRelease(job.id)}
                          disabled={loading}
                          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:bg-gray-400"
                        >
                          {loading ? 'Processing...' : 'Release Funds'}
                        </button>
                      )}
                  </div>
                ))}
              </div>
            )}

            {error && (
              <div className="mt-4 p-4 bg-red-100 text-red-700 rounded">
                {error}
              </div>
            )}

            {success && (
              <div className="mt-4 p-4 bg-green-100 text-green-700 rounded">
                {success}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
} 