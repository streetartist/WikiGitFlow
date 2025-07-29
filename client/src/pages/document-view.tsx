import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import Sidebar from "@/components/sidebar";
import MobileSidebar from "@/components/mobile-sidebar";
import ReviewPanel from "@/components/review-panel";
import ReactMarkdown from "react-markdown";
import { ArrowLeft, Edit, GitBranch, Clock, User, Calendar } from "lucide-react";
import { useState } from "react";
import type { Document, Review } from "@shared/schema";

export default function DocumentView() {
  const [, params] = useRoute("/documents/:id");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [reviewStatus, setReviewStatus] = useState("");
  const [reviewComments, setReviewComments] = useState("");
  const [showReviewForm, setShowReviewForm] = useState(false);

  const documentId = params?.id;

  const { data: document, isLoading } = useQuery<Document>({
    queryKey: ["/api/documents", documentId],
  });

  const { data: reviews = [] } = useQuery<Review[]>({
    queryKey: ["/api/reviews/document", documentId],
  });

  const submitReviewMutation = useMutation({
    mutationFn: (data: { status: string; comments?: string }) =>
      apiRequest("POST", "/api/reviews", {
        documentId,
        status: data.status,
        comments: data.comments,
      }),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Review submitted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reviews"] });
      setShowReviewForm(false);
      setReviewStatus("");
      setReviewComments("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit review",
        variant: "destructive",
      });
    },
  });

  const submitToGithubMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/github/submit/${documentId}`, {}),
    onSuccess: async (response) => {
      const result = await response.json();
      toast({
        title: "Success",
        description: `Pull request created: ${result.pullRequest.url}`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create pull request",
        variant: "destructive",
      });
    },
  });

  const handleSubmitReview = () => {
    if (!reviewStatus) {
      toast({
        title: "Error",
        description: "Please select a review status",
        variant: "destructive",
      });
      return;
    }

    submitReviewMutation.mutate({
      status: reviewStatus,
      comments: reviewComments.trim() || undefined,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft": return "bg-yellow-100 text-yellow-800";
      case "pending_review": return "bg-orange-100 text-orange-800";
      case "approved": return "bg-green-100 text-green-800";
      case "needs_revision": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
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

  if (!document) {
    return (
      <div className="min-h-screen flex bg-gray-50">
        <div className="hidden md:block">
          <Sidebar />
        </div>
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center p-4">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">Document not found</h2>
            <p className="text-gray-600 mb-4">The document you're looking for doesn't exist.</p>
            <Button onClick={() => setLocation("/")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      <div className="hidden lg:block">
        <Sidebar />
      </div>
      
      <main className="flex-1 flex flex-col lg:flex-row">
        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="bg-white border-b border-gray-200 px-4 md:px-6 py-4">
            <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
              <div className="flex items-center space-x-4">
                <div className="lg:hidden">
                  <MobileSidebar />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setLocation("/")}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Back</span>
                </Button>
                <nav className="flex items-center space-x-2 text-sm text-gray-500">
                  <span className="hidden sm:inline">Documentation</span>
                  <span className="hidden sm:inline">/</span>
                  <span className="text-gray-900 font-medium truncate">{document.title}</span>
                </nav>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLocation(`/editor/${document.id}`)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                {document.status === "approved" && (
                  <Button
                    onClick={() => submitToGithubMutation.mutate()}
                    disabled={submitToGithubMutation.isPending}
                    className="bg-green-600 hover:bg-green-700"
                    size="sm"
                  >
                    <GitBranch className="h-4 w-4 mr-2" />
                    {submitToGithubMutation.isPending ? "Creating PR..." : "Submit to GitHub"}
                  </Button>
                )}
              </div>
            </div>
          </header>

          {/* Document Header */}
          <div className="bg-white border-b border-gray-200 px-4 md:px-6 py-4">
            <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
              <div className="min-w-0">
                <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-2 truncate">{document.title}</h1>
                <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-4 text-sm text-gray-500">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    Updated {document.updatedAt ? new Date(document.updatedAt).toLocaleDateString() : 'Unknown'}
                  </div>
                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-1" />
                    <span className="truncate">Path: {document.path}</span>
                  </div>
                  {document.githubPath && (
                    <div className="flex items-center text-green-600">
                      <GitBranch className="h-4 w-4 mr-1" />
                      <span className="truncate">GitHub: {document.githubPath}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge className={getStatusColor(document.status)}>
                  {document.status.replace('_', ' ')}
                </Badge>
                {document.status === "pending_review" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowReviewForm(!showReviewForm)}
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    Review
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Review Form */}
          {showReviewForm && (
            <div className="bg-yellow-50 border-b border-yellow-200 px-4 md:px-6 py-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Submit Review</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Review Status
                    </label>
                    <Select value={reviewStatus} onValueChange={setReviewStatus}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select review status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="needs_revision">Needs Revision</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Comments (optional)
                    </label>
                    <Textarea
                      value={reviewComments}
                      onChange={(e) => setReviewComments(e.target.value)}
                      placeholder="Add review comments..."
                      rows={3}
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                    <Button
                      onClick={handleSubmitReview}
                      disabled={submitReviewMutation.isPending}
                      className="flex-1"
                    >
                      {submitReviewMutation.isPending ? "Submitting..." : "Submit Review"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowReviewForm(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Content */}
          <div className="flex-1 bg-white p-4 md:p-6">
            <div className="prose prose-gray max-w-none">
              <ReactMarkdown>{document.content}</ReactMarkdown>
            </div>
          </div>
        </div>

        {/* Review Panel */}
        <ReviewPanel documentId={documentId!} reviews={reviews} />
      </main>
    </div>
  );
}
