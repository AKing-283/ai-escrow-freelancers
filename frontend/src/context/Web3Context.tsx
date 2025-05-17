'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';
import WillEscrow from '../contracts/WillEscrow.json';

declare global {
  interface Window {
    ethereum: any;
  }
}

interface Web3ContextType {
  account: string | null;
  chainId: number | null;
  provider: ethers.BrowserProvider | null;
  contract: ethers.Contract | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  isConnecting: boolean;
  error: string | null;
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined);

export const Web3Provider = ({ children }: { children: React.ReactNode }) => {
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

  // Wallet connect/disconnect logic
  const connect = async () => {
    if (!window.ethereum) {
      setError('Please install MetaMask or another Web3 wallet');
      return;
    }
    setIsConnecting(true);
    setError(null);
    try {
      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await browserProvider.send('eth_requestAccounts', []);
      const network = await browserProvider.getNetwork();
      setAccount(accounts[0]);
      setChainId(Number(network.chainId));
      setProvider(browserProvider);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = () => {
    setAccount(null);
    setChainId(null);
    setProvider(null);
    setContract(null);
  };

  // Listen for wallet changes
  useEffect(() => {
    if (!window.ethereum) return;
    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) disconnect();
      else setAccount(accounts[0]);
    };
    const handleChainChanged = (chainId: string) => setChainId(Number(chainId));
    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);
    return () => {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum.removeListener('chainChanged', handleChainChanged);
    };
  }, []);

  // Auto-connect if already connected
  useEffect(() => {
    const checkConnection = async () => {
      if (window.ethereum) {
        try {
          const browserProvider = new ethers.BrowserProvider(window.ethereum);
          const accounts = await browserProvider.listAccounts();
          if (accounts.length > 0) {
            const accountAddress = typeof accounts[0] === 'string' ? accounts[0] : accounts[0].address;
            setAccount(accountAddress);
            const network = await browserProvider.getNetwork();
            setChainId(Number(network.chainId));
            setProvider(browserProvider);
          }
        } catch (err) {
          // ignore
        }
      }
    };
    checkConnection();
  }, []);

  // Contract instance
  useEffect(() => {
    const setupContract = async () => {
      if (provider && account) {
        try {
          // Ensure we have the ABI
          if (!WillEscrow || !WillEscrow.abi) {
            console.error('Contract ABI is missing:', WillEscrow);
            throw new Error('Contract ABI is not loaded');
          }

          const signer = await provider.getSigner();
          if (!signer) {
            throw new Error('Failed to get signer');
          }

          // Create contract instance
          const contractInstance = new ethers.Contract(
            CONTRACT_ADDRESS,
            WillEscrow.abi,
            signer
          );

          // Verify contract instance
          if (!contractInstance) {
            throw new Error('Failed to create contract instance');
          }

          // Verify postJob function exists
          if (typeof contractInstance.postJob !== 'function') {
            console.error('Contract functions:', Object.keys(contractInstance.functions));
            throw new Error('postJob function not found in contract');
          }

          console.log('Contract initialized successfully:', {
            address: contractInstance.target,
            functions: Object.keys(contractInstance.functions)
          });

          setContract(contractInstance);
        } catch (err) {
          console.error('Error setting up contract:', err);
          setError(err instanceof Error ? err.message : 'Failed to load contract');
          setContract(null);
        }
      } else {
        setContract(null);
      }
    };
    setupContract();
  }, [provider, account]);

  return (
    <Web3Context.Provider
      value={{
        account,
        chainId,
        provider,
        contract,
        connect,
        disconnect,
        isConnecting,
        error,
      }}
    >
      {children}
    </Web3Context.Provider>
  );
};

export function useWeb3() {
  const context = useContext(Web3Context);
  if (context === undefined) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
} 