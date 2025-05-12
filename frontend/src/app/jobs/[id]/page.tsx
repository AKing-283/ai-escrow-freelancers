'use client';

import { useState, useEffect } from 'react';
import { useWeb3 } from '../../../context/Web3Context';
import { useUserRole } from '../../../context/UserRoleContext';
import { useRouter } from 'next/navigation';
import { ethers } from 'ethers';

interface JobDetails {
  owner: string;
  amount: string;
  releaseTime: number;
  isOpen: boolean;
  isCompleted: boolean;
  freelancer: string;
  description: string;
  submission: string;
  isVerified: boolean;
  isApproved: boolean;
}

interface AgentJustification {
  workQuality: number;
  meetingDeadline: boolean;
  communicationScore: number;
  technicalScore: number;
  overallAssessment: string;
  recommendation: 'approve' | 'reject';
  detailedFeedback: string;
}

export default function JobDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { account, contract, connect } = useWeb3();
  const { role, isLoading: isRoleLoading } = useUserRole();
  const [jobDetails, setJobDetails] = useState<JobDetails | null>(null);
  const [agentJustification, setAgentJustification] = useState<AgentJustification | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submission, setSubmission] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isRoleLoading && !role) {
      router.push('/select-role');
    }
  }, [role, isRoleLoading, router]);

  useEffect(() => {
    const fetchJobDetails = async () => {
      if (!contract || !params.id) return;

      try {
        setLoading(true);
        setError(null);

        // Get job details from contract
        const details = await contract.getJobDetails(params.id);
        console.log('Job details:', details);

        setJobDetails({
          owner: details.owner,
          amount: ethers.formatEther(details.amount),
          releaseTime: Number(details.releaseTime),
          isOpen: details.isOpen,
          isCompleted: details.isCompleted,
          freelancer: details.freelancer,
          description: details.description,
          submission: details.submission,
          isVerified: details.isVerified,
          isApproved: details.isApproved
        });

        // Simulate AI agent analysis (replace with actual AI integration)
        if (details.submission) {
          const mockAgentAnalysis: AgentJustification = {
            workQuality: 0.85,
            meetingDeadline: true,
            communicationScore: 0.9,
            technicalScore: 0.88,
            overallAssessment: "The submitted work demonstrates high quality and attention to detail. The freelancer has met all requirements and delivered the work on time.",
            recommendation: 'approve',
            detailedFeedback: "Technical implementation is solid with good code organization and documentation. Communication was clear and professional throughout the project. The solution addresses all requirements effectively."
          };
          setAgentJustification(mockAgentAnalysis);
        }
      } catch (err) {
        console.error('Error fetching job details:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch job details');
      } finally {
        setLoading(false);
      }
    };

    fetchJobDetails();
  }, [contract, params.id]);

  const handleSubmitWork = async () => {
    if (!contract || !submission) return;

    try {
      setIsSubmitting(true);
      setError(null);

      const tx = await contract.submitWork(submission);
      await tx.wait();

      // Refresh job details
      router.refresh();
    } catch (err) {
      console.error('Error submitting work:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit work');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyWork = async (isApproved: boolean) => {
    if (!contract) return;

    try {
      setIsSubmitting(true);
      setError(null);

      const tx = await contract.verifyWork(params.id, isApproved);
      await tx.wait();

      // Refresh job details
      router.refresh();
    } catch (err) {
      console.error('Error verifying work:', err);
      setError(err instanceof Error ? err.message : 'Failed to verify work');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!account) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-sm">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900">Connect Your Wallet</h2>
            <p className="mt-2 text-gray-600">Please connect your wallet to view job details</p>
            <button
              onClick={connect}
              className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Connect Wallet
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
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

  if (!jobDetails) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-sm">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900">Job Not Found</h2>
            <p className="mt-2 text-gray-600">The requested job could not be found</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {/* Job Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Job Details</h1>
                <p className="mt-1 text-gray-500">
                  Posted by: {jobDetails.owner.slice(0, 6)}...{jobDetails.owner.slice(-4)}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  jobDetails.isCompleted ? 'bg-green-100 text-green-800' :
                  jobDetails.isVerified ? (jobDetails.isApproved ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800') :
                  jobDetails.freelancer !== ethers.ZeroAddress ? 'bg-yellow-100 text-yellow-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {jobDetails.isCompleted ? 'Completed' :
                   jobDetails.isVerified ? (jobDetails.isApproved ? 'Approved' : 'Rejected') :
                   jobDetails.freelancer !== ethers.ZeroAddress ? 'In Progress' :
                   'Open'}
                </span>
                <span className="text-lg font-semibold text-gray-900">
                  {jobDetails.amount} ETH
                </span>
              </div>
            </div>
          </div>

          {/* Job Description */}
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Description</h2>
            <p className="text-gray-600 whitespace-pre-wrap">{jobDetails.description}</p>
          </div>

          {/* Work Submission */}
          {role === 'freelancer' && jobDetails.freelancer === account && !jobDetails.isCompleted && (
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Submit Work</h2>
              <textarea
                value={submission}
                onChange={(e) => setSubmission(e.target.value)}
                placeholder="Enter your work submission..."
                className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                onClick={handleSubmitWork}
                disabled={isSubmitting || !submission}
                className={`mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors ${
                  isSubmitting || !submission ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Work'}
              </button>
            </div>
          )}

          {/* Work Submission Display */}
          {jobDetails.submission && (
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Submitted Work</h2>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-600 whitespace-pre-wrap">{jobDetails.submission}</p>
              </div>
            </div>
          )}

          {/* AI Agent Analysis */}
          {agentJustification && (
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">AI Agent Analysis</h2>
              
              {/* Scores */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-500">Work Quality</h3>
                  <p className="text-2xl font-semibold text-gray-900">
                    {Math.round(agentJustification.workQuality * 100)}%
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-500">Communication</h3>
                  <p className="text-2xl font-semibold text-gray-900">
                    {Math.round(agentJustification.communicationScore * 100)}%
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-500">Technical Score</h3>
                  <p className="text-2xl font-semibold text-gray-900">
                    {Math.round(agentJustification.technicalScore * 100)}%
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-500">Deadline Met</h3>
                  <p className="text-2xl font-semibold text-gray-900">
                    {agentJustification.meetingDeadline ? 'Yes' : 'No'}
                  </p>
                </div>
              </div>

              {/* Overall Assessment */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Overall Assessment</h3>
                <p className="text-gray-600">{agentJustification.overallAssessment}</p>
              </div>

              {/* Detailed Feedback */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Detailed Feedback</h3>
                <p className="text-gray-600">{agentJustification.detailedFeedback}</p>
              </div>

              {/* Recommendation */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Recommendation</h3>
                <div className="flex items-center space-x-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    agentJustification.recommendation === 'approve' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {agentJustification.recommendation === 'approve' ? 'Approve' : 'Reject'}
                  </span>
                  <span className="text-gray-600">
                    {agentJustification.recommendation === 'approve'
                      ? 'Release payment to freelancer'
                      : 'Refund payment to client'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Verification Actions */}
          {role === 'client' && jobDetails.owner === account && jobDetails.submission && !jobDetails.isVerified && (
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Verify Work</h2>
              <div className="flex space-x-4">
                <button
                  onClick={() => handleVerifyWork(true)}
                  disabled={isSubmitting}
                  className={`flex-1 bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors ${
                    isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isSubmitting ? 'Processing...' : 'Approve & Release Payment'}
                </button>
                <button
                  onClick={() => handleVerifyWork(false)}
                  disabled={isSubmitting}
                  className={`flex-1 bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors ${
                    isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isSubmitting ? 'Processing...' : 'Reject & Refund'}
                </button>
              </div>
            </div>
          )}

          {/* Payment Status */}
          {jobDetails.isVerified && (
            <div className="p-6 bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Status</h2>
              <div className="flex items-center space-x-2">
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  jobDetails.isApproved 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {jobDetails.isApproved ? 'Payment Released' : 'Payment Refunded'}
                </span>
                <span className="text-gray-600">
                  {jobDetails.isApproved
                    ? `Payment of ${jobDetails.amount} ETH has been released to the freelancer`
                    : `Payment of ${jobDetails.amount} ETH has been refunded to the client`}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 