import React, { useState, useEffect } from 'react';
import { BookOpen, Clock, Users, CheckCircle, Award } from 'lucide-react';

interface CourseCardProps {
  title: string;
  instructor: string;
  description: string;
  price: string;
  students: number;
  duration: string;
  image: string;
  onPurchase: () => Promise<void>;
}

const CourseCard: React.FC<CourseCardProps> = ({
  title,
  instructor = 'Anonymous',
  description,
  price,
  students,
  duration,
  image,
  onPurchase
}) => {
  const [isPurchasing, setPurchasing] = useState(false);
  const [purchased, setPurchased] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isHovered, setIsHovered] = useState(false);

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

  return (
    <div className="nft transform transition-all duration-500 bg-gradient-to-b from-gray-800/50 to-gray-900/50 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden hover:border-white/20 hover:shadow-2xl hover:scale-[1.015] hover:brightness-110">
      <div className="main p-6">
        <img
          src={image}
          alt={title}
          className="tokenImage w-full h-64 object-cover rounded-lg mb-4 transition-transform duration-700 hover:scale-110"
        />
        
        <div className="flex items-center gap-2 mb-2">
          <BookOpen size={16} className="text-indigo-400" />
          <span className="text-sm font-medium text-indigo-400">Course</span>
        </div>

        <h3 className="text-xl font-semibold mb-2 text-white">{title}</h3>
        
        <p className="description text-gray-400 mb-4 line-clamp-2 hover:line-clamp-none transition-all duration-300">
          {description}
        </p>

        <div className="tokenInfo flex items-center justify-between text-sm text-gray-400 mb-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 hover:text-indigo-400 transition-colors">
              <Users size={16} />
              <span>{students} students</span>
            </div>
            <div className="flex items-center gap-1 hover:text-indigo-400 transition-colors">
              <Clock size={16} />
              <span>{duration}</span>
            </div>
          </div>
          <div className="price text-pink-400 font-bold">
            {price} ETH
          </div>
        </div>

        <div className="creator border-t border-white/10 pt-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="wrapper">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white flex items-center justify-center">
                  {instructor[0].toUpperCase()}
                </div>
              </div>
              <span className="text-gray-400 hover:text-indigo-400 transition-colors">
                {instructor}
              </span>
            </div>
          </div>

          {error && (
            <p className="text-red-500 text-sm mb-4 animate-pulse">{error}</p>
          )}

          <div className="flex flex-col gap-2">
            <button
              onClick={handlePurchase}
              disabled={isPurchasing || purchased}
              className={`w-full py-2 px-4 rounded-lg font-medium transition-all duration-300 ${
                purchased
                  ? 'bg-green-500 text-white cursor-default'
                  : isPurchasing
                  ? 'bg-indigo-400 text-white cursor-wait'
                  : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-lg hover:scale-105'
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
                onClick={() => window.location.href = 'https://www.google.com'}
                className="w-full py-2 px-4 rounded-lg font-medium bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:shadow-lg hover:scale-105 flex items-center justify-center gap-2"
              >
                <Award size={20} className="animate-bounce" />
                Mint NFT Certificate
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseCard;