export type CourseCategory = 'crypto' | 'ai' | 'creative' | 'web3' | 'business' | 'dao' | 'zk';

export interface Course {
  id: string;
  title: string;
  description: string;
  instructor: string;
  price: string;
  duration: string;
  image: string;
  wallet_address: string;
  status: string;
  category: CourseCategory;
  students?: number;
  created_at?: string;
  updated_at?: string;
}