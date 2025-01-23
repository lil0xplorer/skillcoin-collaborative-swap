import { Button } from "@/components/ui/button";
import { Coins } from "lucide-react";

export const Navbar = () => {
  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-8">
          <a href="/" className="text-2xl font-bold text-primary">
            SkillShare DAO
          </a>
          <div className="hidden md:flex gap-6">
            <a href="#" className="text-accent hover:text-primary transition-colors">
              Explore
            </a>
            <a href="#" className="text-accent hover:text-primary transition-colors">
              Teach
            </a>
            <a href="#" className="text-accent hover:text-primary transition-colors">
              Community
            </a>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full">
            <Coins className="h-4 w-4 text-primary" />
            <span className="font-medium text-primary">1,234</span>
          </div>
          <Button>Connect Wallet</Button>
        </div>
      </div>
    </nav>
  );
};