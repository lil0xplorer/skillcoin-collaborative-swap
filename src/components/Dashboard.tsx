import React, { useState } from 'react';
import { BookOpen, Clock, Users, PlayCircle, Award, BookMarked, BarChart, Calendar, CheckCircle, ChevronRight, X } from 'lucide-react';

interface PurchasedCourse {
  title: string;
  instructor: string;
  description: string;
  progress: number;
  duration: string;
  image: string;
  lastAccessed?: string;
  modules: {
    title: string;
    duration: string;
    completed: boolean;
  }[];
  certificate?: {
    issued: string;
    id: string;
  };
}

interface DashboardProps {
  courses: PurchasedCourse[];
  onClose: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ courses, onClose }) => {
  const [selectedTab, setSelectedTab] = useState<'courses' | 'stats'>('courses');
  const completedCourses = courses.filter(course => course.progress === 100);
  const totalProgress = courses.length > 0
    ? courses.reduce((acc, course) => acc + course.progress, 0) / courses.length
    : 0;
  const totalHours = courses.reduce((acc, course) => {
    const hours = parseInt(course.duration.split(' ')[0]);
    return acc + hours;
  }, 0);

  const stats = [
    { label: 'Courses Enrolled', value: courses.length, icon: BookMarked },
    { label: 'Completed Courses', value: completedCourses.length, icon: CheckCircle },
    { label: 'Total Hours', value: `${totalHours}h`, icon: Clock },
    { label: 'Average Progress', value: `${Math.round(totalProgress)}%`, icon: BarChart },
  ];

  const getCourseLink = (courseTitle: string) => {
    switch(courseTitle) {
      case 'Web3 Development Fundamentals':
        return 'https://drive.google.com/drive/folders/1bAN42SqnDbMq93zxvNkW4ALSQy_M4dWV?usp=drive_link';
      case 'Smart Contract Security':
        return 'https://drive.google.com/drive/folders/1tGbs03oirCjKc7QctAvff7x-MxCtJkqK?usp=drive_link';
      case 'DeFi Protocol Design':
        return 'https://drive.google.com/drive/folders/14xwzF89HVHPQZ1tNwvVWJpzVc0X9Fh1q?usp=drive_link';
      default:
        return '#';
    }
  };

  const updateProgress = (courseTitle: string) => {
    const walletAddress = localStorage.getItem('walletAddress');
    if (walletAddress) {
      const purchasedCourses = JSON.parse(localStorage.getItem(`purchases_${walletAddress}`) || '[]');
      const updatedCourses = purchasedCourses.map((course: any) => {
        if (course.title === courseTitle) {
          const newProgress = Math.min((course.progress || 0) + 20, 100);
          return { ...course, progress: newProgress };
        }
        return course;
      });
      localStorage.setItem(`purchases_${walletAddress}`, JSON.stringify(updatedCourses));
      
      // Trigger a storage event to update both components
      window.dispatchEvent(new Event('storage'));
    }
  };

  const handleContinueLearning = (course: PurchasedCourse) => {
    const courseLink = getCourseLink(course.title);
    if (courseLink !== '#') {
      updateProgress(course.title);
      window.open(courseLink, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="relative w-full max-w-4xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl">
        {/* Animated gradient border */}
        <div className="absolute -inset-[2px] bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl opacity-75 blur group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-gradient-xy"></div>
        
        <div className="relative bg-white dark:bg-gray-800 rounded-2xl p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold font-quicksand bg-gradient-to-r from-indigo-500 to-purple-500 text-transparent bg-clip-text">
              My Learning Dashboard
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          {/* Course Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {courses.map((course, index) => (
              <div
                key={index}
                className="group bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-all duration-200"
              >
                {/* Course Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {course.title}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      by {course.instructor}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {course.duration}
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Progress
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {course.progress || 0}%
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
                      style={{ width: `${course.progress || 0}%` }}
                    />
                  </div>
                </div>

                {/* Modules List */}
                <div className="space-y-3 mb-4">
                  {course.modules?.map((module: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg group-hover:bg-gray-100 dark:group-hover:bg-gray-800 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <BookOpen className="w-4 h-4 text-indigo-500" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {module.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {module.duration}
                        </span>
                        {module.completed ? (
                          <Award className="w-4 h-4 text-green-500" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Continue Button */}
                <button 
                  className="w-full py-2 px-4 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white rounded-lg font-medium transition-all duration-200 transform hover:-translate-y-0.5"
                  onClick={() => handleContinueLearning(course)}
                >
                  Continue Learning
                </button>
              </div>
            ))}
          </div>

          {courses.length === 0 && (
            <div className="text-center py-12">
              <BookOpen className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                No courses yet
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Purchase your first course to start learning
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
