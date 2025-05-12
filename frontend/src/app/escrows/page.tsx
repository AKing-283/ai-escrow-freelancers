'use client';

import { useState, useEffect } from 'react';
import { useWeb3 } from '../../context/Web3Context';
import Link from 'next/link';
import { ethers } from 'ethers';
import AIVerification from '../../components/AIVerification';

interface Escrow {
  id: number;
  owner: string;
  beneficiary: string;
  amount: string;
  releaseTime: number;
  released: boolean;
  title: string;
  description: string;
  submission: string;
  isVerified: boolean;
  isApproved: boolean;
  verificationExplanation: string;
}

export default function Escrows() {
  const { account, contract, connect } = useWeb3();
  const [escrows, setEscrows] = useState<Escrow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [releasingId, setReleasingId] = useState<number | null>(null);
  const [selectedEscrow, setSelectedEscrow] = useState<Escrow | null>(null);
  const [filter, setFilter] = useState<'all' | 'client' | 'freelancer'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'in-progress' | 'completed' | 'verified'>('all');

  const fetchEscrows = async () => {
    if (!contract || !account) return;

    try {
      setLoading(true);
      setError(null);

      // Get all jobs where the user is the owner
      const filter = contract.filters["JobPosted(address,uint96,uint96,string)"];
      console.log('Fetching jobs with filter:', filter);
      const events = await contract.queryFilter(filter);
      console.log('Found events:', events);
      
      // Format jobs from events
      const formattedJobs = await Promise.all(events.map(async (event: any) => {
        console.log('Processing event:', event);
        const details = await contract.getJobDetails(event.args.owner);
        console.log('Job details:', details);
        // Only include jobs where the current user is the owner
        if (details.owner.toLowerCase() === account.toLowerCase()) {
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
      }));

      // Filter out null values
      const filteredJobs = formattedJobs.filter(job => job !== null);
      console.log('Formatted jobs:', filteredJobs);
      setEscrows(filteredJobs);
    } catch (err) {
      console.error('Error fetching escrows:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch escrows');
    } finally {
      setLoading(false);
    }
  };

  const filteredEscrows = escrows.filter(escrow => {
    const isClient = account === escrow.owner;
    const isFreelancer = account === escrow.freelancer;
    
    // Role filter
    if (filter === 'client' && !isClient) return false;
    if (filter === 'freelancer' && !isFreelancer) return false;

    // Status filter
    if (statusFilter === 'all') return true;
    if (statusFilter === 'completed' && escrow.status === 'completed') return true;
    if (statusFilter === 'in-progress' && escrow.status === 'in-progress') return true;
    if (statusFilter === 'verified' && escrow.status === 'verified') return true;

    return true;
  });

  const handleRelease = async (escrowId: string) => {
    if (!contract) return;

    try {
      setReleasingId(escrowId);
      const tx = await contract.releaseFunds(escrowId);
      await tx.wait();
      await fetchEscrows();
    } catch (err) {
      console.error('Error releasing escrow:', err);
      setError(err instanceof Error ? err.message : 'Failed to release escrow');
    } finally {
      setReleasingId(null);
    }
  };

  const handleVerificationComplete = async (isApproved: boolean) => {
    if (selectedEscrow) {
      await fetchEscrows();
      setSelectedEscrow(null);
    }
  };

  useEffect(() => {
    if (account && contract) {
      fetchEscrows();
    }
  }, [account, contract]);

  if (!account) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-sm p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Connect Your Wallet</h2>
          <p className="text-gray-600 mb-6">
            Please connect your wallet to view your projects
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

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">My Projects</h1>
          <Link
            href="/deposit"
            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Create New Project
          </Link>
        </div>

        <div className="mb-6 flex flex-wrap gap-4 items-center">
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700">Role:</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as 'all' | 'client' | 'freelancer')}
              className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="all">All Projects</option>
              <option value="client">As Client</option>
              <option value="freelancer">As Freelancer</option>
            </select>
          </div>

          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700">Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'in-progress' | 'completed' | 'verified')}
              className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="in-progress">In Progress</option>
              <option value="verified">Verified</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        ) : filteredEscrows.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Projects Found</h3>
            <p className="text-gray-600">
              You haven't created or been assigned any projects matching your current filters.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredEscrows.map((escrow) => (
              <div key={escrow.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{escrow.title}</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {account === escrow.owner ? 'You are the client' : 'You are the freelancer'}
                      </p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      escrow.status === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : escrow.status === 'verified'
                        ? escrow.isApproved
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {escrow.status === 'completed'
                        ? 'Completed'
                        : escrow.status === 'verified'
                        ? escrow.isApproved
                          ? 'Approved'
                          : 'Rejected'
                        : 'In Progress'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Amount</p>
                      <p className="text-sm text-gray-900">{escrow.budget} ETH</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Deadline</p>
                      <p className="text-sm text-gray-900">
                        {new Date(escrow.deadline * 1000).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-500 mb-1">Description</p>
                    <p className="text-sm text-gray-900">{escrow.description}</p>
                  </div>

                  {escrow.submission && (
                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-500 mb-1">Submission</p>
                      <p className="text-sm text-gray-900">{escrow.submission}</p>
                    </div>
                  )}

                  {escrow.status === 'verified' && escrow.verificationExplanation && (
                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-500 mb-1">Verification Result</p>
                      <p className="text-sm text-gray-900">{escrow.verificationExplanation}</p>
                    </div>
                  )}

                  {!escrow.status === 'completed' && account === escrow.owner && escrow.status !== 'verified' && (
                    <button
                      onClick={() => setSelectedEscrow(escrow)}
                      className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                    >
                      Verify Work
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {selectedEscrow && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">Verify Work</h2>
                  <button
                    onClick={() => setSelectedEscrow(null)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <span className="sr-only">Close</span>
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <AIVerification
                  jobId={selectedEscrow.id}
                  clientDescription={selectedEscrow.description}
                  freelancerSubmission={selectedEscrow.submission}
                  onVerificationComplete={handleVerificationComplete}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 