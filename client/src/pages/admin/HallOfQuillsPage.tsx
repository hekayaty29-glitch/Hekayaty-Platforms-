import { useState } from "react";
import { Helmet } from "react-helmet";
import { useAdmin } from "@/context/AdminContext";
import {
  useHoqList,
  useHoqMutations,
  HoqCategory,
  HoqEntry,
} from "@/hooks/useHallOfQuills";
import { useQueryClient } from "@tanstack/react-query";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { Button } from "@/components/ui/button";
import { Plus, GripVertical, Trash2 } from "lucide-react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

/* ------------------------------------------------------------------ */
/*  Sortable row helper                                               */
/* ------------------------------------------------------------------ */

function SortableRow(props: { id: string; children: React.ReactNode }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: props.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  return (
    <tr ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {props.children}
    </tr>
  );
}

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

export default function HallOfQuillsPage() {
  const { isAdmin } = useAdmin();
  if (!isAdmin) return <div className="p-8">Access denied</div>;

  /* -------------- state --------------- */
  const [tab, setTab] = useState<HoqCategory>("best");
  const sensors = useSensors(useSensor(PointerSensor));

  /* -------------- data --------------- */
  const { data: entries = [], isLoading } = useHoqList(tab);
  const { add, remove, reorder } = useHoqMutations(tab);

  const qc = useQueryClient();
  const setLocal = (items: HoqEntry[]) =>
    qc.setQueryData(["hall-of-quills", tab], items);

  /* -------------- DnD --------------- */
  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIdx = entries.findIndex((x) => x.id === active.id);
    const newIdx = entries.findIndex((x) => x.id === over.id);
    if (oldIdx === -1 || newIdx === -1) return;

    const reordered = arrayMove(entries, oldIdx, newIdx);
    setLocal(reordered); // optimistic
    reorder(reordered.map((e) => e.id));
  };

  /* -------------- mutations --------------- */
  const addEntry = async () => {
    const userId = prompt("Enter user_id of writer to add");
    if (userId) await add(userId);
  };

  /* ------------------------------------------------------------------ */
  /*  UI helpers                                                        */
  /* ------------------------------------------------------------------ */

  const renderList = () => (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-cinzel text-2xl capitalize">
          {tab === "competition" ? "Competition Winners" : `${tab} writers`}
        </h2>
        <Button onClick={addEntry} disabled={isLoading}>
          <Plus className="h-4 w-4 mr-1" /> Add
        </Button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={entries.map((e) => e.id)}
          strategy={verticalListSortingStrategy}
        >
          <table className="min-w-full text-sm bg-amber-50/10 border border-amber-500">
            <thead>
              <tr className="text-left text-amber-300">
                <th className="p-3" />
                <th className="p-3">User ID</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <SortableRow key={e.id} id={e.id}>
                  <td className="p-3">
                    <GripVertical className="h-4 w-4" />
                  </td>
                  <td className="p-3">{e.user_id}</td>
                  <td className="p-3">
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => remove(e.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </SortableRow>
              ))}
            </tbody>
          </table>
        </SortableContext>
      </DndContext>
    </div>
  );

  const renderPlaceholder = (t: string) => (
    <p className="text-amber-300">{t} coming soon…</p>
  );

  /* ------------------------------------------------------------------ */
  /*  Render                                                            */
  /* ------------------------------------------------------------------ */

  return (
    <div className="flex">
      <AdminSidebar />

      <main className="flex-1 p-8 bg-[#15100A] text-amber-50 min-h-screen">
        <Helmet>
          <title>Hall of Quills - Admin</title>
        </Helmet>

        {/* Tabs */}
        <div className="mb-6 space-x-4">
          {(
            [
              ["best", "Best Writers"],
              ["active", "Active Writers"],
              ["competition", "Competition Winners"],
              ["honorable", "Honorable Mentions"],
            ] as [HoqCategory, string][]
          ).map(([key, label]) => (
            <Button
              key={key}
              variant={tab === key ? "default" : "outline"}
              onClick={() => setTab(key)}
            >
              {label}
            </Button>
          ))}
        </div>

        {/* Content */}
        {["best", "active", "competition", "honorable"].includes(tab)
          ? renderList()
          : renderPlaceholder("Unknown Tab")}
      </main>
    </div>
  );
}