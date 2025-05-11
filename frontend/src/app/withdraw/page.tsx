'use client';

import { useState, useEffect } from 'react';
import { useWeb3 } from '../../context/Web3Context';
import { ethers, formatEther } from 'ethers';
import { formatDistanceToNow } from 'date-fns';

export default function Withdraw() {
  const { account, contract, connect } = useWeb3();
  const [escrows, setEscrows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (contract && account) {
      loadEscrows();
    }
  }, [contract, account]);

  const loadEscrows = async () => {
    try {
      // Get all escrows where the current user is the beneficiary
      if (!contract) return;
      const filter = contract.filters.Deposit(null, account);
      const events = await contract.queryFilter(filter as any);
      
      const escrowDetails = await Promise.all(
        events?.map(async (event: any) => {
          const details = await contract?.getEscrowDetails(event.args?.owner);
          return {
            owner: event.args?.owner,
            amount: formatEther(details.amount),
            releaseTime: new Date(details.releaseTime.toNumber() * 1000),
            released: details.released,
          };
        }) || []
      );

      setEscrows(escrowDetails);
    } catch (error) {
      console.error('Error loading escrows:', error);
    }
  };

  const handleRelease = async (owner: string) => {
    if (!contract || !account) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const tx = await contract.releaseFunds(owner);
      await tx.wait();
      setSuccess('Funds released successfully!');
      loadEscrows();
    } catch (error: any) {
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
            <h2 className="text-xl font-semibold mb-4">Available Escrows</h2>
            
            {escrows.length === 0 ? (
              <p className="text-gray-500">No escrows available for withdrawal.</p>
            ) : (
              <div className="space-y-4">
                {escrows.map((escrow, index) => (
                  <div
                    key={index}
                    className="border p-4 rounded-lg flex justify-between items-center"
                  >
                    <div>
                      <p className="font-medium">From: {escrow.owner}</p>
                      <p className="text-sm text-gray-600">
                        Amount: {escrow.amount} ETH
                      </p>
                      <p className="text-sm text-gray-600">
                        Release Time:{' '}
                        {formatDistanceToNow(escrow.releaseTime, {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                    {!escrow.released &&
                      escrow.releaseTime <= new Date() && (
                        <button
                          onClick={() => handleRelease(escrow.owner)}
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