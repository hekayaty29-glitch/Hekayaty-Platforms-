import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import { useAdmin } from "@/context/AdminContext";
import { useAdminAPI, LegendaryCharacter } from "@/context/AdminAPIContext";
import AdminOnly from "@/components/auth/AdminOnly";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, ImagePlus } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function MeetLegendsPage() {
  const { isAdmin } = useAdmin();
  const { createLegendaryCharacter, updateLegendaryCharacter, deleteLegendaryCharacter, legendaryCharacters: adminChars } = useAdminAPI();
  const publicChars = useQuery({
    queryKey: ['legends'],
    queryFn: async () => {
      const { data, error } = await supabase.from('legends').select('*').order('display_ord');
      if (error) throw error; return data as LegendaryCharacter[];
    },
    enabled: !isAdmin,
  });
  const [editing, setEditing] = useState<LegendaryCharacter | null>(null);
  const [showForm, setShowForm] = useState(false);

  const initialForm: Omit<LegendaryCharacter, "id" | "created_at"> = {
    name: "",
    photo_url: "",
    short_description: "",
    full_bio: "",
    role: "Hero",
    origin: "",
    powers: "",
  };
  const [form, setForm] = useState(initialForm);
  const [uploading, setUploading] = useState(false);

  const openNew = () => {
    setEditing(null);
    setForm(initialForm);
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!form.name) return alert("Name required");
    try {
      if (editing) {
        await updateLegendaryCharacter(editing.id, form);
      } else {
        await createLegendaryCharacter(form);
      }
      setShowForm(false);
      setForm(initialForm);
      setEditing(null);
    } catch (error) {
      console.error('Failed to save character:', error);
    }
  };

  const handleEdit = (char: LegendaryCharacter) => {
    setEditing(char);
    setForm({
      name: char.name,
      photo_url: char.photo_url || "",
      short_description: char.short_description,
      full_bio: char.full_bio,
      role: char.role,
      origin: char.origin,
      powers: char.powers || "",
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this character?")) {
      try {
        await deleteLegendaryCharacter(id);
      } catch (error) {
        console.error('Failed to delete character:', error);
      }
    }
  };

  const list = (isAdmin ? adminChars.data : publicChars.data) as LegendaryCharacter[] | undefined;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#2b1d0e] to-[#120d07] text-amber-50 p-6 md:p-12">
      <Helmet>
        <title>Meet the Legends - Hekayaty</title>
      </Helmet>
      <div className="max-w-6xl mx-auto">
        <h1 className="font-cinzel text-3xl md:text-5xl text-center mb-8">Meet the Legends</h1>

        {/* Add button */}
        <AdminOnly>
          <div className="mb-6 text-center">
            <Button onClick={openNew} className="bg-amber-700 hover:bg-amber-800"><Plus className="w-4 h-4 mr-1"/>Add New Character</Button>
          </div>
        </AdminOnly>

        {/* Form modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="bg-[#1e150c] w-full max-w-lg p-6 rounded-lg shadow-lg overflow-y-auto max-h-[90vh]">
              <h2 className="font-cinzel text-2xl mb-4">{editing ? "Edit Character" : "Add Character"}</h2>

              <div className="space-y-4 text-sm">
                <input placeholder="Name" value={form.name} onChange={(e)=>setForm({...form,name:e.target.value})} className="w-full bg-black/25 px-3 py-2 rounded" />
                <div className="flex items-center gap-2">
                    <input placeholder="Photo URL" value={form.photo_url} onChange={(e)=>setForm({...form,photo_url:e.target.value})} className="flex-1 bg-black/25 px-3 py-2 rounded" />
                    <label className="cursor-pointer text-amber-300 hover:text-amber-400">
                      <ImagePlus className="w-5 h-5" />
                      <input type="file" accept="image/*" className="hidden" onChange={async (e)=>{
                        const file=e.target.files?.[0];
                        if(!file) return; setUploading(true);
                        try {
                          const { data: sessionData } = await supabase.auth.getSession();
                          const token = sessionData.session?.access_token;
                          const formData = new FormData();
                          formData.append('file', file);
                          formData.append('folder', 'legends');

                          const resp = await fetch('/api/upload/file', {
                            method: 'POST',
                            headers: token ? { Authorization: `Bearer ${token}` } : {},
                            body: formData,
                          });
                          if (!resp.ok) throw new Error('Upload failed');
                          const json = await resp.json();
                          setForm(prev=>({...prev,photo_url:json.url}));
                        } catch (error) {
                          console.error('Legend photo upload failed:', error);
                          alert('Upload failed');
                        }
                        setUploading(false);
                      }} />
                    </label>
                  </div>
                <textarea placeholder="Short Description" value={form.short_description} onChange={(e)=>setForm({...form,short_description:e.target.value})} className="w-full bg-black/25 px-3 py-2 rounded" />
                <textarea placeholder="Full Bio / Story" value={form.full_bio} onChange={(e)=>setForm({...form,full_bio:e.target.value})} className="w-full bg-black/25 px-3 py-2 rounded h-40" />
                <select value={form.role} onChange={(e)=>setForm({...form,role:e.target.value})} className="w-full bg-black/25 px-3 py-2 rounded">
                  <option>Hero</option><option>Villain</option><option>Creature</option><option>Guide</option><option>Legend</option>
                </select>
                <input placeholder="Origin World / Story" value={form.origin} onChange={(e)=>setForm({...form,origin:e.target.value})} className="w-full bg-black/25 px-3 py-2 rounded" />
                <input placeholder="Special Powers / Traits (optional)" value={form.powers} onChange={(e)=>setForm({...form,powers:e.target.value})} className="w-full bg-black/25 px-3 py-2 rounded" />
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <Button variant="outline" onClick={()=>setShowForm(false)}>Cancel</Button>
                <Button onClick={handleSubmit}>{editing?"Save":"Add"}</Button>
              </div>
            </div>
          </div>
        )}

        {/* Character Grid */}
        {(isAdmin ? adminChars.isLoading : publicChars.isLoading) ? (
          <div className="text-center py-8">Loading characters...</div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {list?.map((char: LegendaryCharacter) => (
              <div key={char.id} className="bg-[#1e150c]/80 backdrop-blur-sm rounded-lg p-4 shadow-md relative group">
                {char.photo_url && <img src={char.photo_url} alt={char.name} className="w-full h-48 object-cover rounded-md mb-3" />}
                <h3 className="font-cinzel text-xl mb-1">{char.name}</h3>
                <p className="text-amber-300 text-xs mb-1">{char.role} • {char.origin}</p>
                <p className="text-sm line-clamp-3">{char.short_description}</p>

              <AdminOnly>
                <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={()=>handleEdit(char)} className="bg-amber-600 hover:bg-amber-700 p-1 rounded">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={()=>handleDelete(char.id)} className="bg-red-600 hover:bg-red-700 p-1 rounded">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </AdminOnly>
            </div>
          ))}
          {(!list || list.length === 0) && (
            <p className="col-span-full text-center text-amber-200">No legendary characters yet.</p>
          )}
          </div>
        )}
      </div>
    </div>
  );
}
