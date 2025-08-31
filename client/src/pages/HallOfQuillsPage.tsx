import HallOfQuillsSection from "@/components/home/HallOfQuillsSection";
import { Helmet } from "react-helmet";

export default function HallOfQuillsPage() {
  return (
    <div className="min-h-screen bg-[#15100A]">
      <Helmet>
        <title>Hall of Quills - HEKAYATY</title>
        <meta name="description" content="Celebrate legendary writers and competition winners in the Hall of Quills." />
      </Helmet>
      <HallOfQuillsSection />
    </div>
  );
}
