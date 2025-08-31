import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Helmet } from "react-helmet";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight, CheckCircle } from "lucide-react";
import StoryBasicsStep from "@/components/publish/StoryBasicsStep";
import ChapterManagementStep from "../components/publish/ChapterManagementStep";
import PreviewPublishStep from "../components/publish/PreviewPublishStep";
import backgroundImage from "@/assets/813e6686-8d50-4721-a666-f810114a75f1_12-20-52.png";

interface StoryData {
  title: string;
  description: string;
  coverImage: string;
  genre: string[];
  authorName: string;
  placement?: string;
  collaborators: { id: string; fullName: string }[];
  chapters: {
    id: string;
    name: string;
    file: File;
    order: number;
  }[];
}

const STEPS = [
  { id: 1, title: "Story Basics", description: "Cover, title, description & genre" },
  { id: 2, title: "Chapters", description: "Upload and organize your chapters" },
  { id: 3, title: "Preview & Publish", description: "Review and publish your story" }
];

export default function PublishStoryWizardPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [, navigate] = useLocation();
  const [currentStep, setCurrentStep] = useState(1);
  const [storyData, setStoryData] = useState<StoryData>({
    title: "",
    description: "",
    coverImage: "",
    genre: [],
    authorName: "",
    placement: undefined,
    collaborators: [],
    chapters: []
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, isLoading, navigate]);

  // Initialize author name from user profile
  useEffect(() => {
    if (user && !storyData.authorName) {
      setStoryData(prev => ({
        ...prev,
        authorName: user.fullName || user.username || ""
      }));
    }
  }, [user, storyData.authorName]);

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-10">
        <div className="animate-pulse">
          <div className="w-1/3 h-8 bg-amber-200 rounded mb-4"></div>
          <div className="w-2/3 h-4 bg-amber-200 rounded mb-8"></div>
          <div className="w-full h-96 bg-amber-100 rounded"></div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  const progress = (currentStep / STEPS.length) * 100;

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const updateStoryData = (updates: Partial<StoryData>) => {
    setStoryData(prev => ({ ...prev, ...updates }));
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <StoryBasicsStep
            data={storyData}
            onUpdate={updateStoryData}
            onNext={handleNext}
          />
        );
      case 2:
        return (
          <ChapterManagementStep
            data={storyData}
            onUpdate={updateStoryData}
            onNext={handleNext}
            onPrevious={handlePrevious}
          />
        );
      case 3:
        return (
          <PreviewPublishStep
            data={storyData}
            onUpdate={updateStoryData}
            onPrevious={handlePrevious}
            user={user}
          />
        );
      default:
        return null;
    }
  };

  return (
    <>
      <Helmet>
        <title>Publish Your Story - NovelNexus</title>
        <meta name="description" content="Share your creative writing with the NovelNexus community." />
      </Helmet>
      
      <div
        className="bg-gradient-to-b from-amber-500/10 to-amber-50/10 min-h-screen pt-8 pb-16"
        style={{
          backgroundImage: `url(${backgroundImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat"
        }}
      >
        <div className="container mx-auto max-w-4xl px-4">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="font-cinzel text-3xl font-bold text-brown-dark mb-2">
              Publish Your Story
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Share your imagination with readers around the world
            </p>
          </div>

          {/* Progress Bar */}
          <Card className="mb-8">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between mb-4">
                <CardTitle className="text-lg">Step {currentStep} of {STEPS.length}</CardTitle>
                <span className="text-sm text-gray-500">{Math.round(progress)}% Complete</span>
              </div>
              <Progress value={progress} className="mb-4" />
              <div className="flex justify-between">
                {STEPS.map((step) => (
                  <div key={step.id} className="flex flex-col items-center flex-1">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${
                      step.id < currentStep 
                        ? "bg-green-500 text-white" 
                        : step.id === currentStep 
                        ? "bg-amber-500 text-white" 
                        : "bg-gray-200 text-gray-500"
                    }`}>
                      {step.id < currentStep ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        step.id
                      )}
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-medium">{step.title}</div>
                      <div className="text-xs text-gray-500">{step.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardHeader>
          </Card>

          {/* Current Step Content */}
          {renderCurrentStep()}
        </div>
      </div>
    </>
  );
}
