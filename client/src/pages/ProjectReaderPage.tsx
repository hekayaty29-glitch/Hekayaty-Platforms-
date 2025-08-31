import { useEffect } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";

interface Project {
  id: string;
  title: string;
  description: string;
  format: "html" | "pdf";
  contentPath: string; // url to pdf or html content path
  content?: string; // inline html if stored that way
  coverImage?: string;
  author?: { id: string; username: string; fullName?: string } | null;
  createdAt: string;
}

async function fetchProject(id: string): Promise<Project> {
  const res = await fetch(`/api/projects/${id}`);
  if (!res.ok) throw new Error('Failed to load project');
  return res.json();
}

export default function ProjectReaderPage() {
  // wouter useParams returns Record<string,string>
  const params = useParams<{ id: string }>();
  const projectId = params.id;

  const {
    data: project,
    isLoading,
    error,
  } = useQuery<Project>({
    queryKey: ["project", projectId],
    queryFn: () => fetchProject(projectId),
  });

  useEffect(() => {
    if (project) {
      document.title = project.title;
    }
  }, [project]);

  if (isLoading) return <div className="p-8 text-center">Loading...</div>;
  if (error || !project) return <div className="p-8 text-center text-red-500">Project not found.</div>;

  return (
    <div className="max-w-5xl mx-auto py-8">
      <h1 className="text-3xl font-bold mb-4 text-center">{project.title}</h1>
      {project.format === "pdf" ? (
        <embed
          src={project.contentPath}
          type="application/pdf"
          className="w-full h-[85vh] border rounded"
        />
      ) : (
        <article
          className="prose prose-invert mx-auto"
          dangerouslySetInnerHTML={{ __html: project.content || project.contentPath }}
        />
      )}
    </div>
  );
}
