import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  loginSchema, 
  insertDocumentSchema, 
  updateDocumentSchema,
  insertFolderSchema,
  insertGithubRepoSchema,
  submitReviewSchema 
} from "@shared/schema";
import { Octokit } from "@octokit/rest";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Auth routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = loginSchema.parse(req.body);
      const user = await storage.getUserByUsername(username);
      
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error) {
      res.status(400).json({ message: "Invalid request data" });
    }
  });

  // User routes
  app.get("/api/users/me", async (req, res) => {
    // In a real app, you'd get this from session/JWT
    const users = await storage.getDocuments();
    if (users.length > 0) {
      const adminUser = await storage.getUserByUsername("admin");
      if (adminUser) {
        const { password: _, ...userWithoutPassword } = adminUser;
        res.json(userWithoutPassword);
      } else {
        res.status(404).json({ message: "User not found" });
      }
    } else {
      res.status(404).json({ message: "User not found" });
    }
  });

  // Document routes
  app.get("/api/documents", async (req, res) => {
    try {
      const documents = await storage.getDocuments();
      res.json(documents);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch documents" });
    }
  });

  app.get("/api/documents/:id", async (req, res) => {
    try {
      const document = await storage.getDocument(req.params.id);
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }
      res.json(document);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch document" });
    }
  });

  app.post("/api/documents", async (req, res) => {
    try {
      const documentData = insertDocumentSchema.parse(req.body);
      const document = await storage.createDocument(documentData);
      res.status(201).json(document);
    } catch (error) {
      res.status(400).json({ message: "Invalid document data" });
    }
  });

  app.put("/api/documents/:id", async (req, res) => {
    try {
      const updates = updateDocumentSchema.parse({ ...req.body, id: req.params.id });
      const { id, ...updateData } = updates;
      const document = await storage.updateDocument(id, updateData);
      
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      res.json(document);
    } catch (error) {
      res.status(400).json({ message: "Invalid update data" });
    }
  });

  app.delete("/api/documents/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteDocument(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Document not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete document" });
    }
  });

  // Document search
  app.get("/api/documents/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ message: "Search query required" });
      }
      
      const documents = await storage.searchDocuments(query);
      res.json(documents);
    } catch (error) {
      res.status(500).json({ message: "Search failed" });
    }
  });

  // Documents by status (for review workflow)
  app.get("/api/documents/status/:status", async (req, res) => {
    try {
      const documents = await storage.getDocumentsByStatus(req.params.status);
      res.json(documents);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch documents by status" });
    }
  });

  // Folder routes
  app.get("/api/folders", async (req, res) => {
    try {
      const folders = await storage.getFolders();
      res.json(folders);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch folders" });
    }
  });

  app.get("/api/folders/tree", async (req, res) => {
    try {
      const folders = await storage.getFolders();
      const documents = await storage.getDocuments();
      
      // Build tree structure
      const folderMap = new Map();
      folders.forEach(folder => {
        folderMap.set(folder.path, { ...folder, children: [], documents: [] });
      });

      // Add documents to their folders
      documents.forEach(doc => {
        const folderPath = doc.path.substring(0, doc.path.lastIndexOf('/'));
        if (folderMap.has(folderPath)) {
          folderMap.get(folderPath).documents.push(doc);
        }
      });

      // Build hierarchical structure
      const rootFolders = folders.filter(f => !f.parentPath);
      const buildTree = (folder: any) => {
        const children = folders.filter(f => f.parentPath === folder.path);
        return {
          ...folderMap.get(folder.path),
          children: children.map(buildTree)
        };
      };

      const tree = rootFolders.map(buildTree);
      res.json(tree);
    } catch (error) {
      res.status(500).json({ message: "Failed to build folder tree" });
    }
  });

  app.post("/api/folders", async (req, res) => {
    try {
      const folderData = insertFolderSchema.parse(req.body);
      const folder = await storage.createFolder(folderData);
      res.status(201).json(folder);
    } catch (error) {
      res.status(400).json({ message: "Invalid folder data" });
    }
  });

  // GitHub integration routes
  app.get("/api/github/repos", async (req, res) => {
    try {
      const repos = await storage.getActiveGithubRepos();
      res.json(repos);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch GitHub repos" });
    }
  });

  app.post("/api/github/repos", async (req, res) => {
    try {
      const repoData = insertGithubRepoSchema.parse(req.body);
      const repo = await storage.createGithubRepo(repoData);
      res.status(201).json(repo);
    } catch (error) {
      res.status(400).json({ message: "Invalid repo data" });
    }
  });

  // Fetch documents from GitHub repo
  app.post("/api/github/sync/:repoId", async (req, res) => {
    try {
      const repo = await storage.getGithubRepo(req.params.repoId);
      if (!repo) {
        return res.status(404).json({ message: "Repository not found" });
      }

      const octokit = new Octokit({ auth: repo.token });
      
      // Get repository contents
      const { data: contents } = await octokit.rest.repos.getContent({
        owner: repo.owner,
        repo: repo.name,
        path: '',
        ref: repo.branch
      });

      const syncedDocuments = [];
      
      if (Array.isArray(contents)) {
        for (const item of contents) {
          if (item.type === 'file' && item.name.endsWith('.md')) {
            const { data: fileData } = await octokit.rest.repos.getContent({
              owner: repo.owner,
              repo: repo.name,
              path: item.path,
              ref: repo.branch
            });

            if ('content' in fileData) {
              const content = Buffer.from(fileData.content, 'base64').toString('utf-8');
              const title = item.name.replace('.md', '');
              
              // Check if document already exists
              const existingDoc = await storage.getDocumentByPath(item.path);
              
              if (existingDoc) {
                // Update existing document
                await storage.updateDocument(existingDoc.id, {
                  content,
                  githubSha: fileData.sha,
                  githubPath: item.path
                });
                syncedDocuments.push({ action: 'updated', document: existingDoc });
              } else {
                // Create new document
                const adminUser = await storage.getUserByUsername("admin");
                const newDoc = await storage.createDocument({
                  title,
                  content,
                  path: item.path,
                  status: 'approved',
                  authorId: adminUser!.id,
                  lastEditorId: adminUser!.id,
                  reviewerId: null,
                  reviewComments: null,
                  githubPath: item.path,
                  githubSha: fileData.sha,
                  metadata: {}
                });
                syncedDocuments.push({ action: 'created', document: newDoc });
              }
            }
          }
        }
      }

      res.json({ 
        message: `Synced ${syncedDocuments.length} documents`,
        documents: syncedDocuments 
      });
    } catch (error) {
      console.error('GitHub sync error:', error);
      res.status(500).json({ message: "Failed to sync with GitHub" });
    }
  });

  // Submit document to GitHub as PR
  app.post("/api/github/submit/:documentId", async (req, res) => {
    try {
      const document = await storage.getDocument(req.params.documentId);
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      const repos = await storage.getActiveGithubRepos();
      if (repos.length === 0) {
        return res.status(400).json({ message: "No GitHub repository configured" });
      }

      const repo = repos[0]; // Use first active repo
      const octokit = new Octokit({ auth: repo.token });

      // Create a new branch for the PR
      const branchName = `update-${document.path.replace(/[^a-zA-Z0-9]/g, '-')}-${Date.now()}`;
      
      // Get the default branch reference
      const { data: defaultBranch } = await octokit.rest.repos.getBranch({
        owner: repo.owner,
        repo: repo.name,
        branch: repo.branch
      });

      // Create new branch
      await octokit.rest.git.createRef({
        owner: repo.owner,
        repo: repo.name,
        ref: `refs/heads/${branchName}`,
        sha: defaultBranch.commit.sha
      });

      // Create or update file in the new branch
      const filePath = document.githubPath || `${document.path}.md`;
      
      await octokit.rest.repos.createOrUpdateFileContents({
        owner: repo.owner,
        repo: repo.name,
        path: filePath,
        message: `Update ${document.title}`,
        content: Buffer.from(document.content).toString('base64'),
        branch: branchName,
        ...(document.githubSha && { sha: document.githubSha })
      });

      // Create pull request
      const { data: pullRequest } = await octokit.rest.pulls.create({
        owner: repo.owner,
        repo: repo.name,
        title: `Update ${document.title}`,
        head: branchName,
        base: repo.branch,
        body: `Automated pull request for document: ${document.title}\n\nPath: ${document.path}`
      });

      res.json({ 
        message: "Pull request created successfully",
        pullRequest: {
          number: pullRequest.number,
          url: pullRequest.html_url
        }
      });
    } catch (error) {
      console.error('GitHub PR creation error:', error);
      res.status(500).json({ message: "Failed to create pull request" });
    }
  });

  // Review routes
  app.get("/api/reviews/document/:documentId", async (req, res) => {
    try {
      const reviews = await storage.getReviewsByDocument(req.params.documentId);
      res.json(reviews);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch reviews" });
    }
  });

  app.post("/api/reviews", async (req, res) => {
    try {
      const reviewData = submitReviewSchema.parse(req.body);
      const adminUser = await storage.getUserByUsername("admin");
      
      const review = await storage.createReview({
        ...reviewData,
        reviewerId: adminUser!.id
      });

      // Update document status based on review
      await storage.updateDocument(reviewData.documentId, {
        status: reviewData.status,
        reviewComments: reviewData.comments,
        reviewerId: adminUser!.id
      });

      res.status(201).json(review);
    } catch (error) {
      res.status(400).json({ message: "Invalid review data" });
    }
  });

  // GitHub Repository routes
  app.get("/api/github/repos", async (req, res) => {
    try {
      const repos = await storage.getActiveGithubRepos();
      res.json(repos);
    } catch (error) {
      console.error("Error fetching GitHub repos:", error);
      res.status(500).json({ message: "Failed to fetch repositories" });
    }
  });

  app.post("/api/github/repos", async (req, res) => {
    try {
      const repoData = insertGithubRepoSchema.parse(req.body);
      const repo = await storage.createGithubRepo(repoData);
      res.status(201).json(repo);
    } catch (error) {
      console.error("Error creating GitHub repo:", error);
      res.status(400).json({ message: "Failed to create repository" });
    }
  });

  app.post("/api/github/sync/:repoId", async (req, res) => {
    try {
      const { repoId } = req.params;
      const repo = await storage.getGithubRepo(repoId);
      
      if (!repo) {
        return res.status(404).json({ message: "Repository not found" });
      }

      const octokit = new Octokit({
        auth: repo.token,
      });

      // Get all markdown files from the repository
      const { data: contents } = await octokit.rest.repos.getContent({
        owner: repo.owner,
        repo: repo.name,
        path: "",
        ref: repo.branch,
      });

      let syncedCount = 0;
      const processContents = async (items: any[], basePath = "") => {
        for (const item of items) {
          if (item.type === "dir") {
            // Recursively process subdirectories
            const { data: subContents } = await octokit.rest.repos.getContent({
              owner: repo.owner,
              repo: repo.name,
              path: item.path,
              ref: repo.branch,
            });
            await processContents(Array.isArray(subContents) ? subContents : [subContents], item.path);
          } else if (item.type === "file" && item.name.endsWith(".md")) {
            // Process markdown files
            const { data: fileData } = await octokit.rest.repos.getContent({
              owner: repo.owner,
              repo: repo.name,
              path: item.path,
              ref: repo.branch,
            });

            if (fileData.type === "file" && fileData.content) {
              const content = Buffer.from(fileData.content, "base64").toString("utf-8");
              const title = item.name.replace(".md", "").replace(/-/g, " ");
              const path = item.path.replace(".md", "").replace(/\//g, "/");

              // Check if document already exists
              const existingDoc = await storage.getDocumentByPath(path);
              
              if (existingDoc) {
                // Update existing document
                await storage.updateDocument(existingDoc.id, {
                  content,
                  githubPath: item.path,
                  githubSha: fileData.sha,
                  updatedAt: new Date(),
                });
              } else {
                // Create new document
                await storage.createDocument({
                  title,
                  content,
                  path,
                  status: "draft",
                  authorId: "admin", // In real app, get from session
                  githubPath: item.path,
                  githubSha: fileData.sha,
                });
              }
              syncedCount++;
            }
          }
        }
      };

      await processContents(Array.isArray(contents) ? contents : [contents]);

      res.json({ 
        message: `Successfully synced ${syncedCount} documents from GitHub`,
        syncedCount 
      });
    } catch (error) {
      console.error("Error syncing from GitHub:", error);
      res.status(500).json({ message: "Failed to sync from GitHub" });
    }
  });

  app.post("/api/github/submit/:documentId", async (req, res) => {
    try {
      const { documentId } = req.params;
      const document = await storage.getDocument(documentId);
      
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      if (document.status !== "approved") {
        return res.status(400).json({ message: "Document must be approved before submitting to GitHub" });
      }

      // Get active GitHub repos
      const repos = await storage.getActiveGithubRepos();
      if (repos.length === 0) {
        return res.status(400).json({ message: "No active GitHub repositories configured" });
      }

      const repo = repos[0]; // Use first active repo
      const octokit = new Octokit({
        auth: repo.token,
      });

      // Create a new branch for the pull request
      const branchName = `docs-update-${document.title.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
      
      // Get the base branch SHA
      const { data: baseRef } = await octokit.rest.git.getRef({
        owner: repo.owner,
        repo: repo.name,
        ref: `heads/${repo.branch}`,
      });

      // Create new branch
      await octokit.rest.git.createRef({
        owner: repo.owner,
        repo: repo.name,
        ref: `refs/heads/${branchName}`,
        sha: baseRef.object.sha,
      });

      // Create or update file in the new branch
      const filePath = document.githubPath || `${document.path}.md`;
      let sha: string | undefined;

      try {
        // Try to get existing file to get its SHA
        const { data: existingFile } = await octokit.rest.repos.getContent({
          owner: repo.owner,
          repo: repo.name,
          path: filePath,
          ref: repo.branch,
        });
        
        if (existingFile.type === "file") {
          sha = existingFile.sha;
        }
      } catch (error) {
        // File doesn't exist, that's okay
      }

      // Update or create the file
      await octokit.rest.repos.createOrUpdateFileContents({
        owner: repo.owner,
        repo: repo.name,
        path: filePath,
        message: `Update documentation: ${document.title}`,
        content: Buffer.from(document.content).toString("base64"),
        branch: branchName,
        sha,
      });

      // Create pull request
      const { data: pullRequest } = await octokit.rest.pulls.create({
        owner: repo.owner,
        repo: repo.name,
        title: `Update documentation: ${document.title}`,
        body: `This pull request updates the documentation for ${document.title}.

**Changes:**
- Updated content for ${document.path}

This pull request was automatically generated from the Wiki Documentation System.`,
        head: branchName,
        base: repo.branch,
      });

      // Update document with GitHub information
      await storage.updateDocument(documentId, {
        githubPath: filePath,
        githubSha: sha,
      });

      res.json({ 
        message: "Pull request created successfully",
        pullRequestUrl: pullRequest.html_url,
        pullRequestNumber: pullRequest.number
      });
    } catch (error) {
      console.error("Error submitting to GitHub:", error);
      res.status(500).json({ message: "Failed to submit to GitHub" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
