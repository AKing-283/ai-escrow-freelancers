'use client';

import { useState, useEffect } from 'react';
import { useWeb3 } from '../../context/Web3Context';
import { useUserRole } from '../../context/UserRoleContext';
import { useRouter } from 'next/navigation';
import { ethers } from 'ethers';
import { EventLog } from 'ethers';

interface JobAnalysis {
  jobId: string;
  title: string;
  owner: string;
  freelancer: string;
  budget: string;
  deadline: number;
  submission: string;
  status: 'open' | 'in_progress' | 'completed' | 'approved' | 'rejected';
  analysis: {
    workQuality: number;
    meetingDeadline: boolean;
    communicationScore: number;
    technicalScore: number;
    overallAssessment: string;
    recommendation: 'approve' | 'reject';
    detailedFeedback: string;
    comparisonWithRequirements: {
      requirements: string[];
      met: boolean[];
      feedback: string[];
    };
    timeAnalysis: {
      deadline: number;
      submissionTime: number;
      timeDifference: number;
      onTime: boolean;
    };
  };
}

export default function AgentAnalysisPage() {
  const router = useRouter();
  const { account, contract, connect } = useWeb3();
  const { role, isLoading: isRoleLoading } = useUserRole();
  const [analyses, setAnalyses] = useState<JobAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'all' | 'week' | 'month'>('all');

  useEffect(() => {
    if (!isRoleLoading && !role) {
      router.push('/select-role');
    }
  }, [role, isRoleLoading, router]);

  useEffect(() => {
    const fetchAnalyses = async () => {
      if (!contract) return;

      try {
        setLoading(true);
        setError(null);

        // Get all JobPosted events
        const filter = contract.filters["JobPosted(address,uint96,uint96,string)"];
        const events = await contract.queryFilter(filter);

        const jobAnalyses = await Promise.all(
          events.map(async (event) => {
            try {
              const eventLog = event as EventLog;
              const [owner, amount, releaseTime, description] = eventLog.args || [];
              const jobDetails = await contract.getJobDetails(owner);

              // Only analyze jobs that have submissions
              if (!jobDetails.submission) return null;

              // Simulate AI agent analysis (replace with actual AI integration)
              const analysis = {
                workQuality: 0.85,
                meetingDeadline: true,
                communicationScore: 0.9,
                technicalScore: 0.88,
                overallAssessment: "The submitted work demonstrates high quality and attention to detail. The freelancer has met all requirements and delivered the work on time.",
                recommendation: jobDetails.isApproved ? 'approve' : 'reject',
                detailedFeedback: "Technical implementation is solid with good code organization and documentation. Communication was clear and professional throughout the project. The solution addresses all requirements effectively.",
                comparisonWithRequirements: {
                  requirements: description.split('\n').filter((line: string) => line.trim()),
                  met: [true, true, true], // Example: all requirements met
                  feedback: [
                    "Requirement 1: Implemented correctly with good documentation",
                    "Requirement 2: Completed with additional features",
                    "Requirement 3: Met all specifications"
                  ]
                },
                timeAnalysis: {
                  deadline: Number(releaseTime),
                  submissionTime: Math.floor(Date.now() / 1000), // Example: current time
                  timeDifference: 0, // Will be calculated
                  onTime: true
                }
              };

              // Calculate time difference
              analysis.timeAnalysis.timeDifference = 
                analysis.timeAnalysis.submissionTime - analysis.timeAnalysis.deadline;
              analysis.timeAnalysis.onTime = analysis.timeAnalysis.timeDifference <= 0;

              return {
                jobId: owner,
                title: description.split('\n')[0] || 'Untitled Job',
                owner,
                freelancer: jobDetails.freelancer,
                budget: ethers.formatEther(amount),
                deadline: Number(releaseTime),
                submission: jobDetails.submission,
                status: jobDetails.isCompleted ? 'completed' :
                        jobDetails.isVerified ? (jobDetails.isApproved ? 'approved' : 'rejected') :
                        jobDetails.freelancer !== ethers.ZeroAddress ? 'in_progress' : 'open',
                analysis
              };
            } catch (err) {
              console.error('Error processing job analysis:', err);
              return null;
            }
          })
        );

        const validAnalyses = jobAnalyses.filter((analysis): analysis is JobAnalysis => analysis !== null);
        setAnalyses(validAnalyses);
      } catch (err) {
        console.error('Error fetching analyses:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch analyses');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalyses();
  }, [contract]);

  const filteredAnalyses = analyses.filter(analysis => {
    if (selectedTimeframe === 'all') return true;
    const now = Math.floor(Date.now() / 1000);
    const weekAgo = now - 7 * 24 * 60 * 60;
    const monthAgo = now - 30 * 24 * 60 * 60;
    
    return selectedTimeframe === 'week' 
      ? analysis.deadline >= weekAgo
      : analysis.deadline >= monthAgo;
  });

  if (!account) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-sm">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900">Connect Your Wallet</h2>
            <p className="mt-2 text-gray-600">Please connect your wallet to view agent analyses</p>
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

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">AI Agent Analysis</h1>
          
          {/* Timeframe Filter */}
          <div className="relative">
            <select
              value={selectedTimeframe}
              onChange={(e) => setSelectedTimeframe(e.target.value as 'all' | 'week' | 'month')}
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
              <option value="all">All Time</option>
              <option value="week">Last Week</option>
              <option value="month">Last Month</option>
            </select>
          </div>
        </div>

        {filteredAnalyses.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900">No analyses found</h3>
            <p className="mt-2 text-gray-500">There are no job analyses for the selected timeframe.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {filteredAnalyses.map((analysis) => (
              <div key={analysis.jobId} className="bg-white rounded-lg shadow-sm overflow-hidden">
                {/* Job Header */}
                <div className="p-6 border-b border-gray-200">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">{analysis.title}</h2>
                      <p className="mt-1 text-sm text-gray-500">
                        Budget: {analysis.budget} ETH | 
                        Deadline: {new Date(analysis.deadline * 1000).toLocaleString()}
                      </p>
                    </div>
                    <span className={`px-3 py-1 text-sm font-semibold rounded-full ${
                      analysis.status === 'approved' ? 'bg-green-100 text-green-800' :
                      analysis.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {analysis.status.charAt(0).toUpperCase() + analysis.status.slice(1)}
                    </span>
                  </div>
                </div>

                {/* Analysis Scores */}
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-500">Work Quality</h4>
                      <p className="text-2xl font-semibold text-gray-900">
                        {Math.round(analysis.analysis.workQuality * 100)}%
                      </p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-500">Communication</h4>
                      <p className="text-2xl font-semibold text-gray-900">
                        {Math.round(analysis.analysis.communicationScore * 100)}%
                      </p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-500">Technical Score</h4>
                      <p className="text-2xl font-semibold text-gray-900">
                        {Math.round(analysis.analysis.technicalScore * 100)}%
                      </p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-500">Deadline Met</h4>
                      <p className="text-2xl font-semibold text-gray-900">
                        {analysis.analysis.meetingDeadline ? 'Yes' : 'No'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Requirements Comparison */}
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Requirements Analysis</h3>
                  <div className="space-y-4">
                    {analysis.analysis.comparisonWithRequirements.requirements.map((req, index) => (
                      <div key={index} className="flex items-start space-x-3">
                        <span className={`mt-1 flex-shrink-0 h-5 w-5 rounded-full ${
                          analysis.analysis.comparisonWithRequirements.met[index]
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {analysis.analysis.comparisonWithRequirements.met[index] ? '✓' : '✗'}
                        </span>
                        <div>
                          <p className="text-gray-900">{req}</p>
                          <p className="text-sm text-gray-500">
                            {analysis.analysis.comparisonWithRequirements.feedback[index]}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Time Analysis */}
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Time Analysis</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-500">Deadline</h4>
                      <p className="text-gray-900">
                        {new Date(analysis.analysis.timeAnalysis.deadline * 1000).toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-500">Submission Time</h4>
                      <p className="text-gray-900">
                        {new Date(analysis.analysis.timeAnalysis.submissionTime * 1000).toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-500">Time Difference</h4>
                      <p className="text-gray-900">
                        {Math.abs(analysis.analysis.timeAnalysis.timeDifference / 3600).toFixed(1)} hours
                        {analysis.analysis.timeAnalysis.timeDifference > 0 ? ' late' : ' early'}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-500">Status</h4>
                      <p className={`font-semibold ${
                        analysis.analysis.timeAnalysis.onTime ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {analysis.analysis.timeAnalysis.onTime ? 'On Time' : 'Delayed'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Final Assessment */}
                <div className="p-6 bg-gray-50">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Final Assessment</h3>
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-2">Overall Assessment</h4>
                      <p className="text-gray-900">{analysis.analysis.overallAssessment}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-2">Detailed Feedback</h4>
                      <p className="text-gray-900">{analysis.analysis.detailedFeedback}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        analysis.analysis.recommendation === 'approve'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {analysis.analysis.recommendation === 'approve' ? 'Approve' : 'Reject'}
                      </span>
                      <span className="text-gray-600">
                        {analysis.analysis.recommendation === 'approve'
                          ? 'Payment should be released to freelancer'
                          : 'Payment should be refunded to client'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 