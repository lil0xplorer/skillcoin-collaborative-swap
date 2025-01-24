import React from 'react';
import { Clock, Check, X, Users, Vote } from 'lucide-react';
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

      // Check if user has already voted using maybeSingle()
      const { data: existingVote, error: voteCheckError } = await supabase
        .from('votes')
        .select('*')
        .eq('proposal_id', id)
        .eq('voter_address', await window.ethereum.request({ method: 'eth_requestAccounts' }).then(accounts => accounts[0]))
        .maybeSingle();

      if (voteCheckError) {
        console.error('Error checking vote:', voteCheckError);
        toast.error('Error checking vote status');
        return;
      }

      if (existingVote) {
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
    <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow dark:bg-gray-800">
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              by {formatAddress(creator_address)}
            </p>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
            status === 'executed' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
            'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
          }`}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        </div>

        <p className="text-gray-600 dark:text-gray-300 mb-6">{description}</p>

        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <Clock size={16} />
              <span>
                {hasEnded ? 'Ended' : 'Ends'} {new Date(end_time).toLocaleDateString()}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Users size={16} />
              <span>{totalVotes} votes</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="dark:text-gray-300">Yes ({yesPercentage}%)</span>
              <span className="dark:text-gray-300">{yes_votes} votes</span>
            </div>
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 transition-all duration-500 ease-in-out"
                style={{ width: `${yesPercentage}%` }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="dark:text-gray-300">No ({noPercentage}%)</span>
              <span className="dark:text-gray-300">{no_votes} votes</span>
            </div>
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-red-500 transition-all duration-500 ease-in-out"
                style={{ width: `${noPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {isActive && !hasEnded && (
          <div className="flex gap-4 mt-6">
            <button
              onClick={() => handleVote(true)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors dark:bg-green-700 dark:hover:bg-green-600"
            >
              <Check size={18} />
              Vote Yes
            </button>
            <button
              onClick={() => handleVote(false)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors dark:bg-red-700 dark:hover:bg-red-600"
            >
              <X size={18} />
              Vote No
            </button>
          </div>
        )}

        {hasEnded && yesPercentage > 50 && status !== 'executed' && (
          <button
            onClick={handleExecute}
            className="w-full mt-6 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors dark:bg-blue-700 dark:hover:bg-blue-600"
          >
            <Vote size={18} />
            Execute Proposal
          </button>
        )}
      </div>
    </div>
  );
}