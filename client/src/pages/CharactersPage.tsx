import CharactersSection from "@/components/home/CharactersSection";
import { Helmet } from "react-helmet";

export default function CharactersPage() {
  return (
    <div className="min-h-screen bg-[#0b0704]">
      <Helmet>
        <title>Hekayaty Characters</title>
        <meta name="description" content="Explore all main and fan-submitted characters of Hekayaty." />
      </Helmet>
      <CharactersSection />
    </div>
  );
}
