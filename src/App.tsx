import React, { useState, useEffect } from 'react';
import { GraduationCap, Vote, PlusCircle, LayoutDashboard, Menu, X, Sun, Moon, ChevronLeft, ChevronRight } from 'lucide-react';
import { ethers } from 'ethers';
import toast from 'react-hot-toast';
import WalletConnect from './components/WalletConnect';
import CourseCard from './components/CourseCard';
import Dashboard from './components/Dashboard';
import ProposalCard from './components/ProposalCard';
import CreateProposal from './components/CreateProposal';
import CreateCourse from './components/CreateCourse';
import { supabase, retryOperation } from './lib/supabase';
import { DAOContract } from './contracts/DAOContract';
import { CourseCategory } from './types/course';

function App() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [showDashboard, setShowDashboard] = useState(false);
  const [showCreateProposal, setShowCreateProposal] = useState(false);
  const [showCreateCourse, setShowCreateCourse] = useState(false);
  const [purchasedCourses, setPurchasedCourses] = useState<any[]>([]);
  const [availableCourses, setAvailableCourses] = useState<any[]>([]);
  const [proposals, setProposals] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'courses' | 'governance'>('courses');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedMode = localStorage.getItem('darkMode');
      const isDark = savedMode !== null ? savedMode === 'true' : true;
      
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      
      return isDark;
    }
    return true;
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSubmittingProposal, setIsSubmittingProposal] = useState(false);

  const generateRating = () => {
    return (4 + Math.random()).toFixed(1);
  };

  useEffect(() => {
    loadCourses();
    loadProposals();
    
    const handleCourseCreated = () => {
      loadCourses();
    };

    window.addEventListener('courseCreated', handleCourseCreated);
    return () => {
      window.removeEventListener('courseCreated', handleCourseCreated);
    };
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

      const allCourses = (approvedCourses || []).map(course => ({
        ...course,
        price: course.price || '0.00005',
        students: Math.floor(Math.random() * 100) + 50,
        modules: [
          { title: "Introduction", duration: "45 min", completed: false },
          { title: "Core Concepts", duration: "1 hour", completed: false },
          { title: "Advanced Topics", duration: "1.5 hours", completed: false },
          { title: "Practical Application", duration: "2 hours", completed: false },
          { title: "Final Project", duration: "45 min", completed: false }
        ],
        rating: generateRating(),
        reviews: Math.floor(Math.random() * 500 + 100),
        category: course.category || determineCategory(course.title)
      }));

      setAvailableCourses(allCourses);
    } catch (error) {
      console.error('Error loading courses:', error);
      toast.error('Failed to load courses. Please try again later.');
      setAvailableCourses([]);
    }
  };

  const loadProposals = async () => {
    try {
      console.log('Fetching proposals...');
      const { data, error } = await supabase
        .from('proposals')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Proposals fetched:', data);
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
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem('darkMode', newMode.toString());
    if (newMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
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

  const handleCreateProposal = async (proposalData: any) => {
    if (!signer || !walletAddress) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      setIsSubmittingProposal(true);
      const daoContract = new DAOContract(signer);
      
      toast.loading('Creating proposal...');
      
      const tx = await daoContract.createProposal(
        proposalData.title,
        proposalData.description,
        proposalData.durationInDays,
        { value: ethers.parseEther("0.01") }
      );

      if (tx && tx.hash) {
        const receipt = await signer.provider?.waitForTransaction(tx.hash);
        
        if (receipt) {
          const endTime = new Date();
          endTime.setDate(endTime.getDate() + proposalData.durationInDays);

          const { error } = await supabase
            .from('proposals')
            .insert({
              title: proposalData.title,
              description: proposalData.description,
              creator_address: walletAddress,
              end_time: endTime.toISOString(),
              status: 'active'
            });

          if (error) throw error;
          
          await loadProposals();
          setShowCreateProposal(false);
          toast.dismiss();
          toast.success('Proposal created successfully! Fee paid: 0.01 Sepolia ETH');
        }
      }
      
    } catch (error: any) {
      console.error('Error creating proposal:', error);
      toast.dismiss();
      if (error.message.includes('insufficient funds')) {
        toast.error('Insufficient Sepolia ETH. You need 0.01 ETH to create a proposal');
      } else {
        toast.error(error.message || 'Failed to create proposal');
      }
    } finally {
      setIsSubmittingProposal(false);
    }
  };

  const determineCategory = (title: string): CourseCategory => {
    title = title.toLowerCase();
    if (title.includes('crypto') || title.includes('defi')) return 'crypto';
    if (title.includes('ai') || title.includes('machine learning')) return 'ai';
    if (title.includes('video') || title.includes('digital art')) return 'creative';
    if (title.includes('smart contract') || title.includes('nft')) return 'web3';
    if (title.includes('marketing') || title.includes('business')) return 'business';
    if (title.includes('dao') || title.includes('governance')) return 'dao';
    if (title.includes('zero knowledge') || title.includes('zk')) return 'zk';
    return 'web3';
  };

  const ParticleEffect = ({ index }: { index: number }) => {
    const randomSize = Math.random() * 3 + 1;
    const randomDelay = Math.random() * 5;
    
    return (
      <div
        className={`absolute w-${Math.ceil(randomSize)} h-${Math.ceil(randomSize)} 
          bg-gradient-to-r from-white/40 to-white/20 dark:from-white/30 dark:to-white/10 
          rounded-full animate-particle-float`}
        style={{
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          animationDelay: `${randomDelay}s`,
          transform: `scale(${randomSize})`,
          filter: 'blur(1px)',
        }}
      />
    );
  };

  return (
    <div className={`min-h-screen relative ${isDarkMode ? 'dark bg-[#121212]' : 'bg-gradient-to-b from-gray-50 to-gray-100'}`}>
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600/30 via-violet-500/20 to-fuchsia-500/30 animate-gradient-slow blur-3xl" />
          <div className="absolute inset-0 bg-gradient-to-tl from-blue-500/20 via-indigo-500/20 to-cyan-500/20 animate-gradient-xy blur-3xl" />
        </div>

        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-violet-600/30 dark:bg-violet-500/40 rounded-full mix-blend-multiply filter blur-3xl animate-float-slow" />
          <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-purple-600/30 dark:bg-purple-500/40 rounded-full mix-blend-multiply filter blur-3xl animate-float-delay" />
          <div className="absolute bottom-1/4 left-1/3 w-[600px] h-[600px] bg-fuchsia-600/30 dark:bg-fuchsia-500/40 rounded-full mix-blend-multiply filter blur-3xl animate-float" />
        </div>

        <div className="absolute inset-0">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-particle-float"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                width: `${Math.random() * 4 + 1}px`,
                height: `${Math.random() * 4 + 1}px`,
                background: `rgba(255, 255, 255, ${Math.random() * 0.3 + 0.2})`,
                borderRadius: '50%',
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${Math.random() * 10 + 15}s`
              }}
            />
          ))}
        </div>

        <div className={`absolute inset-0 ${
          isDarkMode ? 'bg-[#121212]/60' : 'bg-white/30'
        } backdrop-blur-[1px]`} />
      </div>

      <div className="relative z-20">
        <nav className={`${
          isDarkMode 
            ? 'border-gray-800 bg-[#121212]/70' 
            : 'border-gray-200 bg-white/70'
          } shadow-sm sticky top-0 z-30 border-b backdrop-blur-md transition-colors`}>
          <div className="max-w-7xl mx-auto pl-0">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center gap-2 -ml-12 sm:-ml-16">
                <GraduationCap 
                  size={38} 
                  className={`${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'} animate-float-slow`} 
                />
                <span 
                  className={`text-2xl font-bold font-lexend group ${
                    isDarkMode ? 'text-gray-100' : 'text-gray-900'
                  } hover:bg-gradient-to-r hover:from-indigo-500 hover:via-purple-500 hover:to-pink-500 hover:text-transparent hover:bg-clip-text transition-all duration-300`}
                >
                  <span className="inline-block animate-letter-bounce">A</span>
                  <span className="inline-block animate-letter-bounce [animation-delay:0.1s]">N</span>
                  <span className="inline-block animate-letter-bounce [animation-delay:0.2s]">T</span>
                  <span className="inline-block animate-letter-bounce [animation-delay:0.3s]">E</span>
                  <span className="inline-block animate-letter-bounce [animation-delay:0.4s]">C</span>
                </span>
              </div>
              
              <div className="flex items-center gap-4">
                <div className={`hidden md:block px-4 py-2 ${isDarkMode ? 'bg-[#1E1E1E]' : 'bg-gray-50'} rounded-lg`}>
                  <div className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>Balance</div>
                  <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
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
                      ? 'bg-[#1E1E1E] text-gray-300 hover:bg-[#2A2A2A] hover:text-gray-100' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300 hover:text-gray-900'
                  } transition-colors`}
                  aria-label="Toggle menu"
                >
                  {isMobileMenuOpen ? (
                    <X size={24} className={isDarkMode ? 'text-gray-300' : 'text-gray-700'} />
                  ) : (
                    <Menu size={24} className={isDarkMode ? 'text-gray-300' : 'text-gray-700'} />
                  )}
                </button>
              </div>
            </div>
          </div>

          {isMobileMenuOpen && (
            <div className={`md:hidden border-t ${isDarkMode ? 'border-gray-800 bg-[#121212]' : 'border-gray-200 bg-white'}`}>
              <div className="px-4 py-3 space-y-3">
                <button
                  onClick={toggleTheme}
                  className={`w-full flex items-center gap-2 px-4 py-2 ${
                    isDarkMode 
                      ? 'bg-[#1E1E1E] text-gray-300 hover:bg-[#2A2A2A]' 
                      : 'bg-gray-100 text-gray-900'
                  } rounded-lg hover:bg-opacity-80 transition-colors`}
                >
                  {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                  {isDarkMode ? 'Light Mode' : 'Dark Mode'}
                </button>
                {walletAddress && (
                  <>
                    <button
                      onClick={() => setShowCreateCourse(true)}
                      className={`w-full flex items-center gap-2 px-4 py-2 ${
                        isDarkMode 
                          ? 'bg-[#1E1E1E] text-gray-300 hover:bg-[#2A2A2A]' 
                          : 'bg-purple-100 text-purple-700'
                      } rounded-lg hover:bg-opacity-80 transition-colors`}
                    >
                      <PlusCircle size={20} />
                      Create Course
                    </button>
                    <button
                      onClick={() => {
                        setShowCreateProposal(true);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-2 px-4 py-2 ${
                        isDarkMode 
                          ? 'bg-[#1E1E1E] text-gray-300 hover:bg-[#2A2A2A]' 
                          : 'bg-green-100 text-green-700'
                      } rounded-lg hover:bg-opacity-80 transition-colors`}
                    >
                      <PlusCircle size={20} />
                      Create Proposal
                    </button>
                    <button
                      onClick={() => {
                        setShowDashboard(true);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-2 px-4 py-2 ${
                        isDarkMode 
                          ? 'bg-[#1E1E1E] text-gray-300 hover:bg-[#2A2A2A]' 
                          : 'bg-indigo-100 text-indigo-700'
                      } rounded-lg hover:bg-opacity-80 transition-colors`}
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

        <div className="flex">
          <div className={`hidden md:block fixed inset-y-0 left-0 transform ${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } transition-transform duration-300 ease-in-out ${
            isDarkMode ? 'bg-[#121212] border-gray-800' : 'bg-white border-gray-200'
          } border-r shadow-lg pt-16`}>
            <div className="w-64 p-4 space-y-4">
              <button
                onClick={toggleTheme}
                className={`w-full flex items-center gap-2 px-4 py-2 ${
                  isDarkMode 
                    ? 'bg-[#1E1E1E] text-gray-300 hover:bg-[#2A2A2A]' 
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                } rounded-lg transition-colors`}
              >
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                {isDarkMode ? 'Light Mode' : 'Dark Mode'}
              </button>
              {walletAddress && (
                <>
                  <button
                    onClick={() => setShowCreateCourse(true)}
                    className={`w-full flex items-center gap-2 px-4 py-2 ${
                      isDarkMode 
                        ? 'bg-[#1E1E1E] text-gray-300 hover:bg-[#2A2A2A]' 
                        : 'bg-purple-100 text-purple-700'
                    } rounded-lg hover:bg-opacity-80 transition-colors`}
                  >
                    <PlusCircle size={20} />
                    Create Course
                  </button>
                  <button
                    onClick={() => setShowCreateProposal(true)}
                    className={`w-full flex items-center gap-2 px-4 py-2 ${
                      isDarkMode 
                        ? 'bg-[#1E1E1E] text-gray-300 hover:bg-[#2A2A2A]' 
                        : 'bg-green-100 text-green-700'
                    } rounded-lg hover:bg-opacity-80 transition-colors`}
                  >
                    <PlusCircle size={20} />
                    Create Proposal
                  </button>
                  <button
                    onClick={() => setShowDashboard(true)}
                    className={`w-full flex items-center gap-2 px-4 py-2 ${
                      isDarkMode 
                        ? 'bg-[#1E1E1E] text-gray-300 hover:bg-[#2A2A2A]' 
                        : 'bg-indigo-100 text-indigo-700'
                    } rounded-lg hover:bg-opacity-80 transition-colors`}
                  >
                    <LayoutDashboard size={20} />
                    Dashboard
                  </button>
                </>
              )}
            </div>
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className={`absolute -right-3 top-1/2 transform -translate-y-1/2 ${
                isDarkMode 
                  ? 'bg-[#1E1E1E] text-gray-300 hover:bg-[#2A2A2A]' 
                  : 'bg-white text-gray-600'
              } border rounded-full p-1 shadow-lg`}
            >
              {isSidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
            </button>
          </div>

          <div className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'md:ml-64' : 'md:ml-0'}`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                    <h1 className={`text-6xl font-bold mb-6 tracking-tight font-lexend ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      A N T E C
                    </h1>
                    <p className={`text-lg font-light tracking-widest uppercase font-lexend ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      Elevate Your Digital Future
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {availableCourses.map((course, index) => (
                      <CourseCard
                        key={index}
                        {...course}
                        isDarkMode={isDarkMode}
                        onPurchase={() => handlePurchaseCourse(course)}
                      />
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <div className="text-center mb-12">
                    <h1 className={`text-5xl font-bold mb-6 tracking-tight font-lexend ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      G O V E R N A N C E
                    </h1>
                    <p className={`text-lg font-light tracking-widest uppercase font-lexend ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      Shape The Future Together
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
                      <Vote size={48} className={`mx-auto ${isDarkMode ? 'text-gray-600' : 'text-gray-400'} mb-4`} />
                      <h3 className={`text-xl font-semibold font-lexend mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        No proposals yet
                      </h3>
                      <p className={`font-lexend ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
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
            onSubmit={handleCreateProposal}
            isSubmitting={isSubmittingProposal}
            requiredFee="0.01"
            signer={signer}
          />
        )}

        {showCreateCourse && walletAddress && (
          <CreateCourse
            onClose={() => setShowCreateCourse(false)}
            walletAddress={walletAddress}
          />
        )}
      </div>
    </div>
  );
}

export default App;
