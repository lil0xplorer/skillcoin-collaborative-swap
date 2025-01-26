import React, { useState } from 'react';
import { X } from 'lucide-react';
import { ethers } from 'ethers';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { CourseCategory } from '../types/course';

interface CreateCourseProps {
  onClose: () => void;
  walletAddress: string;
}

const CreateCourse: React.FC<CreateCourseProps> = ({ onClose, walletAddress }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image: '',
    instructor: '',
    duration: '',
    price: '0.00005',
    category: 'web3' as CourseCategory
  });

  const categories: CourseCategory[] = ['crypto', 'ai', 'creative', 'web3', 'business', 'dao', 'zk'];
  const SEPOLIA_ADDRESS = "0xb381e264D4e2501b8f7e46759461eAf78335f1cF";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!window.ethereum) {
      toast.error('Please install MetaMask to create a course');
      return;
    }

    try {
      setIsSubmitting(true);
      
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      toast.loading('Processing payment...');
      
      const tx = await signer.sendTransaction({
        to: SEPOLIA_ADDRESS,
        value: ethers.parseEther("0.02")
      });

      await tx.wait();
      
      const { error } = await supabase
        .from('courses')
        .insert({
          title: formData.title,
          description: formData.description,
          image: formData.image,
          instructor: formData.instructor,
          duration: formData.duration,
          price: formData.price,
          wallet_address: walletAddress,
          status: 'pending',
          category: formData.category
        });

      if (error) throw error;
      
      toast.dismiss();
      toast.success('Course submitted successfully! Your course will be reviewed by our team before being published. You will be notified once it is approved.');
      onClose();
      
      window.dispatchEvent(new Event('courseCreated'));
      
    } catch (error: any) {
      console.error('Error creating course:', error);
      toast.dismiss();
      if (error.message.includes('insufficient funds')) {
        toast.error('Insufficient Sepolia ETH. You need 0.02 ETH to create a course');
      } else {
        toast.error(error.message || 'Failed to create course');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="relative w-full max-w-2xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl">
        <div className="absolute -inset-[2px] bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl opacity-75 blur group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-gradient-xy"></div>
        
        <div className="relative bg-white dark:bg-gray-800 rounded-2xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Create New Course</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              Payment Address: <span className="font-mono">{SEPOLIA_ADDRESS}</span>
              <br />
              Fee: 0.02 Sepolia ETH
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Course Title
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Category
              </label>
              <select
                required
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as CourseCategory })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <textarea
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white h-32"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Image URL
              </label>
              <input
                type="url"
                required
                value={formData.image}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Instructor Name
              </label>
              <input
                type="text"
                required
                value={formData.instructor}
                onChange={(e) => setFormData({ ...formData, instructor: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Duration (e.g., "2 hours")
              </label>
              <input
                type="text"
                required
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg font-medium hover:from-indigo-600 hover:to-purple-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:-translate-y-0.5"
              >
                {isSubmitting ? 'Creating Course...' : 'Create Course (0.02 Sepolia ETH)'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateCourse;