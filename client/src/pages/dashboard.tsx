import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Sidebar from "@/components/sidebar";
import MobileSidebar from "@/components/mobile-sidebar";
import { Search, Plus, Clock, FileText, GitBranch } from "lucide-react";
import type { Document } from "@shared/schema";

export default function Dashboard() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: documents = [], isLoading } = useQuery<Document[]>({
    queryKey: ["/api/documents"],
  });

  const { data: pendingReviews = [] } = useQuery<Document[]>({
    queryKey: ["/api/documents/status/pending_review"],
  });

  const filteredDocuments = documents.filter(doc =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.path.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
    <div className="min-h-screen flex bg-gray-50">
      <div className="hidden md:block">
        <Sidebar />
      </div>
      
      <main className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-4 md:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="md:hidden">
                <MobileSidebar />
              </div>
              <nav className="flex items-center space-x-2 text-sm text-gray-500">
                <span className="text-gray-900 font-medium">Documentation</span>
              </nav>
            </div>
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search documentation..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-48 md:w-64 pl-10"
                />
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              </div>
              <Link href="/editor">
                <Button className="bg-blue-600 hover:bg-blue-700" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">New Document</span>
                  <span className="sm:hidden">New</span>
                </Button>
              </Link>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 p-4 md:p-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Stats Cards */}
            <div className="lg:col-span-4 grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center">
                    <FileText className="h-8 w-8 text-blue-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Documents</p>
                      <p className="text-2xl font-bold text-gray-900">{documents.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center">
                    <Clock className="h-8 w-8 text-orange-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Pending Reviews</p>
                      <p className="text-2xl font-bold text-gray-900">{pendingReviews.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center">
                    <GitBranch className="h-8 w-8 text-green-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">GitHub Synced</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {documents.filter(d => d.githubPath).length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Documents */}
            <div className="lg:col-span-3">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Documents</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="space-y-4">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="animate-pulse">
                          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredDocuments.slice(0, 10).map((doc) => (
                        <div key={doc.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors space-y-2 sm:space-y-0">
                          <div className="flex-1 min-w-0">
                            <Link href={`/documents/${doc.id}`}>
                              <h3 className="font-medium text-gray-900 hover:text-blue-600 cursor-pointer truncate">
                                {doc.title}
                              </h3>
                            </Link>
                            <p className="text-sm text-gray-500 mt-1 truncate">{doc.path}</p>
                            <p className="text-xs text-gray-400 mt-1">
                              Updated {doc.updatedAt ? new Date(doc.updatedAt).toLocaleDateString() : 'Unknown'}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2 flex-shrink-0">
                            <Badge className={getStatusColor(doc.status)}>
                              {doc.status.replace('_', ' ')}
                            </Badge>
                            {doc.githubPath && (
                              <GitBranch className="h-4 w-4 text-green-600" />
                            )}
                          </div>
                        </div>
                      ))}
                      {filteredDocuments.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          {searchQuery ? "No documents found matching your search." : "No documents yet. Create your first document!"}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Pending Reviews Sidebar */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Clock className="h-5 w-5 mr-2" />
                    Pending Reviews
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {pendingReviews.length === 0 ? (
                    <p className="text-gray-500 text-sm">No pending reviews</p>
                  ) : (
                    <div className="space-y-3">
                      {pendingReviews.slice(0, 5).map((doc) => (
                        <div key={doc.id} className="p-3 border border-orange-200 rounded-lg bg-orange-50">
                          <Link href={`/documents/${doc.id}`}>
                            <h4 className="font-medium text-gray-900 hover:text-blue-600 cursor-pointer text-sm truncate">
                              {doc.title}
                            </h4>
                          </Link>
                          <p className="text-xs text-gray-500 mt-1 truncate">{doc.path}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
