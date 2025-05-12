'use client';

import React from 'react';
import { useWeb3 } from '../context/Web3Context';
import Link from 'next/link';
import { ethers } from 'ethers';

export default function Home() {
  const { account, connect } = useWeb3();

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
              <span className="block">Decentralized Freelancing</span>
              <span className="block text-blue-600">Powered by AI Verification</span>
            </h1>
            <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
              Post jobs, hire freelancers, and ensure quality work with our AI-powered verification system.
              All powered by blockchain technology for secure and transparent transactions.
            </p>
            <div className="mt-10 flex justify-center gap-4">
              {!account ? (
                <button
                  onClick={connect}
                  className="px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 md:py-4 md:text-lg md:px-10"
                >
                  Connect Wallet
                </button>
              ) : (
                <div className="flex gap-4">
                  <Link
                    href="/deposit"
                    className="px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 md:py-4 md:text-lg md:px-10"
                  >
                    Post a Job
                  </Link>
                  <Link
                    href="/jobs"
                    className="px-8 py-3 border border-blue-600 text-base font-medium rounded-md text-blue-600 bg-white hover:bg-blue-50 md:py-4 md:text-lg md:px-10"
                  >
                    Browse Jobs
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Why Choose Our Platform?
            </h2>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {/* Feature 1 */}
            <div className="relative p-6 bg-white rounded-lg shadow-sm border border-gray-100">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-md bg-blue-100 text-blue-600 mb-4">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900">Secure Escrow</h3>
                <p className="mt-2 text-base text-gray-500">
                  Funds are held securely in smart contracts until work is verified and approved.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="relative p-6 bg-white rounded-lg shadow-sm border border-gray-100">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-md bg-blue-100 text-blue-600 mb-4">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900">AI Verification</h3>
                <p className="mt-2 text-base text-gray-500">
                  Our AI system verifies work quality and ensures deliverables meet requirements.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="relative p-6 bg-white rounded-lg shadow-sm border border-gray-100">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-md bg-blue-100 text-blue-600 mb-4">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900">Fast Payments</h3>
                <p className="mt-2 text-base text-gray-500">
                  Instant payments upon work verification, powered by blockchain technology.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              How It Works
            </h2>
          </div>

          <div className="mt-16">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
              {/* Step 1 */}
              <div className="relative">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-600 text-white text-xl font-bold mb-4">
                    1
                  </div>
                  <h3 className="text-lg font-medium text-gray-900">Post a Job</h3>
                  <p className="mt-2 text-base text-gray-500">
                    Create a job listing with requirements and budget
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="relative">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-600 text-white text-xl font-bold mb-4">
                    2
                  </div>
                  <h3 className="text-lg font-medium text-gray-900">Choose Freelancer</h3>
                  <p className="mt-2 text-base text-gray-500">
                    Review applications and select the best freelancer
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="relative">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-600 text-white text-xl font-bold mb-4">
                    3
                  </div>
                  <h3 className="text-lg font-medium text-gray-900">Work Verification</h3>
                  <p className="mt-2 text-base text-gray-500">
                    AI system verifies the quality of submitted work
                  </p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="relative">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-600 text-white text-xl font-bold mb-4">
                    4
                  </div>
                  <h3 className="text-lg font-medium text-gray-900">Secure Payment</h3>
                  <p className="mt-2 text-base text-gray-500">
                    Funds are released upon work approval
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
