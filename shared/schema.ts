import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("editor"), // editor, reviewer, admin
  avatar: text("avatar"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const documents = pgTable("documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  content: text("content").notNull().default(""),
  path: text("path").notNull(), // folder/subfolder/document-name
  status: text("status").notNull().default("draft"), // draft, pending_review, approved, needs_revision
  authorId: varchar("author_id").notNull(),
  lastEditorId: varchar("last_editor_id"),
  reviewerId: varchar("reviewer_id"),
  reviewComments: text("review_comments"),
  githubPath: text("github_path"), // path in GitHub repo
  githubSha: text("github_sha"), // commit SHA for version tracking
  metadata: jsonb("metadata").default('{}'), // tags, category, etc.
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const folders = pgTable("folders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  path: text("path").notNull().unique(), // full path like "api/authentication"
  parentPath: text("parent_path"), // parent folder path
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const githubRepos = pgTable("github_repos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  owner: text("owner").notNull(),
  branch: text("branch").notNull().default("main"),
  token: text("token").notNull(),
  webhookSecret: text("webhook_secret"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const reviews = pgTable("reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  documentId: varchar("document_id").notNull(),
  reviewerId: varchar("reviewer_id").notNull(),
  status: text("status").notNull(), // approved, needs_revision, rejected
  comments: text("comments"),
  changes: jsonb("changes").default('[]'), // array of change suggestions
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertFolderSchema = createInsertSchema(folders).omit({
  id: true,
  createdAt: true,
});

export const insertGithubRepoSchema = createInsertSchema(githubRepos).omit({
  id: true,
  createdAt: true,
});

export const insertReviewSchema = createInsertSchema(reviews).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;

export type Folder = typeof folders.$inferSelect;
export type InsertFolder = z.infer<typeof insertFolderSchema>;

export type GithubRepo = typeof githubRepos.$inferSelect;
export type InsertGithubRepo = z.infer<typeof insertGithubRepoSchema>;

export type Review = typeof reviews.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;

// Additional schemas for API endpoints
export const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export const updateDocumentSchema = insertDocumentSchema.partial().extend({
  id: z.string(),
});

export const submitReviewSchema = z.object({
  documentId: z.string(),
  status: z.enum(["approved", "needs_revision", "rejected"]),
  comments: z.string().optional(),
  changes: z.array(z.any()).optional(),
});
