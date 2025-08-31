import { Helmet } from "react-helmet";
import React, { useState } from "react";
import { useAdmin } from "@/context/AdminContext";
import { useAdminAPI } from "@/context/AdminAPIContext";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function CommunityNewsPage() {
  const { isAdmin } = useAdmin();
  const { getNews, createNews, deleteNews } = useAdminAPI();
  const [form, setForm] = useState({ title: "", content: "" });
  const [communityNews, setCommunityNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Load news on component mount
  React.useEffect(() => {
    const loadNews = async () => {
      try {
        setLoading(true);
        const news = await getNews('community');
        setCommunityNews(news);
      } catch (error) {
        console.error('Failed to load community news:', error);
      } finally {
        setLoading(false);
      }
    };
    loadNews();
  }, [getNews]);

  if (!isAdmin) return <div className="p-8">Access denied</div>;

  const save = async () => {
    if (!form.title) return alert("Title required");
    try {
      await createNews({ ...form, type: 'community' });
      setForm({ title: "", content: "" });
      // Reload news after creating
      const news = await getNews('community');
      setCommunityNews(news);
    } catch (error) {
      console.error('Failed to create community news:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete article?")) {
      try {
        await deleteNews(id);
        // Reload news after deleting
        const news = await getNews('community');
        setCommunityNews(news);
      } catch (error) {
        console.error('Failed to delete community news:', error);
      }
    }
  };

  return (
    <div className="flex">
      <AdminSidebar />
      <main className="flex-1 p-8 bg-[#15100A] text-amber-50 min-h-screen">
        <Helmet>
          <title>Community News - Hekayaty Admin</title>
        </Helmet>
        <h1 className="text-3xl font-bold font-cinzel mb-6">Community News</h1>
        <div className="bg-amber-800/30 p-4 rounded mb-6 max-w-xl space-y-3">
          <Input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <textarea className="w-full p-2 rounded bg-amber-900 text-amber-50 h-32" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder="Content" />
          <Button onClick={save}>Publish</Button>
        </div>
        <ul className="space-y-4 max-w-3xl">
          {communityNews.map((n) => (
            <li key={n.id} className="bg-amber-800/20 p-4 rounded">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold text-lg">{n.title}</h3>
                <Button size="sm" variant="destructive" onClick={() => handleDelete(n.id)}>
                  Delete
                </Button>
              </div>
              <p className="text-sm text-amber-200 whitespace-pre-wrap">{n.content}</p>
              <p className="text-xs text-amber-400 mt-2">{new Date(n.created_at).toLocaleString()}</p>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
