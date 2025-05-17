'use client';

import { useState, useEffect } from 'react';
import { useWeb3 } from '../../context/Web3Context';
import { useUserRole } from '../../context/UserRoleContext';
import Link from 'next/link';
import { ethers } from 'ethers';
import { useRouter } from 'next/navigation';

interface Job {
  id: string;
  title: string;
  description: string;
  budget: string;
  deadline: number;
  owner: string;
  freelancer: string;
  status: 'open' | 'in_progress' | 'completed' | 'approved' | 'rejected';
  isApproved: boolean;
  isCompleted: boolean;
  isVerified: boolean;
}

type JobStatus = 'all' | 'open' | 'in_progress' | 'completed' | 'approved' | 'rejected';

export default function Jobs() {
  const router = useRouter();
  const { account, contract, connect } = useWeb3();
  const { role, isLoading: isRoleLoading } = useUserRole();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<JobStatus>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'deadline' | 'budget'>('deadline');
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

  // Redirect to role selection if no role is set
  useEffect(() => {
    if (!isRoleLoading && !role) {
      router.push('/select-role');
    }
  }, [role, isRoleLoading, router]);

  const fetchJobs = async () => {
    if (!contract || !account) return;

    try {
      setLoading(true);
      setError(null);

      // Get all JobPosted events
      const filter = contract.filters.JobPosted();
      console.log('Using filter:', filter);
      
      const events = await contract.queryFilter(filter);
      console.log('Found events:', events);

      const jobsWithDetails = await Promise.all(
        events.map(async (event) => {
          try {
            if (!('args' in event)) {
              console.error('Event does not have args:', event);
              return null;
            }
            const [owner, amount, deadline, description] = event.args;
            console.log('Processing event:', { owner, amount, deadline, description });
            
            // Get additional job details from contract
            const details = await contract.getJobDetails(owner);
            console.log('Job details:', details);

            // Determine job status
            let status: Job['status'] = 'open';
            const currentTime = Math.floor(Date.now() / 1000);
            const isExpired = Number(deadline) < currentTime;

            if (details.isCompleted) {
              status = 'completed';
            } else if (details.isVerified) {
              status = details.isApproved ? 'approved' : 'rejected';
            } else if (details.freelancer !== ethers.ZeroAddress) {
              status = isExpired ? 'rejected' : 'in_progress';
            } else if (isExpired) {
              status = 'rejected';
            }

            const budgetInEth = ethers.formatEther(amount);
            console.log('Budget in ETH:', budgetInEth);

            return {
              id: owner,
              title: description.split('\n')[0] || 'Untitled Job',
              description: description,
              budget: budgetInEth,
              deadline: Number(deadline),
              owner: owner,
              freelancer: details.freelancer,
              status,
              isApproved: details.isApproved,
              isCompleted: details.isCompleted,
              isVerified: details.isVerified
            };
          } catch (err) {
            console.error('Error processing job:', err);
            return null;
          }
        })
      );

      // Filter out null values and sort by deadline
      const validJobs = jobsWithDetails
        .filter((job): job is Job => job !== null)
        .sort((a, b) => a.deadline - b.deadline);

      // Filter jobs based on user role
      if (role === 'client') {
        // For clients, show their own jobs
        setJobs(validJobs.filter(job => job.owner === account));
      } else if (role === 'freelancer') {
        // For freelancers, show available jobs (not their own and not completed/verified)
        setJobs(validJobs.filter(job => 
          job.owner !== account && 
          job.status === 'open' && 
          !job.isCompleted && 
          !job.isVerified
        ));
      } else {
        // For others, show all jobs
        setJobs(validJobs);
      }
    } catch (err) {
      console.error('Error fetching jobs:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch jobs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [contract]);

  useEffect(() => {
    // Filter jobs based on selected status
    if (selectedStatus === 'all') {
      setFilteredJobs(jobs);
    } else {
      setFilteredJobs(jobs.filter(job => job.status === selectedStatus));
    }
  }, [selectedStatus, jobs]);

  const handleDeleteJob = async (jobId: string) => {
    if (!contract || !account) return;
    
    try {
      setDeleteLoading(jobId);
      const tx = await contract.deleteJob(jobId);
      await tx.wait();
      await fetchJobs(); // Refresh the jobs list
    } catch (err) {
      console.error('Error deleting job:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete job');
    } finally {
      setDeleteLoading(null);
    }
  };

  if (!account) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-sm p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Connect Your Wallet</h2>
          <p className="text-gray-600 mb-6">
            Please connect your wallet to view available jobs
          </p>
          <button
            onClick={connect}
            className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Connect Wallet
          </button>
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

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-sm">
          <div className="text-center text-red-600">
            <h2 className="text-2xl font-bold">Error</h2>
            <p className="mt-2">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {role === 'client' ? 'My Projects' : 'Available Jobs'}
          </h1>
          
          <div className="flex items-center space-x-4">
            {/* Create New Job Button - Only for clients */}
            {role === 'client' && (
              <button
                onClick={() => router.push('/deposit')}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
              >
                Create New Job
              </button>
            )}

            {/* Agent Analysis Link */}
            <Link
              href="/agent-analysis"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              View Agent Analysis
            </Link>

            {/* Status Filter Dropdown */}
            <div className="relative">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as JobStatus)}
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              >
                <option value="all">All Jobs</option>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No jobs found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredJobs.map((job) => (
              <div
                key={job.id}
                className="bg-white rounded-lg shadow-sm overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex justify-between items-start">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {job.title}
                    </h3>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        job.status === 'open'
                          ? 'bg-green-100 text-green-800'
                          : job.status === 'in_progress'
                          ? 'bg-blue-100 text-blue-800'
                          : job.status === 'completed'
                          ? 'bg-purple-100 text-purple-800'
                          : job.status === 'approved'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {job.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-4 line-clamp-3">
                    {job.description}
                  </p>
                  <div className="flex justify-between items-center text-sm text-gray-500">
                    <span>Budget: {job.budget} ETH</span>
                    <span>
                      Deadline:{' '}
                      {new Date(job.deadline * 1000).toLocaleDateString()}
                    </span>
                  </div>
                  {role === 'client' && job.owner === account && (
                    <div className="mt-4 flex justify-end">
                      <button
                        onClick={() => handleDeleteJob(job.id)}
                        disabled={deleteLoading === job.id}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        {deleteLoading === job.id ? 'Deleting...' : 'Delete Job'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 