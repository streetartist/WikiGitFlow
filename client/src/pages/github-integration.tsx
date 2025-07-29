import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import Sidebar from "@/components/sidebar";
import MobileSidebar from "@/components/mobile-sidebar";
import { 
  GitBranch, 
  Plus, 
  RefreshCw, 
  Settings, 
  ExternalLink,
  Download,
  Upload
} from "lucide-react";
import type { GithubRepo } from "@shared/schema";

export default function GitHubIntegration() {
  const { toast } = useToast();
  const [showAddRepo, setShowAddRepo] = useState(false);
  const [repoForm, setRepoForm] = useState({
    name: "",
    owner: "",
    branch: "main",
    token: ""
  });

  const { data: repos = [], isLoading } = useQuery<GithubRepo[]>({
    queryKey: ["/api/github/repos"],
  });

  const addRepoMutation = useMutation({
    mutationFn: (data: typeof repoForm) => apiRequest("POST", "/api/github/repos", data),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "GitHub repository added successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/github/repos"] });
      setShowAddRepo(false);
      setRepoForm({ name: "", owner: "", branch: "main", token: "" });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add GitHub repository",
        variant: "destructive",
      });
    },
  });

  const syncRepoMutation = useMutation({
    mutationFn: (repoId: string) => apiRequest("POST", `/api/github/sync/${repoId}`, {}),
    onSuccess: async (response) => {
      const result = await response.json();
      toast({
        title: "Success",
        description: result.message,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to sync with GitHub repository",
        variant: "destructive",
      });
    },
  });

  const handleAddRepo = () => {
    if (!repoForm.name || !repoForm.owner || !repoForm.token) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    addRepoMutation.mutate(repoForm);
  };

  const handleSync = (repoId: string) => {
    syncRepoMutation.mutate(repoId);
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
              <div className="flex items-center space-x-2">
                <GitBranch className="h-6 w-6 text-blue-600" />
                <h1 className="text-xl md:text-2xl font-bold text-gray-900">GitHub Integration</h1>
              </div>
            </div>
            <Button 
              onClick={() => setShowAddRepo(true)}
              className="bg-blue-600 hover:bg-blue-700"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Add Repository</span>
              <span className="sm:hidden">Add</span>
            </Button>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 p-4 md:p-6">
          {/* Add Repository Form */}
          {showAddRepo && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Add GitHub Repository</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Repository Owner *
                    </label>
                    <Input
                      type="text"
                      placeholder="username or organization"
                      value={repoForm.owner}
                      onChange={(e) => setRepoForm({ ...repoForm, owner: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Repository Name *
                    </label>
                    <Input
                      type="text"
                      placeholder="repository-name"
                      value={repoForm.name}
                      onChange={(e) => setRepoForm({ ...repoForm, name: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Branch
                    </label>
                    <Input
                      type="text"
                      placeholder="main"
                      value={repoForm.branch}
                      onChange={(e) => setRepoForm({ ...repoForm, branch: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      GitHub Token *
                    </label>
                    <Input
                      type="password"
                      placeholder="github_pat_..."
                      value={repoForm.token}
                      onChange={(e) => setRepoForm({ ...repoForm, token: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                  <Button
                    onClick={handleAddRepo}
                    disabled={addRepoMutation.isPending}
                    className="flex-1"
                  >
                    {addRepoMutation.isPending ? "Adding..." : "Add Repository"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowAddRepo(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Repository List */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {isLoading ? (
              Array.from({ length: 2 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </CardContent>
                </Card>
              ))
            ) : repos.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <GitBranch className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No repositories connected</h3>
                <p className="text-gray-600 mb-4">Connect your first GitHub repository to start syncing documentation.</p>
                <Button 
                  onClick={() => setShowAddRepo(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Repository
                </Button>
              </div>
            ) : (
              repos.map((repo) => (
                <Card key={repo.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center space-x-2">
                        <GitBranch className="h-5 w-5 text-blue-600" />
                        <span className="truncate">{repo.owner}/{repo.name}</span>
                      </CardTitle>
                      <Badge className={repo.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                        {repo.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center text-sm text-gray-600">
                        <span className="font-medium mr-2">Branch:</span>
                        <span>{repo.branch}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <span className="font-medium mr-2">Added:</span>
                        <span>{repo.createdAt ? new Date(repo.createdAt).toLocaleDateString() : 'Unknown'}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                        <Button
                          onClick={() => handleSync(repo.id)}
                          disabled={syncRepoMutation.isPending}
                          variant="outline"
                          size="sm"
                          className="flex-1"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          {syncRepoMutation.isPending ? "Syncing..." : "Sync from GitHub"}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => window.open(`https://github.com/${repo.owner}/${repo.name}`, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          <span className="hidden sm:inline">View on GitHub</span>
                          <span className="sm:hidden">GitHub</span>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Instructions */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                Setup Instructions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-sm">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">1. Create a GitHub Personal Access Token</h4>
                  <p className="text-gray-600 mb-2">
                    Go to GitHub Settings → Developer settings → Personal access tokens → Fine-grained tokens
                  </p>
                  <p className="text-gray-600">
                    Grant permissions: Contents (read/write), Metadata (read), Pull requests (write)
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">2. Sync Documents</h4>
                  <p className="text-gray-600">
                    Use "Sync from GitHub" to import existing markdown files from your repository
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">3. Submit Changes</h4>
                  <p className="text-gray-600">
                    Approved documents can be submitted as pull requests to your GitHub repository
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}