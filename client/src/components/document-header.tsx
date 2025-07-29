import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, User, GitBranch } from "lucide-react";
import type { Document } from "@shared/schema";

interface DocumentHeaderProps {
  document: Document;
  onEdit?: () => void;
  onSubmitToGithub?: () => void;
  isSubmittingToGithub?: boolean;
}

export default function DocumentHeader({ 
  document, 
  onEdit, 
  onSubmitToGithub, 
  isSubmittingToGithub = false 
}: DocumentHeaderProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft": return "bg-yellow-100 text-yellow-800";
      case "pending_review": return "bg-orange-100 text-orange-800";
      case "approved": return "bg-green-100 text-green-800";
      case "needs_revision": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{document.title}</h1>
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-1" />
              Updated {document.updatedAt ? new Date(document.updatedAt).toLocaleDateString() : 'Unknown'}
            </div>
            <div className="flex items-center">
              <User className="h-4 w-4 mr-1" />
              Path: {document.path}
            </div>
            {document.githubPath && (
              <div className="flex items-center text-green-600">
                <GitBranch className="h-4 w-4 mr-1" />
                GitHub: {document.githubPath}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Badge className={getStatusColor(document.status)}>
            {document.status.replace('_', ' ')}
          </Badge>
          {onEdit && (
            <Button variant="outline" size="sm" onClick={onEdit}>
              Edit
            </Button>
          )}
          {onSubmitToGithub && document.status === "approved" && (
            <Button
              onClick={onSubmitToGithub}
              disabled={isSubmittingToGithub}
              className="bg-green-600 hover:bg-green-700"
              size="sm"
            >
              <GitBranch className="h-4 w-4 mr-2" />
              {isSubmittingToGithub ? "Creating PR..." : "Submit to GitHub"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
