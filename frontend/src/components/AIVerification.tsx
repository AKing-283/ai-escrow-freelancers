import { useState } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { ethers } from 'ethers';

interface AIVerificationProps {
  jobId: number;
  clientDescription: string;
  freelancerSubmission: string;
  onVerificationComplete: (isApproved: boolean) => void;
}

export default function AIVerification({
  jobId,
  clientDescription,
  freelancerSubmission,
  onVerificationComplete,
}: AIVerificationProps) {
  const { contract } = useWeb3();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verificationResult, setVerificationResult] = useState<{
    isApproved: boolean;
    explanation: string;
  } | null>(null);

  const verifySubmission = async () => {
    if (!contract) return;

    try {
      setLoading(true);
      setError(null);

      // Call the contract's verifyAndRelease function
      const tx = await contract.verifyAndRelease(jobId);
      await tx.wait();

      // Get the verification result from the contract
      const result = await contract.getVerificationResult(jobId);
      
      setVerificationResult({
        isApproved: result.isApproved,
        explanation: result.explanation,
      });

      onVerificationComplete(result.isApproved);
    } catch (err) {
      console.error('Error during verification:', err);
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Task Verification</h3>
      
      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Client Requirements</h4>
          <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">{clientDescription}</p>
        </div>

        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Freelancer Submission</h4>
          <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">{freelancerSubmission}</p>
        </div>

        {verificationResult && (
          <div className={`p-4 rounded-lg ${
            verificationResult.isApproved ? 'bg-green-50' : 'bg-red-50'
          }`}>
            <h4 className="font-medium mb-2">
              {verificationResult.isApproved ? '✓ Task Approved' : '✗ Task Rejected'}
            </h4>
            <p className="text-sm">
              {verificationResult.explanation}
            </p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <button
          onClick={verifySubmission}
          disabled={loading}
          className={`w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors ${
            loading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Verifying...
            </span>
          ) : (
            'Verify Task Completion'
          )}
        </button>
      </div>
    </div>
  );
} 