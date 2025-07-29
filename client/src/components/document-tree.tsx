import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight, Folder, FileText } from "lucide-react";
import type { Document, Folder as FolderType } from "@shared/schema";

interface TreeFolder extends FolderType {
  children: TreeFolder[];
  documents: Document[];
}

export default function DocumentTree() {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  const { data: tree = [], isLoading } = useQuery<TreeFolder[]>({
    queryKey: ["/api/folders/tree"],
  });

  const toggleFolder = (folderPath: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderPath)) {
      newExpanded.delete(folderPath);
    } else {
      newExpanded.add(folderPath);
    }
    setExpandedFolders(newExpanded);
  };

  const renderFolder = (folder: TreeFolder, depth = 0) => {
    const isExpanded = expandedFolders.has(folder.path);
    const hasChildren = folder.children.length > 0 || folder.documents.length > 0;

    return (
      <div key={folder.id} className="select-none">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start p-1 h-auto"
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
          onClick={() => hasChildren && toggleFolder(folder.path)}
        >
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown className="h-3 w-3 mr-1 text-gray-400" />
            ) : (
              <ChevronRight className="h-3 w-3 mr-1 text-gray-400" />
            )
          ) : (
            <div className="w-3 mr-1" />
          )}
          <Folder className="h-4 w-4 mr-2 text-yellow-600" />
          <span className="text-sm text-gray-700">{folder.name}</span>
        </Button>

        {isExpanded && (
          <div>
            {folder.children.map(child => renderFolder(child, depth + 1))}
            {folder.documents.map(doc => (
              <Link key={doc.id} href={`/documents/${doc.id}`}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start p-1 h-auto text-gray-600 hover:text-gray-900"
                  style={{ paddingLeft: `${(depth + 1) * 16 + 8}px` }}
                >
                  <div className="w-3 mr-1" />
                  <FileText className="h-3 w-3 mr-2 text-gray-400" />
                  <span className="text-sm truncate">{doc.title}</span>
                </Button>
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-full"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {tree.map(folder => renderFolder(folder))}
      {tree.length === 0 && (
        <div className="text-xs text-gray-500 p-2">
          No folders yet
        </div>
      )}
    </div>
  );
}
