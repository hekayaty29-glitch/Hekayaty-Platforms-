import SpecialStories from "@/components/home/SpecialStories";
import { Helmet } from "react-helmet";

export default function SpecialStoriesPage() {
  return (
    <>
      <Helmet>
        <title>Special Stories</title>
        <meta
          name="description"
          content="Discover top rated stories and curated collections chosen by our editors."
        />
      </Helmet>
      <SpecialStories />
    </>
  );
}
