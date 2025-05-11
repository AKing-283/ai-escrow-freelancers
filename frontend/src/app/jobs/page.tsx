'use client';

import { useState, useEffect } from 'react';
import { useWeb3 } from '../../context/Web3Context';
import Link from 'next/link';
import { ethers } from 'ethers';

interface Job {
  id: number;
  title: string;
  description: string;
  budget: string;
  deadline: number;
  owner: string;
  status: string;
}

export default function Jobs() {
  const { account, contract, connect } = useWeb3();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchJobs = async () => {
    if (!contract) return;

    try {
      setLoading(true);
      setError(null);

      // Get all escrows (jobs)
      const allEscrows = await contract.getEscrowsByOwner(account);
      console.log('All jobs:', allEscrows);

      // Format jobs
      const formattedJobs = allEscrows.map((job: any) => ({
        id: job.id,
        title: job.title || 'Untitled Project',
        description: job.description || 'No description provided',
        budget: ethers.formatEther(job.amount),
        deadline: Number(job.releaseTime),
        owner: job.owner,
        status: job.released ? 'Completed' : 'Open'
      }));

      setJobs(formattedJobs);
    } catch (err) {
      console.error('Error fetching jobs:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch jobs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (contract) {
      fetchJobs();
    }
  }, [contract]);

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Available Freelance Jobs</h1>
          {account && (
            <Link
              href="/deposit"
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Post a New Job
            </Link>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        ) : jobs.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Jobs Available</h3>
            <p className="text-gray-600">
              There are no freelance jobs posted at the moment.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {jobs.map((job) => (
              <div key={job.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      job.status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {job.status}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-4 line-clamp-3">{job.description}</p>
                  <div className="flex justify-between items-center text-sm text-gray-500">
                    <span>Budget: {job.budget} ETH</span>
                    <span>Due: {new Date(job.deadline * 1000).toLocaleDateString()}</span>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">
                        Posted by: {job.owner.slice(0, 6)}...{job.owner.slice(-4)}
                      </span>
                      {account && job.status === 'Open' && (
                        <Link
                          href={`/jobs/${job.id}`}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          View Details
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 