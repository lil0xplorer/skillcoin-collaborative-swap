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
  instructor = 'Anonymous', // Add default value
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

  const handleMintCertificate = () => {
    window.location.href = 'https://www.google.com';
  };

  // Get instructor initial safely
  const instructorInitial = instructor && instructor.length > 0 ? instructor[0].toUpperCase() : 'A';

  return (
    <div
      className="course-card bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden transition-all duration-500 hover:shadow-2xl"
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
        <div className="flex items-center gap-2 mb-2">
          <BookOpen size={16} className="text-indigo-600" />
          <span className="text-sm font-medium gradient-text">Course</span>
        </div>
        <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white hover:gradient-text transition-colors duration-300">
          {title}
        </h3>
        <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-2 hover:line-clamp-none transition-all duration-300">
          {description}
        </p>
        
        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-4">
          <div className="flex items-center gap-1 hover:text-indigo-600 transition-colors">
            <Users size={16} />
            <span>{students} students</span>
          </div>
          <div className="flex items-center gap-1 hover:text-indigo-600 transition-colors">
            <Clock size={16} />
            <span>{duration}</span>
          </div>
        </div>

        <div className="border-t dark:border-gray-700 pt-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white flex items-center justify-center transform transition-transform hover:scale-110">
                {instructorInitial}
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                {instructor}
              </span>
            </div>
            <div className="text-indigo-600 dark:text-indigo-400 font-semibold">
              {price} ETH
            </div>
          </div>

          {error && (
            <p className="text-red-500 dark:text-red-400 text-sm mb-4 animate-pulse">{error}</p>
          )}

          <div className="flex flex-col gap-2">
            <button
              onClick={handlePurchase}
              disabled={isPurchasing || purchased}
              className={`button-3d w-full py-2 px-4 rounded-lg font-medium transition-all duration-300 ${
                purchased
                  ? 'bg-green-500 text-white cursor-default dark:bg-green-600'
                  : isPurchasing
                  ? 'bg-indigo-400 text-white cursor-wait dark:bg-indigo-500'
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
  );
};

export default CourseCard;