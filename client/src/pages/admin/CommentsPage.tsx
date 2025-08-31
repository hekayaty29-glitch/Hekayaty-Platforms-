import { Helmet } from "react-helmet";
import { useAdmin } from "@/context/AdminContext";
import { useAdminComments } from "@/hooks/useComments";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";

export default function CommentsPage() {
  const { isAdmin } = useAdmin();

  const {
    comments,
    isLoading,
    isError,
    error,
    deleteComment,
  } = useAdminComments();

  if (!isAdmin) {
    return <div className="p-8">Access denied</div>;
  }

  if (isLoading) {
    return <div className="p-8">Loading comments...</div>;
  }

  if (isError) {
    return (
      <div className="p-8 text-red-500">
        {(error as Error).message}
      </div>
    );
  }

  const handleDelete = (id: string) => {
    if (confirm("Delete comment?")) {
      deleteComment(id);
    }
  };

  return (
    <div className="flex">
      <AdminSidebar />
      <main className="flex-1 p-8 bg-[#15100A] text-amber-50 min-h-screen">
        <Helmet>
          <title>Comment Moderation - Hekayaty Admin</title>
        </Helmet>

        <h1 className="text-3xl font-bold font-cinzel mb-6">Comments</h1>

        <table className="min-w-full text-sm bg-amber-50/10 border border-amber-500">
          <thead>
            <tr className="text-left text-amber-300">
              <th className="p-3">User</th>
              <th className="p-3">Comment</th>
              <th className="p-3">Time</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {comments.map((c) => (
              <tr key={c.id} className="hover:bg-amber-900/50">
                <td className="p-3">{c.username ?? c.user_id}</td>
                <td className="p-3 max-w-lg line-clamp-2">{c.content}</td>
                <td className="p-3">
                  {formatDistanceToNow(new Date(c.created_at), {
                    addSuffix: true,
                  })}
                </td>
                <td className="p-3">
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(c.id)}
                  >
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </main>
    </div>
  );
}