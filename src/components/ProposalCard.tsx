import React from 'react';
import { Clock, Check, X, PlayCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';

interface ProposalCardProps {
  id: string;
  title: string;
  description: string;
  creator_address?: string;
  start_time?: string;
  end_time?: string;
  yes_votes?: number;
  no_votes?: number;
  status?: string;
  onVote: (proposalId: string, support: boolean) => Promise<void>;
  onExecute: (proposalId: string) => Promise<void>;
}

export default function ProposalCard({
  id,
  title,
  description,
  creator_address = '',
  start_time = new Date().toISOString(),
  end_time = new Date().toISOString(),
  yes_votes = 0,
  no_votes = 0,
  status = 'active',
  onVote,
  onExecute,
}: ProposalCardProps) {
  const totalVotes = (yes_votes || 0) + (no_votes || 0);
  const yesPercentage = totalVotes > 0 ? Math.round(((yes_votes || 0) / totalVotes) * 100) : 0;
  const noPercentage = totalVotes > 0 ? Math.round(((no_votes || 0) / totalVotes) * 100) : 0;
  const isActive = status === 'active';
  const hasEnded = new Date() > new Date(end_time);

  const formatAddress = (address: string) => {
    if (!address) return 'Unknown';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const handleVote = async (support: boolean) => {
    try {
      if (hasEnded) {
        toast.error('Voting period has ended for this proposal');
        return;
      }

      if (!window.ethereum) {
        toast.error('Please install MetaMask to vote');
        return;
      }

      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const voterAddress = accounts[0];

      // First check if the user has already voted
      const { data: votes, error: votesError } = await supabase
        .from('votes')
        .select('*')
        .eq('proposal_id', id)
        .eq('voter_address', voterAddress);

      if (votesError) {
        console.error('Error checking votes:', votesError);
        toast.error('Error checking vote status');
        return;
      }

      // Check if any votes exist for this user
      if (votes && votes.length > 0) {
        toast.error('You have already voted on this proposal');
        return;
      }
      
      await onVote(id, support);
      toast.success(`Vote cast successfully!`);
    } catch (error) {
      console.error('Vote error:', error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Failed to cast vote');
      }
    }
  };

  const handleExecute = async () => {
    try {
      if (!hasEnded) {
        toast.error('Cannot execute proposal before voting period ends');
        return;
      }
      
      await onExecute(id);
      toast.success('Proposal executed successfully!');
    } catch (error) {
      console.error('Execute error:', error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Failed to execute proposal');
      }
    }
  };

  return (
    <div className="relative group">
      {/* Animated Background */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-1000 group-hover:duration-300 animate-gradient-xy"></div>
      
      {/* Main Card */}
      <div className="relative bg-opacity-50 backdrop-blur-sm bg-white dark:bg-gray-800/50 rounded-2xl overflow-hidden border border-gray-200/50 dark:border-gray-700/50 shadow-lg hover:shadow-xl transition-all duration-300">
        {/* Status Badge */}
        <div className="absolute top-4 right-4 z-10">
          {status === 'executed' ? (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
              <Check size={12} className="mr-1" />
              Executed
            </span>
          ) : hasEnded ? (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
              <Clock size={12} className="mr-1" />
              Ended
            </span>
          ) : (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
              <Clock size={12} className="mr-1" />
              Active
            </span>
          )}
        </div>

        <div className="p-6">
          {/* Header Section */}
          <div className="mb-6">
            <h3 className="text-2xl font-bold font-quicksand mb-3 text-gray-900 dark:text-gray-100 group-hover:bg-gradient-to-r group-hover:from-indigo-500 group-hover:to-purple-500 group-hover:text-transparent group-hover:bg-clip-text transition-all duration-300">
              {title}
            </h3>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center text-gray-600 dark:text-gray-400">
                <div className="w-6 h-6 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs mr-2">
                  {creator_address?.[0] || '?'}
                </div>
                <span className="font-quicksand">{formatAddress(creator_address)}</span>
              </div>
              <div className="flex items-center text-gray-500 dark:text-gray-400 font-quicksand">
                <Clock size={14} className="mr-1" />
                {hasEnded ? 'Ended' : 'Ends'} {new Date(end_time).toLocaleDateString()}
              </div>
            </div>
          </div>

          {/* Description */}
          <p className="text-gray-700 dark:text-gray-300 font-quicksand mb-8 leading-relaxed">
            {description}
          </p>

          {/* Voting Stats */}
          <div className="space-y-6">
            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-quicksand font-medium text-gray-700 dark:text-gray-300">
                  Voting Results
                </span>
                <span className="text-sm font-quicksand text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-md">
                  {totalVotes} total votes
                </span>
              </div>
              
              {/* Yes Votes */}
              <div className="mb-3">
                <div className="flex justify-between text-sm font-quicksand mb-1">
                  <span className="text-gray-600 dark:text-gray-400">Yes</span>
                  <span className="text-green-600 dark:text-green-400 font-medium">{yesPercentage}%</span>
                </div>
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-green-400 to-green-500 transition-all duration-500"
                    style={{ width: `${yesPercentage}%` }}
                  />
                </div>
              </div>

              {/* No Votes */}
              <div>
                <div className="flex justify-between text-sm font-quicksand mb-1">
                  <span className="text-gray-600 dark:text-gray-400">No</span>
                  <span className="text-red-600 dark:text-red-400 font-medium">{noPercentage}%</span>
                </div>
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-red-400 to-red-500 transition-all duration-500"
                    style={{ width: `${noPercentage}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            {isActive && !hasEnded && (
              <div className="flex gap-3">
                <button
                  onClick={() => handleVote(true)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-green-400 to-green-500 hover:from-green-500 hover:to-green-600 text-white rounded-xl font-quicksand transition-all duration-300 transform hover:-translate-y-0.5"
                >
                  <Check size={18} />
                  Support
                </button>
                <button
                  onClick={() => handleVote(false)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-red-400 to-red-500 hover:from-red-500 hover:to-red-600 text-white rounded-xl font-quicksand transition-all duration-300 transform hover:-translate-y-0.5"
                >
                  <X size={18} />
                  Reject
                </button>
              </div>
            )}

            {hasEnded && status !== 'executed' && yesPercentage > noPercentage && (
              <button
                onClick={handleExecute}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white rounded-xl font-quicksand transition-all duration-300 transform hover:-translate-y-0.5"
              >
                <PlayCircle size={18} />
                Execute Proposal
              </button>
            )}

            {status === 'executed' && (
              <div className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-xl font-quicksand">
                <Check size={18} className="text-green-500" />
                Proposal Executed
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}