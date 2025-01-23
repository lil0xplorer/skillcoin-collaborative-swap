import React, { useState } from 'react';
import { BookOpen, Clock, Users, PlayCircle, Award, BookMarked, BarChart, Calendar, CheckCircle } from 'lucide-react';

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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden shadow-2xl">
        <div className="p-6 border-b flex justify-between items-center bg-gradient-to-r from-indigo-50 to-purple-50">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">My Learning Dashboard</h2>
            <p className="text-sm text-gray-600 mt-1">Track your progress and manage your learning journey</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex rounded-lg overflow-hidden border">
              <button
                onClick={() => setSelectedTab('courses')}
                className={`px-4 py-2 text-sm font-medium ${
                  selectedTab === 'courses'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                My Courses
              </button>
              <button
                onClick={() => setSelectedTab('stats')}
                className={`px-4 py-2 text-sm font-medium ${
                  selectedTab === 'stats'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                Statistics
              </button>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          {selectedTab === 'stats' ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, index) => (
                  <div key={index} className="bg-white rounded-xl border p-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-indigo-50 rounded-lg">
                        <stat.icon size={24} className="text-indigo-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">{stat.label}</p>
                        <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="bg-white rounded-xl border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Learning Timeline</h3>
                <div className="space-y-4">
                  {courses.map((course, index) => (
                    <div key={index} className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                        <Calendar size={20} className="text-indigo-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{course.title}</p>
                        <p className="text-sm text-gray-600">
                          Last accessed: {course.lastAccessed}
                        </p>
                      </div>
                      <div className="ml-auto">
                        <span className="text-sm font-medium text-gray-900">
                          {course.progress}% Complete
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : courses.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No courses purchased yet</h3>
              <p className="text-gray-500">Browse our courses and start your learning journey!</p>
            </div>
          ) : (
            <div className="grid gap-6">
              {courses.map((course, index) => (
                <div
                  key={index}
                  className="bg-white rounded-xl border shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="p-6">
                    <div className="flex gap-6">
                      <div className="w-48 h-32 flex-shrink-0">
                        <img
                          src={course.image}
                          alt={course.title}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      </div>
                      <div className="flex-grow">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="text-xl font-semibold text-gray-900">{course.title}</h3>
                          <span className="text-sm text-gray-500">
                            Last accessed: {course.lastAccessed || 'Never'}
                          </span>
                        </div>
                        <p className="text-gray-600 mb-4">{course.description}</p>
                        <div className="flex items-center gap-6">
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Users size={16} />
                            <span>By {course.instructor}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Clock size={16} />
                            <span>{course.duration}</span>
                          </div>
                          {course.certificate && (
                            <div className="flex items-center gap-2 text-sm text-green-600">
                              <Award size={16} />
                              <span>Certificate Earned</span>
                            </div>
                          )}
                        </div>
                        <div className="mt-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">
                              Progress: {course.progress}%
                            </span>
                            <button className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 transition-colors text-sm font-medium">
                              <PlayCircle size={16} />
                              Continue Learning
                            </button>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${course.progress}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="border-t px-6 py-4 bg-gray-50">
                    <h4 className="font-medium text-gray-900 mb-3">Course Modules</h4>
                    <div className="grid gap-2">
                      {course.modules.map((module, idx) => (
                        <div key={idx} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                              module.completed ? 'bg-green-100' : 'bg-gray-100'
                            }`}>
                              <CheckCircle size={14} className={
                                module.completed ? 'text-green-600' : 'text-gray-400'
                              } />
                            </div>
                            <span className="text-sm text-gray-700">{module.title}</span>
                          </div>
                          <span className="text-sm text-gray-500">{module.duration}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;