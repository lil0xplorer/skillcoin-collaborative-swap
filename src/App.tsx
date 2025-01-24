import React, { useState, useEffect } from 'react';
import { GraduationCap, Vote, PlusCircle, LayoutDashboard } from 'lucide-react';
import { ethers } from 'ethers';
import toast from 'react-hot-toast';
import WalletConnect from './components/WalletConnect';
import CourseCard from './components/CourseCard';
import Dashboard from './components/Dashboard';
import ProposalCard from './components/ProposalCard';
import CreateProposal from './components/CreateProposal';
import { supabase, retryOperation } from './lib/supabase';
import { DAOContract } from './contracts/DAOContract';

function App() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [showDashboard, setShowDashboard] = useState(false);
  const [showCreateProposal, setShowCreateProposal] = useState(false);
  const [purchasedCourses, setPurchasedCourses] = useState<any[]>([]);
  const [availableCourses, setAvailableCourses] = useState<any[]>([]);
  const [proposals, setProposals] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'courses' | 'governance'>('courses');

  const courses = [
    {
      title: "Web3 Development Fundamentals",
      instructor: "Alex Thompson",
      description: "Master blockchain development fundamentals, smart contracts, and Web3 technologies. Build real-world dApps and understand the core concepts of decentralized applications.",
      price: "0.00005",
      students: 156,
      duration: "6 hours",
      image: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
      modules: [
        { title: "Introduction to Web3", duration: "45 min", completed: false },
        { title: "Blockchain Fundamentals", duration: "1 hour", completed: false },
        { title: "Smart Contract Basics", duration: "1.5 hours", completed: false },
        { title: "Building Your First dApp", duration: "2 hours", completed: false },
        { title: "Web3 Security Best Practices", duration: "45 min", completed: false }
      ]
    },
    // ... (keep other course objects)
  ];

  useEffect(() => {
    loadCourses();
    loadProposals();
  }, []);

  useEffect(() => {
    if (walletAddress) {
      const savedCourses = localStorage.getItem(`purchases_${walletAddress}`);
      if (savedCourses) {
        setPurchasedCourses(JSON.parse(savedCourses));
      }
    }
  }, [walletAddress]);

  const loadCourses = async () => {
    try {
      const { data: approvedCourses, error } = await retryOperation(async () => {
        const response = await supabase
          .from('courses')
          .select('*')
          .eq('status', 'approved');
        
        if (response.error) {
          throw response.error;
        }
        
        return response;
      });

      if (error) throw error;

      // Combine approved courses with default courses
      const allCourses = [
        ...courses,
        ...(approvedCourses || []).map(course => ({
          ...course,
          price: course.price || '0.00005',
          students: Math.floor(Math.random() * 100) + 50,
          modules: [
            { title: "Introduction", duration: "45 min", completed: false },
            { title: "Core Concepts", duration: "1 hour", completed: false },
            { title: "Advanced Topics", duration: "1.5 hours", completed: false },
            { title: "Practical Application", duration: "2 hours", completed: false },
            { title: "Final Project", duration: "45 min", completed: false }
          ]
        }))
      ];

      setAvailableCourses(allCourses);
    } catch (error) {
      console.error('Error loading courses:', error);
      toast.error('Failed to load courses. Please try again later.');
      setAvailableCourses(courses);
    }
  };

  const loadProposals = async () => {
    try {
      const { data, error } = await supabase
        .from('proposals')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProposals(data || []);
    } catch (error) {
      console.error('Error loading proposals:', error);
      toast.error('Failed to load proposals');
    }
  };

  const handleWalletConnect = async (address: string, balance: string) => {
    setWalletAddress(address);
    setBalance(balance);
    
    if (window.ethereum) {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      setSigner(signer);
    }
  };

  const handleWalletDisconnect = () => {
    setWalletAddress(null);
    setBalance(null);
    setSigner(null);
    setShowDashboard(false);
  };

  const handlePurchaseCourse = async (course: any) => {
    if (!signer || !walletAddress) {
      throw new Error('Please connect your wallet first');
    }

    try {
      const tx = await signer.sendTransaction({
        to: course.walletAddress || walletAddress,
        value: ethers.parseEther(course.price),
      });

      await tx.wait();
      
      const updatedCourses = [...purchasedCourses, {
        ...course,
        progress: 0,
        lastAccessed: new Date().toLocaleDateString(),
        modules: course.modules || []
      }];
      
      setPurchasedCourses(updatedCourses);
      localStorage.setItem(`purchases_${walletAddress}`, JSON.stringify(updatedCourses));
      
      return tx;
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('insufficient funds')) {
          throw new Error('Insufficient funds in your wallet');
        }
      }
      throw error;
    }
  };

  const handleVote = async (proposalId: string, support: boolean) => {
    if (!signer) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      const daoContract = new DAOContract(signer);
      
      // Convert string ID to number and ensure it's valid
      const numericProposalId = parseInt(proposalId);
      if (isNaN(numericProposalId)) {
        throw new Error('Invalid proposal ID');
      }
      
      // First attempt the blockchain transaction
      const tx = await daoContract.vote(numericProposalId, support);
      
      // Wait for transaction confirmation
      const receipt = await tx.wait();
      
      if (receipt.status === 1) { // Transaction successful
        // Now update the database
        const voterAddress = await signer.getAddress();
        
        const { error: voteError } = await supabase
          .from('votes')
          .insert([{
            proposal_id: proposalId,
            voter_address: voterAddress,
            support: support,
          }]);

        if (voteError) {
          console.error('Database error:', voteError);
          // Even if database update fails, the blockchain vote was successful
          toast.success('Vote recorded on blockchain, but database update failed');
          return;
        }

        // Update the vote counts using stored procedures
        const { error: updateError } = await supabase.rpc(
          support ? 'increment_yes_votes' : 'increment_no_votes',
          { proposal_id: proposalId }
        );

        if (updateError) {
          console.error('Error updating vote counts:', updateError);
        }

        await loadProposals(); // Refresh the proposals list
        toast.success('Vote cast successfully!');
      }
    } catch (error) {
      console.error('Error voting:', error);
      if (error instanceof Error) {
        if (error.message.includes('Already voted')) {
          toast.error('You have already voted on this proposal');
        } else if (error.message.includes('Voting period ended')) {
          toast.error('Voting period has ended');
        } else {
          toast.error(error.message);
        }
      } else {
        toast.error('Failed to cast vote');
      }
    }
  };

  const handleExecuteProposal = async (proposalId: string) => {
    if (!signer) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      const daoContract = new DAOContract(signer);
      const tx = await daoContract.executeProposal(parseInt(proposalId));
      await tx.wait();

      const { error } = await supabase
        .from('proposals')
        .update({ status: 'executed' })
        .eq('id', proposalId);

      if (error) throw error;
      
      loadProposals();
      toast.success('Proposal executed successfully!');
    } catch (error) {
      console.error('Error executing proposal:', error);
      toast.error('Failed to execute proposal');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <nav className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <GraduationCap size={32} className="text-indigo-600" />
              <span className="text-xl font-bold text-gray-900">SkillShare DAO</span>
            </div>
            <div className="flex items-center gap-4">
              {walletAddress && (
                <>
                  <button
                    onClick={() => setShowCreateProposal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                  >
                    <PlusCircle size={20} />
                    Create Proposal
                  </button>
                  <button
                    onClick={() => setShowDashboard(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors"
                  >
                    <LayoutDashboard size={20} />
                    <span className="font-medium">Dashboard</span>
                    {purchasedCourses.length > 0 && (
                      <span className="bg-indigo-600 text-white text-xs px-2 py-1 rounded-full">
                        {purchasedCourses.length}
                      </span>
                    )}
                  </button>
                </>
              )}
              <div className="hidden md:block px-4 py-2 bg-gray-50 rounded-lg">
                <div className="text-sm font-medium text-gray-900">
                  Balance
                </div>
                <div className="text-sm text-gray-600">
                  {balance ? `${parseFloat(balance).toFixed(4)} ETH` : '-'}
                </div>
              </div>
              <WalletConnect
                onConnect={handleWalletConnect}
                onDisconnect={handleWalletDisconnect}
                isConnected={!!walletAddress}
                connectedAddress={walletAddress}
              />
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-center mb-8">
          <div className="flex rounded-lg overflow-hidden border">
            <button
              onClick={() => setActiveTab('courses')}
              className={`px-6 py-2 text-sm font-medium ${
                activeTab === 'courses'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              Courses
            </button>
            <button
              onClick={() => setActiveTab('governance')}
              className={`px-6 py-2 text-sm font-medium ${
                activeTab === 'governance'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              Governance
            </button>
          </div>
        </div>

        {activeTab === 'courses' ? (
          <>
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Learn, Teach, Earn
              </h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Join our decentralized learning community and earn tokens while sharing your knowledge.
                All courses are verified by the DAO and backed by smart contracts.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {availableCourses.map((course, index) => (
                <CourseCard
                  key={index}
                  {...course}
                  onPurchase={() => handlePurchaseCourse(course)}
                />
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Decentralized Governance
              </h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Participate in the future of our platform by creating and voting on proposals.
                Your voice matters in shaping our collective decisions.
              </p>
            </div>

            <div className="grid gap-8">
              {proposals.map((proposal) => (
                <ProposalCard
                  key={proposal.id}
                  {...proposal}
                  onVote={handleVote}
                  onExecute={handleExecuteProposal}
                />
              ))}
            </div>

            {proposals.length === 0 && (
              <div className="text-center py-12">
                <Vote size={48} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">No proposals yet</h3>
                <p className="text-gray-500">
                  Be the first to create a proposal and start the governance process!
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {showDashboard && (
        <Dashboard
          courses={purchasedCourses}
          onClose={() => setShowDashboard(false)}
        />
      )}

      {showCreateProposal && signer && (
        <CreateProposal
          onClose={() => setShowCreateProposal(false)}
          signer={signer}
        />
      )}
    </div>
  );
}

export default App;
