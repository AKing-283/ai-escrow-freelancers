'use client';

import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../../context/Web3Context';
import { ethers } from 'ethers';

interface Project {
  id: string;
  title: string;
  description: string;
  budget: string;
  deadline: number;
  owner: string;
  freelancer: string;
  status: 'open' | 'completed' | 'verified' | 'in-progress';
  isApproved: boolean;
}

const ProjectsPage: React.FC = () => {
  const { account, contract } = useWeb3();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = async () => {
    if (!contract) return;

    try {
      setLoading(true);
      setError(null);

      // Get all jobs by listening to JobPosted events
      const filter = contract.filters["JobPosted(address,uint96,uint96,string)"];
      console.log('Fetching projects with filter:', filter);
      const events = await contract.queryFilter(filter);
      console.log('Found events:', events);
      
      // Format projects from events
      const formattedProjects = await Promise.all(events.map(async (event: any) => {
        console.log('Processing event:', event);
        const details = await contract.getJobDetails(event.args.owner);
        console.log('Project details:', details);
        return {
          id: event.args.owner,
          title: 'Project',
          description: details.description,
          budget: ethers.formatEther(details.amount),
          deadline: Number(details.releaseTime),
          owner: details.owner,
          freelancer: details.freelancer,
          status: (details.isCompleted
            ? 'completed'
            : details.isVerified
            ? 'verified'
            : details.freelancer !== ethers.ZeroAddress
            ? 'in-progress'
            : 'open') as 'completed' | 'verified' | 'in-progress' | 'open',
          isApproved: details.isApproved || false,
        };
      }));

      console.log('Formatted projects:', formattedProjects);
      setProjects(formattedProjects);
    } catch (err) {
      console.error('Error fetching projects:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (contract) {
      console.log('Contract available, fetching projects...');
      fetchProjects();
    } else {
      console.log('No contract available');
    }
  }, [contract]);

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">My Projects</h1>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        ) : projects.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Projects Found</h3>
            <p className="text-gray-600">
              You haven't created any projects yet.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <div key={project.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">{project.title}</h3>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      project.status === 'completed' ? 'bg-green-100 text-green-800' :
                      project.status === 'verified' ? (project.isApproved ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800') :
                      project.status === 'in-progress' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {project.status === 'completed' ? 'Completed' :
                       project.status === 'verified' ? (project.isApproved ? 'Approved' : 'Rejected') :
                       project.status === 'in-progress' ? 'In Progress' :
                       'Open'}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-4 line-clamp-3">{project.description}</p>
                  <div className="flex justify-between items-center text-sm text-gray-500">
                    <span>Budget: {project.budget} ETH</span>
                    <span>Due: {new Date(project.deadline * 1000).toLocaleDateString()}</span>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">
                        Freelancer: {project.freelancer === ethers.ZeroAddress ? 'Not assigned' : 
                          `${project.freelancer.slice(0, 6)}...${project.freelancer.slice(-4)}`}
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
};

export default ProjectsPage; 