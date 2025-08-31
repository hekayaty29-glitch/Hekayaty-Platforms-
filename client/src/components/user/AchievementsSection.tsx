import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy, BookOpen, PenTool, Star } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Achievement {
  id: string;
  title: string;
  description: string;
  progress: number; // 0-100
  icon: React.ReactNode;
  achieved: boolean;
}

interface AchievementsSectionProps {
  achievements?: Achievement[];
}

const defaultAchievements: Achievement[] = [
  {
    id: "first_story",
    title: "First Story Published",
    description: "Publish your first story on NovelNexus.",
    progress: 100,
    icon: <BookOpen className="h-6 w-6" />,
    achieved: true,
  },
  {
    id: "writing_10k",
    title: "10,000 Words Written",
    description: "Write a total of 10,000 words across your stories.",
    progress: 70,
    icon: <PenTool className="h-6 w-6" />,
    achieved: false,
  },
  {
    id: "community_helper",
    title: "Community Helper",
    description: "Leave 20 helpful comments on others' stories.",
    progress: 40,
    icon: <Star className="h-6 w-6" />,
    achieved: false,
  },
];

export default function AchievementsSection({ achievements = defaultAchievements }: AchievementsSectionProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {achievements.map((a) => (
        <Card key={a.id} className={cn("border-amber-500/40", a.achieved && "bg-amber-100/10")}>
          <CardContent className="p-4 flex gap-4 items-start">
            <div className={cn("p-3 rounded-full", a.achieved ? "bg-amber-500/20 text-amber-600" : "bg-gray-700 text-gray-300")}>{a.icon}</div>
            <div className="flex-1">
              <h3 className="font-semibold text-brown-dark">{a.title}</h3>
              <p className="text-sm text-gray-600 mb-2">{a.description}</p>
              <Progress value={a.progress} className="h-2" />
            </div>
            {a.achieved && <Trophy className="h-6 w-6 text-amber-500" />}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
