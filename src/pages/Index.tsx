import { Navbar } from "@/components/Navbar";
import { CourseCard } from "@/components/CourseCard";

const SAMPLE_COURSES = [
  {
    title: "Web3 Development Fundamentals",
    instructor: "Alex Thompson",
    description: "Learn the basics of blockchain development and Web3 integration",
    tokens: 500,
    category: "Development",
    imageUrl: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5",
  },
  {
    title: "Digital Art Masterclass",
    instructor: "Sarah Chen",
    description: "Master digital art creation using industry-standard tools",
    tokens: 300,
    category: "Design",
    imageUrl: "https://images.unsplash.com/photo-1547891654-e66ed7ebb968",
  },
  {
    title: "Financial Markets 101",
    instructor: "Michael Roberts",
    description: "Understanding cryptocurrency markets and trading basics",
    tokens: 400,
    category: "Finance",
    imageUrl: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3",
  },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5">
      <Navbar />
      <main className="container py-12">
        <div className="max-w-2xl mb-12">
          <h1 className="text-4xl font-bold mb-4">
            Learn, Teach, Earn in the Web3 Era
          </h1>
          <p className="text-xl text-accent">
            Join our decentralized learning community. Share your skills, earn tokens,
            and access valuable knowledge from experts worldwide.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {SAMPLE_COURSES.map((course) => (
            <CourseCard key={course.title} {...course} />
          ))}
        </div>
      </main>
    </div>
  );
};

export default Index;