import WhispersOfWordsSection from "@/components/home/WhispersOfWordsSection";
import { Helmet } from "react-helmet";

export default function WhispersOfWordsPage() {
  return (
    <>
      <Helmet>
        <title>Whispers of Words</title>
        <meta
          name="description"
          content="Genre-based collection of audiobooks and narrated novels."
        />
      </Helmet>
      <WhispersOfWordsSection />
    </>
  );
}
