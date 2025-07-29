import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import DocumentTree from "@/components/document-tree";
import { 
  FileText, 
  Clock, 
  Search, 
  GitBranch, 
  Book, 
  Settings,
  User
} from "lucide-react";
import type { Document } from "@shared/schema";

export default function Sidebar() {
  const [location] = useLocation();

  const { data: pendingReviews = [] } = useQuery<Document[]>({
    queryKey: ["/api/documents/status/pending_review"],
  });

  const isActive = (path: string) => location === path;

  return (
    <aside className="w-64 bg-white shadow-lg border-r border-gray-200 flex flex-col">
      {/* Logo */}
      <div className="p-4 border-b border-gray-200">
        <Link href="/">
          <div className="flex items-center space-x-3 cursor-pointer">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Book className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">WikiDocs</h1>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <div className="space-y-2">
          <Link href="/">
            <Button
              variant={isActive("/") ? "secondary" : "ghost"}
              className="w-full justify-start"
              size="sm"
            >
              <FileText className="h-4 w-4 mr-3" />
              Documents
            </Button>
          </Link>

          <Button
            variant="ghost"
            className="w-full justify-start"
            size="sm"
          >
            <Clock className="h-4 w-4 mr-3" />
            Recent Activity
          </Button>

          <Button
            variant="ghost"
            className="w-full justify-start"
            size="sm"
          >
            <Clock className="h-4 w-4 mr-3" />
            Pending Reviews
            {pendingReviews.length > 0 && (
              <Badge className="ml-auto bg-orange-500 text-white text-xs px-2 py-1">
                {pendingReviews.length}
              </Badge>
            )}
          </Button>

          <Button
            variant="ghost"
            className="w-full justify-start"
            size="sm"
          >
            <GitBranch className="h-4 w-4 mr-3" />
            GitHub Integration
          </Button>

          <Button
            variant="ghost"
            className="w-full justify-start"
            size="sm"
          >
            <Search className="h-4 w-4 mr-3" />
            Search
          </Button>
        </div>

        {/* Document Tree */}
        <div className="mt-8">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Documentation
          </h3>
          <DocumentTree />
        </div>
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
            <User className="h-4 w-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">Admin User</p>
            <p className="text-xs text-gray-500">Administrator</p>
          </div>
          <Button variant="ghost" size="sm">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </aside>
  );
}
