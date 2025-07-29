import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import Sidebar from "@/components/sidebar";
import MobileSidebar from "@/components/mobile-sidebar";
import MarkdownEditor from "@/components/markdown-editor";
import { ArrowLeft, Save, Eye, Send, History } from "lucide-react";
import type { Document, InsertDocument } from "@shared/schema";

export default function Editor() {
  const [, params] = useRoute("/editor/:id?");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [title, setTitle] = useState("");
  const [path, setPath] = useState("");
  const [content, setContent] = useState("");
  const [isPreview, setIsPreview] = useState(false);

  const documentId = params?.id;
  const isEditing = !!documentId;

  const { data: document, isLoading } = useQuery<Document>({
    queryKey: ["/api/documents", documentId],
    enabled: isEditing,
  });

  useEffect(() => {
    if (document) {
      setTitle(document.title);
      setPath(document.path);
      setContent(document.content);
    }
  }, [document]);

  const saveMutation = useMutation({
    mutationFn: async (data: { title: string; path: string; content: string }) => {
      const payload = isEditing 
        ? { ...data, id: documentId }
        : { ...data, status: "draft", authorId: "admin-id", lastEditorId: "admin-id", reviewerId: null, reviewComments: null, githubPath: null, githubSha: null, metadata: {} };

      return isEditing
        ? apiRequest("PUT", `/api/documents/${documentId}`, payload)
        : apiRequest("POST", "/api/documents", payload);
    },
    onSuccess: async (response) => {
      const savedDoc = await response.json();
      toast({
        title: "Success",
        description: isEditing ? "Document updated successfully" : "Document created successfully",
      });
      
      await queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      
      if (!isEditing) {
        setLocation(`/editor/${savedDoc.id}`);
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save document",
        variant: "destructive",
      });
    },
  });

  const submitForReviewMutation = useMutation({
    mutationFn: () => apiRequest("PUT", `/api/documents/${documentId}`, { status: "pending_review" }),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Document submitted for review",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit document for review",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    if (!title.trim() || !path.trim()) {
      toast({
        title: "Error",
        description: "Please provide both title and path",
        variant: "destructive",
      });
      return;
    }

    saveMutation.mutate({ title, path, content });
  };

  const handleSubmitForReview = () => {
    if (!documentId) return;
    submitForReviewMutation.mutate();
  };

  const generatePath = (titleValue: string) => {
    return titleValue
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex bg-gray-50">
        <div className="hidden md:block">
          <Sidebar />
        </div>
        <main className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      <div className="hidden md:block">
        <Sidebar />
      </div>
      
      <main className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-4 md:px-6 py-4">
          <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
            <div className="flex items-center space-x-4">
              <div className="md:hidden">
                <MobileSidebar />
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation("/")}
                className="text-gray-500 hover:text-gray-700"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Back to Dashboard</span>
                <span className="sm:hidden">Back</span>
              </Button>
              <div className="flex items-center space-x-2 flex-1 min-w-0">
                <Input
                  type="text"
                  placeholder="Document title..."
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (!isEditing && !path) {
                      setPath(generatePath(e.target.value));
                    }
                  }}
                  className="text-lg md:text-xl font-bold border-none bg-transparent p-0 h-auto flex-1 min-w-0"
                />
                {document && (
                  <Badge className={
                    document.status === "draft" ? "bg-yellow-100 text-yellow-800" :
                    document.status === "pending_review" ? "bg-orange-100 text-orange-800" :
                    document.status === "approved" ? "bg-green-100 text-green-800" :
                    "bg-red-100 text-red-800"
                  }>
                    {document.status.replace('_', ' ')}
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsPreview(!isPreview)}
              >
                <Eye className="h-4 w-4 mr-2" />
                {isPreview ? "Edit" : "Preview"}
              </Button>
              {isEditing && (
                <Button variant="outline" size="sm">
                  <History className="h-4 w-4 mr-2" />
                  History
                </Button>
              )}
              <Button
                onClick={handleSave}
                disabled={saveMutation.isPending}
                size="sm"
              >
                <Save className="h-4 w-4 mr-2" />
                {saveMutation.isPending ? "Saving..." : "Save"}
              </Button>
              {isEditing && document?.status === "draft" && (
                <Button
                  onClick={handleSubmitForReview}
                  disabled={submitForReviewMutation.isPending}
                  className="bg-green-600 hover:bg-green-700"
                  size="sm"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Submit for Review
                </Button>
              )}
            </div>
          </div>
        </header>

        {/* Path Input */}
        <div className="bg-white border-b border-gray-200 px-4 md:px-6 py-3">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">Path:</span>
            <Input
              type="text"
              placeholder="document/path"
              value={path}
              onChange={(e) => setPath(e.target.value)}
              className="text-sm"
            />
            <span className="text-sm text-gray-400">.md</span>
          </div>
        </div>

        {/* Editor */}
        <div className="flex-1 bg-white">
          <MarkdownEditor
            content={content}
            onChange={setContent}
            preview={isPreview}
          />
        </div>
      </main>
    </div>
  );
}
