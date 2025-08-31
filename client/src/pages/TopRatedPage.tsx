import { Helmet } from "react-helmet";
import BrowseStoriesPage from "./BrowseStoriesPage";

export default function TopRatedPage() {
  return (
    <>
      <Helmet>
        <title>Top Rated Stories - TaleKeeper</title>
        <meta name="description" content="Discover the highest rated stories on TaleKeeper" />
      </Helmet>
      <BrowseStoriesPage isTopRated={true} />
    </>
  );
}
