import TalesOfProphetsSection from "@/components/home/TalesOfProphetsSection";
import { Helmet } from "react-helmet";

export default function TalesProphetsPage() {
  return (
    <div className="min-h-screen bg-[#15100A] text-amber-50">
      <Helmet>
        <title>Tales of the Prophets and the Righteous</title>
        <meta name="description" content="Islamic stories for children – prophets, companions, and moral lessons." />
      </Helmet>
      <TalesOfProphetsSection />
    </div>
  );
}
