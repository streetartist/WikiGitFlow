import { db } from "./db";
import { users, documents, folders } from "@shared/schema";
import { sql } from "drizzle-orm";

export async function seedDatabase() {
  try {
    // Check if admin user already exists
    const existingAdmin = await db
      .select()
      .from(users)
      .where(sql`username = 'admin'`)
      .limit(1);

    if (existingAdmin.length > 0) {
      console.log("Database already seeded");
      return;
    }

    console.log("Seeding database...");

    // Create admin user
    const [adminUser] = await db
      .insert(users)
      .values({
        username: "admin",
        email: "admin@wikidocs.com",
        password: "password", // In real app, this would be hashed
        role: "admin",
        avatar: null,
      })
      .returning();

    // Create sample folders
    const [apiFolder] = await db
      .insert(folders)
      .values({
        name: "API Documentation",
        path: "api",
        parentPath: null,
        description: "API related documentation",
      })
      .returning();

    const [userGuideFolder] = await db
      .insert(folders)
      .values({
        name: "User Guides",
        path: "guides",
        parentPath: null,
        description: "User guides and tutorials",
      })
      .returning();

    // Create sample document
    await db
      .insert(documents)
      .values({
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
      });

    console.log("Database seeded successfully");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}