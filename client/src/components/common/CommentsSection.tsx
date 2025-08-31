import { useState } from "react";
import { useComments } from "@/hooks/useComments";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";

interface Props {
  targetId: string;
  targetType: "story" | "comic";
}

export default function CommentsSection({ targetId, targetType }: Props) {
  const { isAuthenticated, user } = useAuth();
  const [text, setText] = useState("");

  const {
    comments,
    isLoading,
    isError,
    error,
    addComment,
    deleteComment,
  } = useComments(targetId, targetType);

  const handleSubmit = async () => {
    if (!text.trim()) return;
    await addComment({
      user_id: user!.id.toString(),
      parent_id: null,
      target_id: targetId,
      target_type: targetType,
      content: text.trim(),
    });
    setText("");
  };

  return (
    <Card className="border-amber-500/30 mt-6">
      <CardContent className="p-4">
        <h3 className="font-cinzel text-lg font-bold text-brown-dark mb-4">
          Comments
        </h3>

        {isError && (
          <p className="text-red-500 mb-4">{(error as Error).message}</p>
        )}

        {isAuthenticated && (
          <div className="mb-6">
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Write a comment..."
              className="mb-2"
            />
            <Button onClick={handleSubmit} disabled={!text.trim()}>
              Post
            </Button>
          </div>
        )}

        {isLoading ? (
          <p>Loading comments…</p>
        ) : comments.length ? (
          <ul className="space-y-4">
            {comments.map((c) => (
              <li key={c.id} className="border-b pb-2">
                <div className="text-sm text-brown-dark whitespace-pre-wrap">
                  {c.content}
                </div>
                <div className="text-xs text-gray-500 flex items-center gap-2 mt-1">
                  {c.user_id} • {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}
                  {user?.id?.toString() === c.user_id && (
                    <Button
                      size="sm"
                      variant="link"
                      onClick={() => deleteComment(c.id)}
                    >
                      delete
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500 italic">
            No comments yet. Be the first!
          </p>
        )}
      </CardContent>
    </Card>
  );
}
