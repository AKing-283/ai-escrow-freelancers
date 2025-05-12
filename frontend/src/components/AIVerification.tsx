import { useState } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { ethers } from 'ethers';

interface AIVerificationProps {
  jobId: number;
  clientDescription: string;
  freelancerSubmission: string;
  onVerificationComplete: (isApproved: boolean) => void;
}

interface VerificationResult {
  isApproved: boolean;
  explanation: string;
  keyPoints: string[];
  qualityScore: number;
  requirementsMet: {
    requirement: string;
    met: boolean;
    explanation: string;
  }[];
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
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);

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
        keyPoints: result.keyPoints || [],
        qualityScore: result.qualityScore || 0,
        requirementsMet: result.requirementsMet || []
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
      
      <div className="space-y-6">
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Client Requirements</h4>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-gray-600 whitespace-pre-wrap">{clientDescription}</p>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Freelancer Submission</h4>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-gray-600 whitespace-pre-wrap">{freelancerSubmission}</p>
          </div>
        </div>

        {verificationResult && (
          <div className="space-y-4">
          <div className={`p-4 rounded-lg ${
            verificationResult.isApproved ? 'bg-green-50' : 'bg-red-50'
          }`}>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">
              {verificationResult.isApproved ? '✓ Task Approved' : '✗ Task Rejected'}
            </h4>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">Quality Score:</span>
                  <span className={`px-2 py-1 rounded-full text-sm font-medium ${
                    verificationResult.qualityScore >= 80 ? 'bg-green-100 text-green-800' :
                    verificationResult.qualityScore >= 60 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {verificationResult.qualityScore}%
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-700 mb-3">{verificationResult.explanation}</p>
              
              {verificationResult.keyPoints.length > 0 && (
                <div className="mt-3">
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Key Points:</h5>
                  <ul className="list-disc list-inside space-y-1">
                    {verificationResult.keyPoints.map((point, index) => (
                      <li key={index} className="text-sm text-gray-600">{point}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {verificationResult.requirementsMet.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h5 className="text-sm font-medium text-gray-700 mb-3">Requirements Analysis:</h5>
                <div className="space-y-3">
                  {verificationResult.requirementsMet.map((req, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className={`mt-1 h-4 w-4 rounded-full flex-shrink-0 ${
                        req.met ? 'bg-green-400' : 'bg-red-400'
                      }`} />
                      <div>
                        <p className="text-sm font-medium text-gray-700">{req.requirement}</p>
                        <p className="text-sm text-gray-500">{req.explanation}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
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