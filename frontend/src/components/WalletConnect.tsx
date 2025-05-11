'use client';

import React from 'react';
import { useWeb3 } from '../context/Web3Context';

export default function WalletConnect() {
  const { account, connect, disconnect, isConnecting, error } = useWeb3();

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="flex items-center space-x-4">
      {error && (
        <div className="text-red-500 text-sm">{error}</div>
      )}
      
      {account ? (
        <div className="flex items-center space-x-2">
          <div className="px-3 py-2 bg-gray-100 rounded-lg text-sm font-medium text-gray-700">
            {formatAddress(account)}
          </div>
          <button
            onClick={disconnect}
            className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
          >
            Disconnect
          </button>
        </div>
      ) : (
        <button
          onClick={connect}
          disabled={isConnecting}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            isConnecting
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isConnecting ? (
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Connecting...</span>
            </div>
          ) : (
            'Connect Wallet'
          )}
        </button>
      )}
    </div>
  );
} 