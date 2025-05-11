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

  const fetchEscrows = async () => {
    if (!contract || !account) return;

    try {
      setLoading(true);
      setError(null);

      const ownerEscrows = await contract.getEscrowsByOwner(account);
      const beneficiaryEscrows = await contract.getEscrowsByBeneficiary(account);

      const formattedEscrows = [...ownerEscrows, ...beneficiaryEscrows].map((escrow: any) => ({
        id: escrow.id,
        owner: escrow.owner,
        beneficiary: escrow.beneficiary,
        amount: ethers.formatEther(escrow.amount),
        releaseTime: Number(escrow.releaseTime),
        released: escrow.released,
        title: escrow.title,
        description: escrow.description,
        submission: escrow.submission,
        isVerified: escrow.isVerified,
        isApproved: escrow.isApproved,
        verificationExplanation: escrow.verificationExplanation,
      }));

      setEscrows(formattedEscrows);
    } catch (err) {
      console.error('Error fetching escrows:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch escrows');
    } finally {
      setLoading(false);
    }
  };

  const handleRelease = async (escrowId: number) => {
    if (!contract) return;

    try {
      setReleasingId(escrowId);
      const tx = await contract.releaseEscrow(escrowId);
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

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        ) : escrows.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Projects Found</h3>
            <p className="text-gray-600">
              You haven't created or been assigned any projects yet.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {escrows.map((escrow) => (
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
                      escrow.released
                        ? 'bg-green-100 text-green-800'
                        : escrow.isVerified
                        ? escrow.isApproved
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {escrow.released
                        ? 'Completed'
                        : escrow.isVerified
                        ? escrow.isApproved
                          ? 'Approved'
                          : 'Rejected'
                        : 'In Progress'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Amount</p>
                      <p className="text-sm text-gray-900">{escrow.amount} ETH</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Deadline</p>
                      <p className="text-sm text-gray-900">
                        {new Date(escrow.releaseTime * 1000).toLocaleDateString()}
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

                  {escrow.isVerified && escrow.verificationExplanation && (
                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-500 mb-1">Verification Result</p>
                      <p className="text-sm text-gray-900">{escrow.verificationExplanation}</p>
                    </div>
                  )}

                  {!escrow.released && account === escrow.owner && !escrow.isVerified && (
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