import React, { useState, useEffect } from 'react';
import { BookOpen, Clock, Users, CheckCircle, Award, Star, StarHalf, PlayCircle } from 'lucide-react';

// Add a type for course categories
type CourseCategory = 'crypto' | 'ai' | 'creative' | 'web3' | 'business' | 'dao' | 'zk';

interface CourseCardProps {
  title: string;
  instructor: string;
  description: string;
  price: string;
  students: number;
  duration: string;
  image: string;
  onPurchase: () => Promise<void>;
  rating: string;
  reviews: number;
  isDarkMode: boolean;
  category: CourseCategory;
  continueLearningLink?: string;
}

const getCategoryColors = (category: CourseCardProps['category'], isDarkMode: boolean) => {
  switch (category) {
    case 'crypto':
      return {
        bg: isDarkMode ? 'bg-emerald-900/30' : 'bg-emerald-50',
        border: isDarkMode ? 'border-emerald-500/30' : 'border-emerald-200',
        text: isDarkMode ? 'text-emerald-400' : 'text-emerald-700',
        hover: isDarkMode ? 'hover:bg-emerald-800/40' : 'hover:bg-emerald-100',
        glow: isDarkMode ? 'shadow-emerald-500/20' : ''
      };
    case 'ai':
      return {
        bg: isDarkMode ? 'bg-sky-900/30' : 'bg-sky-50',
        border: isDarkMode ? 'border-sky-500/30' : 'border-sky-200',
        text: isDarkMode ? 'text-sky-400' : 'text-sky-700',
        hover: isDarkMode ? 'hover:bg-sky-800/40' : 'hover:bg-sky-100',
        glow: isDarkMode ? 'shadow-sky-500/20' : ''
      };
    case 'creative':
      return {
        bg: isDarkMode ? 'bg-orange-900/30' : 'bg-orange-50',
        border: isDarkMode ? 'border-orange-500/30' : 'border-orange-200',
        text: isDarkMode ? 'text-orange-400' : 'text-orange-700',
        hover: isDarkMode ? 'hover:bg-orange-800/40' : 'hover:bg-orange-100',
        glow: isDarkMode ? 'shadow-orange-500/20' : ''
      };
    case 'web3':
      return {
        bg: isDarkMode ? 'bg-purple-900/30' : 'bg-purple-50',
        border: isDarkMode ? 'border-purple-500/30' : 'border-purple-200',
        text: isDarkMode ? 'text-purple-400' : 'text-purple-700',
        hover: isDarkMode ? 'hover:bg-purple-800/40' : 'hover:bg-purple-100',
        glow: isDarkMode ? 'shadow-purple-500/20' : ''
      };
    case 'business':
      return {
        bg: isDarkMode ? 'bg-pink-900/30' : 'bg-pink-50',
        border: isDarkMode ? 'border-pink-500/30' : 'border-pink-200',
        text: isDarkMode ? 'text-pink-400' : 'text-pink-700',
        hover: isDarkMode ? 'hover:bg-pink-800/40' : 'hover:bg-pink-100',
        glow: isDarkMode ? 'shadow-pink-500/20' : ''
      };
    case 'dao':
      return {
        bg: isDarkMode ? 'bg-amber-900/30' : 'bg-amber-50',
        border: isDarkMode ? 'border-amber-500/30' : 'border-amber-200',
        text: isDarkMode ? 'text-amber-400' : 'text-amber-700',
        hover: isDarkMode ? 'hover:bg-amber-800/40' : 'hover:bg-amber-100',
        glow: isDarkMode ? 'shadow-amber-500/20' : ''
      };
    case 'zk':
      return {
        bg: isDarkMode ? 'bg-lime-900/30' : 'bg-lime-50',
        border: isDarkMode ? 'border-lime-500/30' : 'border-lime-200',
        text: isDarkMode ? 'text-lime-400' : 'text-lime-700',
        hover: isDarkMode ? 'hover:bg-lime-800/40' : 'hover:bg-lime-100',
        glow: isDarkMode ? 'shadow-lime-500/20' : ''
      };
    default:
      return {
        bg: isDarkMode ? 'bg-teal-900/30' : 'bg-teal-50',
        border: isDarkMode ? 'border-teal-500/30' : 'border-teal-200',
        text: isDarkMode ? 'text-teal-400' : 'text-teal-700',
        hover: isDarkMode ? 'hover:bg-teal-800/40' : 'hover:bg-teal-100',
        glow: isDarkMode ? 'shadow-teal-500/20' : ''
      };
  }
};

const CourseCard: React.FC<CourseCardProps> = ({
  title,
  instructor,
  description,
  price,
  students,
  duration,
  image,
  onPurchase,
  rating,
  reviews,
  isDarkMode,
  category,
  continueLearningLink,
}) => {
  const [isPurchasing, setPurchasing] = useState(false);
  const [purchased, setPurchased] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [progress, setProgress] = useState(0);

  const colors = getCategoryColors(category, isDarkMode);

  useEffect(() => {
    const checkPurchaseStatus = () => {
      const walletAddress = localStorage.getItem('walletAddress');
      if (walletAddress) {
        const purchasedCourses = JSON.parse(localStorage.getItem(`purchases_${walletAddress}`) || '[]');
        const isPurchased = purchasedCourses.some((course: any) => course.title === title);
        setPurchased(isPurchased);
      } else {
        setPurchased(false);
      }
    };

    checkPurchaseStatus();
    window.addEventListener('storage', checkPurchaseStatus);
    return () => window.removeEventListener('storage', checkPurchaseStatus);
  }, [title]);

  const handlePurchase = async () => {
    try {
      setPurchasing(true);
      setError(null);
      await onPurchase();
      setPurchased(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Purchase failed');
    } finally {
      setPurchasing(false);
    }
  };

  const handleMintCertificate = () => {
    window.location.href = 'https://www.google.com';
  };

  const updateProgress = () => {
    const walletAddress = localStorage.getItem('walletAddress');
    if (walletAddress) {
      const purchasedCourses = JSON.parse(localStorage.getItem(`purchases_${walletAddress}`) || '[]');
      const updatedCourses = purchasedCourses.map((course: any) => {
        if (course.title === title) {
          const newProgress = Math.min((course.progress || 0) + 20, 100);
          return { ...course, progress: newProgress };
        }
        return course;
      });
      localStorage.setItem(`purchases_${walletAddress}`, JSON.stringify(updatedCourses));
      
      // Trigger a storage event for Dashboard to update
      window.dispatchEvent(new Event('storage'));
    }
  };

  const handleContinueLearning = () => {
    let courseLink = '';
    switch(title) {
      case 'Web3 Development Fundamentals':
        courseLink = 'https://drive.google.com/drive/folders/1bAN42SqnDbMq93zxvNkW4ALSQy_M4dWV?usp=drive_link';
        break;
      case 'Smart Contract Security':
        courseLink = 'https://drive.google.com/drive/folders/1tGbs03oirCjKc7QctAvff7x-MxCtJkqK?usp=drive_link';
        break;
      case 'DeFi Protocol Design':
        courseLink = 'https://drive.google.com/drive/folders/14xwzF89HVHPQZ1tNwvVWJpzVc0X9Fh1q?usp=drive_link';
        break;
      default:
        courseLink = '#';
    }
    if (courseLink !== '#') {
      updateProgress();
      window.open(courseLink, '_blank');
    }
  };

  const cardStyles = {
    '--rotate': '132deg',
    '--card-height': '100%',
    '--card-width': '100%',
  } as React.CSSProperties;

  return (
    <div className="magic-card-container relative w-full" style={cardStyles}>
      <div
        className={`magic-card ${colors.bg} border ${colors.border} rounded-xl overflow-hidden 
          transition-all duration-300 hover:shadow-2xl ${colors.hover} ${colors.glow}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          transform: isHovered ? 'translateY(-10px) rotateX(2deg)' : 'none',
          transition: 'transform 0.3s ease-out',
        }}
      >
        <div className="relative overflow-hidden">
          <img
            src={image}
            alt={title}
            className="w-full h-48 object-cover transform transition-transform duration-700 hover:scale-110"
          />
          {purchased && (
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-indigo-600 to-purple-600 bg-opacity-90 flex items-center justify-center backdrop-blur-sm">
              <div className="text-white text-center transform transition-all duration-300 hover:scale-105">
                <CheckCircle size={48} className="mx-auto mb-2 animate-pulse-slow" />
                <p className="font-semibold text-xl">Course Purchased!</p>
                <p className="text-sm opacity-90">Check your dashboard to start learning</p>
              </div>
            </div>
          )}
        </div>
        <div className="p-6">
          <div className="flex items-center gap-2 mb-2 -ml-2">
            <BookOpen size={16} className={colors.text} />
            <span className={`text-sm font-medium ${colors.text}`}>
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </span>
          </div>
          <div className="flex items-center gap-1 mb-2">
            <div className="flex items-center">
              <Star size={16} className="text-yellow-400" fill="currentColor" />
              <span className={`ml-1 text-sm font-medium ${
                isDarkMode ? 'text-gray-200' : 'text-gray-900'
              }`}>
                {rating}
              </span>
            </div>
            <span className={`text-sm ${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              ({reviews.toLocaleString()} reviews)
            </span>
          </div>
          <h3 className={`text-xl font-semibold mb-2 ${
            isDarkMode ? 'text-gray-100' : 'text-gray-900'
          } hover:${colors.text} transition-colors duration-300`}>
            {title}
          </h3>
          <p className={`mb-4 line-clamp-2 hover:line-clamp-none transition-all duration-300 ${
            isDarkMode ? 'text-gray-300' : 'text-gray-600'
          }`}>
            {description}
          </p>
          
          <div className={`flex items-center gap-4 text-sm mb-4 ${
            isDarkMode ? 'text-gray-400' : 'text-gray-500'
          }`}>
            <div className={`flex items-center gap-1 hover:${colors.text} transition-colors`}>
              <Users size={16} />
              <span>{students} students</span>
            </div>
            <div className={`flex items-center gap-1 hover:${colors.text} transition-colors`}>
              <Clock size={16} />
              <span>{duration}</span>
            </div>
          </div>

          <div className="border-t border-opacity-10 pt-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full ${colors.bg} ${colors.text} flex items-center justify-center transform transition-transform hover:scale-110`}>
                  {instructor[0]}
                </div>
                <span className={`text-sm ${
                  isDarkMode ? 'text-gray-300 hover:text-gray-100' : 'text-gray-600'
                } hover:${colors.text} transition-colors`}>
                  {instructor}
                </span>
              </div>
              <div className={`${colors.text} font-semibold`}>
                {price} ETH
              </div>
            </div>

            {error && (
              <p className="text-red-500 text-sm mb-4 animate-pulse">{error}</p>
            )}

            <div className="flex flex-col gap-2">
              <button
                onClick={handlePurchase}
                disabled={isPurchasing || purchased}
                className={`button-3d w-full py-2 px-4 rounded-lg font-medium transition-all duration-300 ${
                  purchased
                    ? 'bg-green-500 text-white cursor-default'
                    : isPurchasing
                    ? 'bg-indigo-400 text-white cursor-wait'
                    : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-neon'
                }`}
              >
                {purchased
                  ? 'Purchased'
                  : isPurchasing
                  ? 'Processing...'
                  : 'Purchase Course'}
              </button>

              {purchased && (
                <button
                  onClick={handleContinueLearning}
                  className="button-3d w-full py-2 px-4 rounded-lg font-medium bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:shadow-neon flex items-center justify-center gap-2 transform transition-all duration-300 hover:-translate-y-0.5"
                >
                  <PlayCircle className="w-5 h-5 animate-pulse" />
                  Continue Learning
                </button>
              )}

              {purchased && (
                <button
                  onClick={handleMintCertificate}
                  className="button-3d w-full py-2 px-4 rounded-lg font-medium bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:shadow-neon flex items-center justify-center gap-2"
                >
                  <Award size={20} className="animate-float" />
                  Mint NFT Certificate
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseCard;