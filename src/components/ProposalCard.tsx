import React from 'react';
import { Clock, Check, X, Users, Vote } from 'lucide-react';
import toast from 'react-hot-toast';

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
      await onVote(id, support);
      toast.success(`Vote cast successfully!`);
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Failed to cast vote');
      }
      console.error('Vote error:', error);
    }
  };

  const handleExecute = async () => {
    try {
      await onExecute(id);
      toast.success('Proposal executed successfully!');
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Failed to execute proposal');
      }
      console.error('Execute error:', error);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-500 mt-1">
              by {formatAddress(creator_address)}
            </p>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            status === 'active' ? 'bg-green-100 text-green-800' :
            status === 'executed' ? 'bg-blue-100 text-blue-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        </div>

        <p className="text-gray-600 mb-6">{description}</p>

        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <Clock size={16} />
              <span>Ends {new Date(end_time).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users size={16} />
              <span>{totalVotes} votes</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Yes ({yesPercentage}%)</span>
              <span>{yes_votes} votes</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 transition-all duration-500"
                style={{ width: `${yesPercentage}%` }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>No ({noPercentage}%)</span>
              <span>{no_votes} votes</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-red-500 transition-all duration-500"
                style={{ width: `${noPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {isActive && !hasEnded && (
          <div className="flex gap-4 mt-6">
            <button
              onClick={() => handleVote(true)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Check size={18} />
              Vote Yes
            </button>
            <button
              onClick={() => handleVote(false)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <X size={18} />
              Vote No
            </button>
          </div>
        )}

        {hasEnded && yesPercentage > 50 && status !== 'executed' && (
          <button
            onClick={handleExecute}
            className="w-full mt-6 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Vote size={18} />
            Execute Proposal
          </button>
        )}
      </div>
    </div>
  );
}