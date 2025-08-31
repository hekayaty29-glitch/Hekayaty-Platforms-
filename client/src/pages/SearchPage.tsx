import { Helmet } from 'react-helmet';
import { useLocation } from 'wouter';
import { useSearchStories, useSearchComics } from '@/hooks/useSearch';
import { Input } from '@/components/ui/input';
import { useState, useEffect } from 'react';
import StoryCard from '@/components/story/StoryCard';
import ComicCard from '@/components/comic/ComicCard';
import Container from '@/components/layout/Container';

export default function SearchPage() {
  const [loc, navigate] = useLocation();
  const initialQuery = (() => {
    const sp = new URLSearchParams(loc.split('?')[1] || '');
    return sp.get('query') || '';
  })();
  const [query, setQuery] = useState(initialQuery);

  // keep URL in sync with input
  useEffect(() => {
    navigate(`/search?query=${encodeURIComponent(query)}`, { replace: true });
  }, [query]);

  const { data: storyResults = [], isLoading: loadingStories } = useSearchStories(query);
  const { data: comicResults = [], isLoading: loadingComics } = useSearchComics(query);

  const loading = loadingStories || loadingComics;

  return (
    <>
      <Helmet>
        <title>Search - NovelNexus</title>
      </Helmet>

      <section className="py-20 px-4 bg-[#151008] min-h-screen text-amber-50">
        <Container>
          <div className="max-w-xl mx-auto mb-8">
            <Input
              placeholder="Search stories or comics..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full py-4 px-5 rounded-full bg-amber-50/10 placeholder-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {loading && <p className="text-center">Searching...</p>}

          {!loading && query.length > 1 && (
            <>
              <h2 className="font-cinzel text-2xl mb-4">Stories</h2>
              {storyResults.length === 0 && <p>No stories found.</p>}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-12">
                {storyResults.map((s) => (
                  <StoryCard key={s.id} story={s as any} />
                ))}
              </div>

              <h2 className="font-cinzel text-2xl mb-4">Comics</h2>
              {comicResults.length === 0 && <p>No comics found.</p>}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {comicResults.map((c) => (
                  <ComicCard key={c.id} comic={c as any} />
                ))}
              </div>
            </>
          )}
        </Container>
      </section>
    </>
  );
}
