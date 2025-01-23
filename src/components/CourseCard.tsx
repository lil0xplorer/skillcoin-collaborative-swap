import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Coins } from "lucide-react";

interface CourseCardProps {
  title: string;
  instructor: string;
  description: string;
  tokens: number;
  category: string;
  imageUrl: string;
}

export const CourseCard = ({
  title,
  instructor,
  description,
  tokens,
  category,
  imageUrl,
}: CourseCardProps) => {
  return (
    <Card className="overflow-hidden transition-all duration-300 hover:animate-card-hover">
      <div className="aspect-video w-full overflow-hidden">
        <img
          src={imageUrl}
          alt={title}
          className="h-full w-full object-cover"
        />
      </div>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <Badge variant="secondary" className="text-xs">
            {category}
          </Badge>
          <div className="flex items-center gap-1 text-primary">
            <Coins className="h-4 w-4" />
            <span className="font-semibold">{tokens}</span>
          </div>
        </div>
        <h3 className="text-xl font-semibold mb-2">{title}</h3>
        <p className="text-sm text-accent mb-4">{description}</p>
        <div className="text-sm text-accent">
          Instructor: <span className="font-medium">{instructor}</span>
        </div>
      </div>
    </Card>
  );
};