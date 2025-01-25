import React, { useState, useEffect } from 'react';
import { GraduationCap, Vote, PlusCircle, LayoutDashboard, Menu, X, Sun, Moon, ChevronLeft, ChevronRight } from 'lucide-react';
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return false;
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const courses = [
    
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

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    if (isDarkMode) {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }
  };

  const handleVote = async (proposalId: string, support: boolean) => {
    if (!signer) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      const { data: existingVote } = await supabase
        .from('votes')
        .select('*')
        .eq('proposal_id', proposalId)
        .eq('voter_address', await signer.getAddress())
        .single();

      if (existingVote) {
        toast.error('You have already voted on this proposal');
        return;
      }

      const daoContract = new DAOContract(signer);
      
      const currentTime = Math.floor(Date.now() / 1000);
      const proposal = proposals.find(p => p.id === proposalId);
      
      if (!proposal) {
        throw new Error('Invalid proposal ID');
      }

      if (new Date(proposal.end_time).getTime() < Date.now()) {
        throw new Error('Voting period has ended');
      }

      const { error: voteError } = await supabase
        .from('votes')
        .insert([{
          proposal_id: proposalId,
          voter_address: await signer.getAddress(),
          support: support
        }]);

      if (voteError) {
        throw voteError;
      }

      const { error: updateError } = await supabase.rpc(
        support ? 'increment_yes_votes' : 'increment_no_votes',
        { proposal_id: proposalId }
      );

      if (updateError) {
        throw updateError;
      }

      await loadProposals();
      toast.success('Vote cast successfully!');
    } catch (error) {
      console.error('Error voting:', error);
      if (error instanceof Error) {
        toast.error(error.message);
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
    <div className={`min-h-screen ${isDarkMode ? 'dark bg-gray-900 text-white' : 'bg-gradient-to-b from-gray-50 to-gray-100'}`}>
      {/* Top Navigation - Only shows wallet connect and balance */}
      <nav className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} shadow-sm sticky top-0 z-10 border-b`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <GraduationCap size={32} className="text-indigo-600" />
              <span className={`text-xl font-bold font-lexend ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Antec
              </span>
            </div>
            
            <div className="flex items-center gap-4">
              <div className={`hidden md:block px-4 py-2 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg`}>
                <div className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>Balance</div>
                <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {balance ? `${parseFloat(balance).toFixed(4)} ETH` : '-'}
                </div>
              </div>
              <WalletConnect
                onConnect={handleWalletConnect}
                onDisconnect={handleWalletDisconnect}
                isConnected={!!walletAddress}
                connectedAddress={walletAddress}
              />
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className={`md:hidden p-2 rounded-md ${
                  isDarkMode 
                    ? 'text-gray-400 hover:text-white hover:bg-gray-700' 
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-200'
                } transition-colors`}
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className={`md:hidden border-t ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
            <div className="px-4 py-3 space-y-3">
              <button
                onClick={toggleTheme}
                className={`w-full flex items-center gap-2 px-4 py-2 ${isDarkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'} rounded-lg hover:bg-opacity-80 transition-colors`}
              >
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                {isDarkMode ? 'Light Mode' : 'Dark Mode'}
              </button>
              {walletAddress && (
                <>
                  <button
                    onClick={() => {
                      setShowCreateProposal(true);
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-100 rounded-lg hover:bg-opacity-80 transition-colors"
                  >
                    <PlusCircle size={20} />
                    Create Proposal
                  </button>
                  <button
                    onClick={() => {
                      setShowDashboard(true);
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2 bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-100 rounded-lg hover:bg-opacity-80 transition-colors"
                  >
                    <LayoutDashboard size={20} />
                    Dashboard
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Desktop Sidebar */}
      <div className="flex">
        <div className={`hidden md:block fixed inset-y-0 left-0 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-r shadow-lg pt-16`}>
          <div className="w-64 p-4 space-y-4">
            <button
              onClick={toggleTheme}
              className={`w-full flex items-center gap-2 px-4 py-2 ${isDarkMode ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-100 text-gray-900 hover:bg-gray-200'} rounded-lg transition-colors`}
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
              {isDarkMode ? 'Light Mode' : 'Dark Mode'}
            </button>
            {walletAddress && (
              <>
                <button
                  onClick={() => setShowCreateProposal(true)}
                  className="w-full flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-100 rounded-lg hover:bg-opacity-80 transition-colors"
                >
                  <PlusCircle size={20} />
                  Create Proposal
                </button>
                <button
                  onClick={() => setShowDashboard(true)}
                  className="w-full flex items-center gap-2 px-4 py-2 bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-100 rounded-lg hover:bg-opacity-80 transition-colors"
                >
                  <LayoutDashboard size={20} />
                  Dashboard
                </button>
              </>
            )}
          </div>
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={`absolute -right-3 top-1/2 transform -translate-y-1/2 ${isDarkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-600'} border rounded-full p-1 shadow-lg`}
          >
            {isSidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
          </button>
        </div>

        {/* Main Content */}
        <div className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'md:ml-64' : 'md:ml-0'}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Add Tab Switcher */}
            <div className="flex justify-center mb-8">
              <div className={`inline-flex rounded-lg p-1 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <button
                  onClick={() => setActiveTab('courses')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'courses'
                      ? isDarkMode
                        ? 'bg-gray-600 text-white'
                        : 'bg-white text-gray-900 shadow'
                      : isDarkMode
                        ? 'text-gray-300 hover:text-white'
                        : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Courses
                </button>
                <button
                  onClick={() => setActiveTab('governance')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'governance'
                      ? isDarkMode
                        ? 'bg-gray-600 text-white'
                        : 'bg-white text-gray-900 shadow'
                      : isDarkMode
                        ? 'text-gray-300 hover:text-white'
                        : 'text-gray-600 hover:text-gray-900'
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
        </div>
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