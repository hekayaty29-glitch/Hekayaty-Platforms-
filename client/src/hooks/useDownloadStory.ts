import { supabase } from "@/lib/supabase";

async function getAuthToken() {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token;
}

/**
 * Call from any component to register a story download and open the file.
 * @param storyId Story ID
 * @param downloadUrl Direct URL to the PDF/epub file
 */
export async function downloadStory(storyId: string, downloadUrl: string) {
  try {
    const token = await getAuthToken();
    await fetch(`/api/stories/${storyId}/download`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  } catch (err) {
    console.error('Failed to register download', err);
  } finally {
    window.open(downloadUrl, '_blank');
  }
}
