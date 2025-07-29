import { 
  type User, 
  type InsertUser, 
  type Document, 
  type InsertDocument,
  type Folder,
  type InsertFolder,
  type GithubRepo,
  type InsertGithubRepo,
  type Review,
  type InsertReview,
  users,
  documents,
  folders,
  githubRepos,
  reviews
} from "@shared/schema";
import { db } from "./db";
import { eq, like, sql } from "drizzle-orm";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;

  // Documents
  getDocument(id: string): Promise<Document | undefined>;
  getDocumentByPath(path: string): Promise<Document | undefined>;
  getDocuments(): Promise<Document[]>;
  getDocumentsByAuthor(authorId: string): Promise<Document[]>;
  getDocumentsByStatus(status: string): Promise<Document[]>;
  createDocument(document: InsertDocument): Promise<Document>;
  updateDocument(id: string, updates: Partial<Document>): Promise<Document | undefined>;
  deleteDocument(id: string): Promise<boolean>;
  searchDocuments(query: string): Promise<Document[]>;

  // Folders
  getFolder(id: string): Promise<Folder | undefined>;
  getFolderByPath(path: string): Promise<Folder | undefined>;
  getFolders(): Promise<Folder[]>;
  getFoldersByParent(parentPath: string | null): Promise<Folder[]>;
  createFolder(folder: InsertFolder): Promise<Folder>;
  updateFolder(id: string, updates: Partial<Folder>): Promise<Folder | undefined>;
  deleteFolder(id: string): Promise<boolean>;

  // GitHub Repos
  getGithubRepo(id: string): Promise<GithubRepo | undefined>;
  getActiveGithubRepos(): Promise<GithubRepo[]>;
  createGithubRepo(repo: InsertGithubRepo): Promise<GithubRepo>;
  updateGithubRepo(id: string, updates: Partial<GithubRepo>): Promise<GithubRepo | undefined>;

  // Reviews
  getReview(id: string): Promise<Review | undefined>;
  getReviewsByDocument(documentId: string): Promise<Review[]>;
  getReviewsByReviewer(reviewerId: string): Promise<Review[]>;
  createReview(review: InsertReview): Promise<Review>;
  updateReview(id: string, updates: Partial<Review>): Promise<Review | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private documents: Map<string, Document> = new Map();
  private folders: Map<string, Folder> = new Map();
  private githubRepos: Map<string, GithubRepo> = new Map();
  private reviews: Map<string, Review> = new Map();

  constructor() {
    // Initialize with default admin user
    const adminUser: User = {
      id: randomUUID(),
      username: "admin",
      email: "admin@wikidocs.com",
      password: "password", // In real app, this would be hashed
      role: "admin",
      avatar: null,
      createdAt: new Date(),
    };
    this.users.set(adminUser.id, adminUser);

    // Initialize with some sample folders
    const apiFolderId = randomUUID();
    const apiFolder: Folder = {
      id: apiFolderId,
      name: "API Documentation",
      path: "api",
      parentPath: null,
      description: "API related documentation",
      createdAt: new Date(),
    };
    this.folders.set(apiFolderId, apiFolder);

    const userGuideFolderId = randomUUID();
    const userGuideFolder: Folder = {
      id: userGuideFolderId,
      name: "User Guides",
      path: "guides",
      parentPath: null,
      description: "User guides and tutorials",
      createdAt: new Date(),
    };
    this.folders.set(userGuideFolderId, userGuideFolder);

    // Initialize sample document
    const docId = randomUUID();
    const sampleDoc: Document = {
      id: docId,
      title: "Authentication Guide",
      content: "# Authentication Guide\n\nThis guide covers authentication methods...",
      path: "api/authentication",
      status: "draft",
      authorId: adminUser.id,
      lastEditorId: adminUser.id,
      reviewerId: null,
      reviewComments: null,
      githubPath: null,
      githubSha: null,
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.documents.set(docId, sampleDoc);
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = {
      id,
      username: insertUser.username,
      email: insertUser.email,
      password: insertUser.password,
      role: insertUser.role || "editor",
      avatar: insertUser.avatar || null,
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Documents
  async getDocument(id: string): Promise<Document | undefined> {
    return this.documents.get(id);
  }

  async getDocumentByPath(path: string): Promise<Document | undefined> {
    return Array.from(this.documents.values()).find(doc => doc.path === path);
  }

  async getDocuments(): Promise<Document[]> {
    return Array.from(this.documents.values());
  }

  async getDocumentsByAuthor(authorId: string): Promise<Document[]> {
    return Array.from(this.documents.values()).filter(doc => doc.authorId === authorId);
  }

  async getDocumentsByStatus(status: string): Promise<Document[]> {
    return Array.from(this.documents.values()).filter(doc => doc.status === status);
  }

  async createDocument(insertDocument: InsertDocument): Promise<Document> {
    const id = randomUUID();
    const document: Document = {
      id,
      title: insertDocument.title,
      content: insertDocument.content || "",
      path: insertDocument.path,
      status: insertDocument.status || "draft",
      authorId: insertDocument.authorId,
      lastEditorId: insertDocument.lastEditorId || null,
      reviewerId: insertDocument.reviewerId || null,
      reviewComments: insertDocument.reviewComments || null,
      githubPath: insertDocument.githubPath || null,
      githubSha: insertDocument.githubSha || null,
      metadata: insertDocument.metadata || {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.documents.set(id, document);
    return document;
  }

  async updateDocument(id: string, updates: Partial<Document>): Promise<Document | undefined> {
    const document = this.documents.get(id);
    if (!document) return undefined;
    
    const updatedDocument = { 
      ...document, 
      ...updates, 
      updatedAt: new Date() 
    };
    this.documents.set(id, updatedDocument);
    return updatedDocument;
  }

  async deleteDocument(id: string): Promise<boolean> {
    return this.documents.delete(id);
  }

  async searchDocuments(query: string): Promise<Document[]> {
    const lowercaseQuery = query.toLowerCase();
    return Array.from(this.documents.values()).filter(doc => 
      doc.title.toLowerCase().includes(lowercaseQuery) ||
      doc.content.toLowerCase().includes(lowercaseQuery) ||
      doc.path.toLowerCase().includes(lowercaseQuery)
    );
  }

  // Folders
  async getFolder(id: string): Promise<Folder | undefined> {
    return this.folders.get(id);
  }

  async getFolderByPath(path: string): Promise<Folder | undefined> {
    return Array.from(this.folders.values()).find(folder => folder.path === path);
  }

  async getFolders(): Promise<Folder[]> {
    return Array.from(this.folders.values());
  }

  async getFoldersByParent(parentPath: string | null): Promise<Folder[]> {
    return Array.from(this.folders.values()).filter(folder => folder.parentPath === parentPath);
  }

  async createFolder(insertFolder: InsertFolder): Promise<Folder> {
    const id = randomUUID();
    const folder: Folder = {
      id,
      name: insertFolder.name,
      path: insertFolder.path,
      parentPath: insertFolder.parentPath || null,
      description: insertFolder.description || null,
      createdAt: new Date(),
    };
    this.folders.set(id, folder);
    return folder;
  }

  async updateFolder(id: string, updates: Partial<Folder>): Promise<Folder | undefined> {
    const folder = this.folders.get(id);
    if (!folder) return undefined;
    
    const updatedFolder = { ...folder, ...updates };
    this.folders.set(id, updatedFolder);
    return updatedFolder;
  }

  async deleteFolder(id: string): Promise<boolean> {
    return this.folders.delete(id);
  }

  // GitHub Repos
  async getGithubRepo(id: string): Promise<GithubRepo | undefined> {
    return this.githubRepos.get(id);
  }

  async getActiveGithubRepos(): Promise<GithubRepo[]> {
    return Array.from(this.githubRepos.values()).filter(repo => repo.isActive);
  }

  async createGithubRepo(insertRepo: InsertGithubRepo): Promise<GithubRepo> {
    const id = randomUUID();
    const repo: GithubRepo = {
      id,
      name: insertRepo.name,
      owner: insertRepo.owner,
      branch: insertRepo.branch || "main",
      token: insertRepo.token,
      webhookSecret: insertRepo.webhookSecret || null,
      isActive: insertRepo.isActive ?? true,
      createdAt: new Date(),
    };
    this.githubRepos.set(id, repo);
    return repo;
  }

  async updateGithubRepo(id: string, updates: Partial<GithubRepo>): Promise<GithubRepo | undefined> {
    const repo = this.githubRepos.get(id);
    if (!repo) return undefined;
    
    const updatedRepo = { ...repo, ...updates };
    this.githubRepos.set(id, updatedRepo);
    return updatedRepo;
  }

  // Reviews
  async getReview(id: string): Promise<Review | undefined> {
    return this.reviews.get(id);
  }

  async getReviewsByDocument(documentId: string): Promise<Review[]> {
    return Array.from(this.reviews.values()).filter(review => review.documentId === documentId);
  }

  async getReviewsByReviewer(reviewerId: string): Promise<Review[]> {
    return Array.from(this.reviews.values()).filter(review => review.reviewerId === reviewerId);
  }

  async createReview(insertReview: InsertReview): Promise<Review> {
    const id = randomUUID();
    const review: Review = {
      id,
      documentId: insertReview.documentId,
      reviewerId: insertReview.reviewerId,
      status: insertReview.status,
      comments: insertReview.comments || null,
      changes: insertReview.changes || [],
      createdAt: new Date(),
    };
    this.reviews.set(id, review);
    return review;
  }

  async updateReview(id: string, updates: Partial<Review>): Promise<Review | undefined> {
    const review = this.reviews.get(id);
    if (!review) return undefined;
    
    const updatedReview = { ...review, ...updates };
    this.reviews.set(id, updatedReview);
    return updatedReview;
  }
}

// Database Storage Implementation
export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        username: insertUser.username,
        email: insertUser.email,
        password: insertUser.password,
        role: insertUser.role || "editor",
        avatar: insertUser.avatar || null,
      })
      .returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  // Documents
  async getDocument(id: string): Promise<Document | undefined> {
    const [document] = await db.select().from(documents).where(eq(documents.id, id));
    return document || undefined;
  }

  async getDocumentByPath(path: string): Promise<Document | undefined> {
    const [document] = await db.select().from(documents).where(eq(documents.path, path));
    return document || undefined;
  }

  async getDocuments(): Promise<Document[]> {
    return await db.select().from(documents);
  }

  async getDocumentsByAuthor(authorId: string): Promise<Document[]> {
    return await db.select().from(documents).where(eq(documents.authorId, authorId));
  }

  async getDocumentsByStatus(status: string): Promise<Document[]> {
    return await db.select().from(documents).where(eq(documents.status, status));
  }

  async createDocument(insertDocument: InsertDocument): Promise<Document> {
    const [document] = await db
      .insert(documents)
      .values({
        title: insertDocument.title,
        content: insertDocument.content || "",
        path: insertDocument.path,
        status: insertDocument.status || "draft",
        authorId: insertDocument.authorId,
        lastEditorId: insertDocument.lastEditorId || null,
        reviewerId: insertDocument.reviewerId || null,
        reviewComments: insertDocument.reviewComments || null,
        githubPath: insertDocument.githubPath || null,
        githubSha: insertDocument.githubSha || null,
        metadata: insertDocument.metadata || {},
      })
      .returning();
    return document;
  }

  async updateDocument(id: string, updates: Partial<Document>): Promise<Document | undefined> {
    const [document] = await db
      .update(documents)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(documents.id, id))
      .returning();
    return document || undefined;
  }

  async deleteDocument(id: string): Promise<boolean> {
    const result = await db.delete(documents).where(eq(documents.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async searchDocuments(query: string): Promise<Document[]> {
    const searchPattern = `%${query.toLowerCase()}%`;
    return await db
      .select()
      .from(documents)
      .where(
        sql`LOWER(${documents.title}) LIKE ${searchPattern} OR 
            LOWER(${documents.content}) LIKE ${searchPattern} OR 
            LOWER(${documents.path}) LIKE ${searchPattern}`
      );
  }

  // Folders
  async getFolder(id: string): Promise<Folder | undefined> {
    const [folder] = await db.select().from(folders).where(eq(folders.id, id));
    return folder || undefined;
  }

  async getFolderByPath(path: string): Promise<Folder | undefined> {
    const [folder] = await db.select().from(folders).where(eq(folders.path, path));
    return folder || undefined;
  }

  async getFolders(): Promise<Folder[]> {
    return await db.select().from(folders);
  }

  async getFoldersByParent(parentPath: string | null): Promise<Folder[]> {
    if (parentPath === null) {
      return await db.select().from(folders).where(sql`${folders.parentPath} IS NULL`);
    }
    return await db.select().from(folders).where(eq(folders.parentPath, parentPath));
  }

  async createFolder(insertFolder: InsertFolder): Promise<Folder> {
    const [folder] = await db
      .insert(folders)
      .values({
        name: insertFolder.name,
        path: insertFolder.path,
        parentPath: insertFolder.parentPath || null,
        description: insertFolder.description || null,
      })
      .returning();
    return folder;
  }

  async updateFolder(id: string, updates: Partial<Folder>): Promise<Folder | undefined> {
    const [folder] = await db
      .update(folders)
      .set(updates)
      .where(eq(folders.id, id))
      .returning();
    return folder || undefined;
  }

  async deleteFolder(id: string): Promise<boolean> {
    const result = await db.delete(folders).where(eq(folders.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // GitHub Repos
  async getGithubRepo(id: string): Promise<GithubRepo | undefined> {
    const [repo] = await db.select().from(githubRepos).where(eq(githubRepos.id, id));
    return repo || undefined;
  }

  async getActiveGithubRepos(): Promise<GithubRepo[]> {
    return await db.select().from(githubRepos).where(eq(githubRepos.isActive, true));
  }

  async createGithubRepo(insertRepo: InsertGithubRepo): Promise<GithubRepo> {
    const [repo] = await db
      .insert(githubRepos)
      .values({
        name: insertRepo.name,
        owner: insertRepo.owner,
        branch: insertRepo.branch || "main",
        token: insertRepo.token,
        webhookSecret: insertRepo.webhookSecret || null,
        isActive: insertRepo.isActive ?? true,
      })
      .returning();
    return repo;
  }

  async updateGithubRepo(id: string, updates: Partial<GithubRepo>): Promise<GithubRepo | undefined> {
    const [repo] = await db
      .update(githubRepos)
      .set(updates)
      .where(eq(githubRepos.id, id))
      .returning();
    return repo || undefined;
  }

  // Reviews
  async getReview(id: string): Promise<Review | undefined> {
    const [review] = await db.select().from(reviews).where(eq(reviews.id, id));
    return review || undefined;
  }

  async getReviewsByDocument(documentId: string): Promise<Review[]> {
    return await db.select().from(reviews).where(eq(reviews.documentId, documentId));
  }

  async getReviewsByReviewer(reviewerId: string): Promise<Review[]> {
    return await db.select().from(reviews).where(eq(reviews.reviewerId, reviewerId));
  }

  async createReview(insertReview: InsertReview): Promise<Review> {
    const [review] = await db
      .insert(reviews)
      .values({
        documentId: insertReview.documentId,
        reviewerId: insertReview.reviewerId,
        status: insertReview.status,
        comments: insertReview.comments || null,
        changes: insertReview.changes || [],
      })
      .returning();
    return review;
  }

  async updateReview(id: string, updates: Partial<Review>): Promise<Review | undefined> {
    const [review] = await db
      .update(reviews)
      .set(updates)
      .where(eq(reviews.id, id))
      .returning();
    return review || undefined;
  }
}

export const storage = new DatabaseStorage();
