-- Drop existing table if it exists to avoid conflicts
DROP TABLE IF EXISTS public.story_chapters CASCADE;

-- Create story_chapters table to support PDF and other file types
CREATE TABLE public.story_chapters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    story_id UUID REFERENCES public.stories(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    content TEXT, -- For text chapters
    file_url TEXT, -- For PDF/audio/image chapters
    file_type VARCHAR(20) DEFAULT 'text' CHECK (file_type IN ('text', 'pdf', 'audio', 'image')),
    chapter_order INTEGER NOT NULL,
    word_count INTEGER DEFAULT 0,
    is_published BOOLEAN DEFAULT TRUE,
    published_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add unique constraint
ALTER TABLE public.story_chapters ADD CONSTRAINT unique_story_chapter_order UNIQUE(story_id, chapter_order);

-- Create indexes for better performance
CREATE INDEX idx_story_chapters_story_id ON public.story_chapters(story_id);
CREATE INDEX idx_story_chapters_order ON public.story_chapters(chapter_order);

-- Enable RLS
ALTER TABLE public.story_chapters ENABLE ROW LEVEL SECURITY;

-- Create policy for viewing chapters
CREATE POLICY "Anyone can view published chapters" ON public.story_chapters
    FOR SELECT USING (is_published = true);

-- Create policy for authors to manage their chapters
CREATE POLICY "Authors can manage their story chapters" ON public.story_chapters
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.stories 
            WHERE id = story_id AND author_id = auth.uid()
        )
    );
