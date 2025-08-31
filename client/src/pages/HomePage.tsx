import HeroSection from "@/components/home/HeroSection";
import HallOfQuillsSection from "@/components/home/HallOfQuillsSection";
import CharactersSection from "@/components/home/CharactersSection";
import MembershipSection from "@/components/home/MembershipSection";
import BeginJourney from "@/components/home/BeginJourney";
import HekayatyOriginals from "@/components/home/HekayatyOriginals";
import EpicComicsSection from "@/components/home/EpicComicsSection";

import SpecialStories from "@/components/home/SpecialStories";
import TalesOfProphetsSection from "@/components/home/TalesOfProphetsSection";
import TaleCraftSection from "@/components/home/TaleCraftSection";
import WritersGemsSection from "@/components/home/WritersGemsSection";

import AllStoriesSection from "@/components/home/AllStoriesSection";
import SectionDivider from "@/components/home/SectionDivider";
import WhispersOfWordsSection from "@/components/home/WhispersOfWordsSection";
import { Helmet } from "react-helmet";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#15100A]">
      <Helmet>
        <title>HEKAYATY - Discover, Read & Publish Fantasy Stories</title>
        <meta name="description" content="Discover magical worlds of stories on HEKAYATY. Read and publish fantasy novels, short stories, and more." />
      </Helmet>
      
      <div className="space-y-20">
        <HeroSection />
        <SectionDivider />
        <HallOfQuillsSection />
        <SectionDivider />
        <HekayatyOriginals />
        <SectionDivider />
        <EpicComicsSection />

        <SectionDivider />
        <WhispersOfWordsSection />
        <SectionDivider />
        <CharactersSection />
        <SectionDivider />
        <SpecialStories />
        <SectionDivider />
        <TaleCraftSection />
        <SectionDivider />
        <WritersGemsSection />
        <SectionDivider />
        <AllStoriesSection />
        <SectionDivider />
        <TalesOfProphetsSection />
        <SectionDivider />
        <MembershipSection />
        <SectionDivider />
        <BeginJourney />
      </div>
    </div>
  );
}
