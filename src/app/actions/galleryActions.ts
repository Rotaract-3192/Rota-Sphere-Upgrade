"use server";

/**
 * Gallery Server Actions
 * Allows Super Admin and Club Organizers to upload, manage, and delete multi-photo gallery albums.
 * Real database persistence with support for multiple photos per moment.
 */

import { getCurrentUser } from "@/lib/auth/getUser";
import { executeSql } from "@/lib/db/directDb";
import { revalidatePath } from "next/cache";

export interface GalleryPhotoRecord {
  id: string;
  title: string;
  category: "conference" | "leadership" | "fellowship" | "service" | "sports";
  city: string;
  date: string;
  image_urls: string[];
  likes: number;
  description?: string;
  uploader_email?: string;
  created_at: string;
}

// Auto-initialize gallery_photos table if needed
async function ensureGalleryTable() {
  await executeSql(`
    CREATE TABLE IF NOT EXISTS gallery_photos (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'conference',
      city TEXT DEFAULT 'District 3192',
      date TEXT DEFAULT '2026',
      image_urls JSONB NOT NULL DEFAULT '[]',
      likes INT DEFAULT 0,
      description TEXT,
      uploader_email TEXT,
      created_at TIMESTAMPTZ DEFAULT now()
    );
  `);
}

/**
 * Fetch all gallery albums/moments
 */
export async function getGalleryPhotosAction(category?: string): Promise<{
  success: boolean;
  data: GalleryPhotoRecord[];
  error?: string;
}> {
  try {
    await ensureGalleryTable();

    let sql = `SELECT * FROM gallery_photos`;
    if (category && category !== "all") {
      const safeCat = category.replace(/'/g, "''");
      sql += ` WHERE category = '${safeCat}'`;
    }
    sql += ` ORDER BY created_at DESC;`;

    const { data, error } = await executeSql<GalleryPhotoRecord>(sql);
    if (error) {
      return { success: false, data: [], error: error.message || "Failed to fetch gallery photos" };
    }

    const formattedData = (data || []).map((item: any) => ({
      ...item,
      image_urls: Array.isArray(item.image_urls)
        ? item.image_urls
        : typeof item.image_urls === "string"
        ? JSON.parse(item.image_urls || "[]")
        : [],
    }));

    return { success: true, data: formattedData };
  } catch (err: any) {
    return { success: false, data: [], error: err.message || "Failed to fetch gallery photos" };
  }
}

/**
 * Create a new Gallery Moment (supports multiple images per album)
 */
export async function createGalleryPhotoAction(payload: {
  title: string;
  category: string;
  city?: string;
  date?: string;
  imageUrls: string[];
  description?: string;
}): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: "Authentication required" };
    }

    await ensureGalleryTable();

    const title = (payload.title || "").trim();
    if (!title) {
      return { success: false, error: "Title is required" };
    }

    const cleanUrls = (payload.imageUrls || []).map((u) => u.trim()).filter((u) => u.length > 0);
    if (cleanUrls.length === 0) {
      return { success: false, error: "At least one image URL or photo is required" };
    }

    const safeTitle = title.replace(/'/g, "''");
    const safeCategory = (payload.category || "conference").replace(/'/g, "''");
    const safeCity = (payload.city || "District 3192").replace(/'/g, "''");
    const safeDate = (payload.date || new Date().toLocaleDateString("en-IN", { month: "short", year: "numeric" })).replace(/'/g, "''");
    const safeDesc = (payload.description || "").replace(/'/g, "''");
    const safeUploader = (user.email || "").replace(/'/g, "''");
    const safeImagesJson = JSON.stringify(cleanUrls).replace(/'/g, "''");

    const insertSql = `
      INSERT INTO gallery_photos (title, category, city, date, image_urls, description, uploader_email)
      VALUES ('${safeTitle}', '${safeCategory}', '${safeCity}', '${safeDate}', '${safeImagesJson}'::jsonb, '${safeDesc}', '${safeUploader}')
      RETURNING *;
    `;

    const { data, error } = await executeSql(insertSql);
    if (error) {
      return { success: false, error: error.message || "Database insert error" };
    }

    revalidatePath("/gallery");
    return { success: true, data: data?.[0] };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to create gallery moment" };
  }
}

/**
 * Delete a Gallery Photo / Album
 */
export async function deleteGalleryPhotoAction(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    const userEmail = (user.email || "").toLowerCase();
    const isSuperAdmin = userEmail === "tech.rotaract3192@gmail.com";

    const safeId = id.replace(/'/g, "''");
    const safeEmail = userEmail.replace(/'/g, "''");

    let deleteSql = `DELETE FROM gallery_photos WHERE id = '${safeId}'`;
    if (!isSuperAdmin) {
      deleteSql += ` AND uploader_email = '${safeEmail}'`;
    }

    const { error } = await executeSql(deleteSql);
    if (error) {
      return { success: false, error: error.message || "Failed to delete" };
    }

    revalidatePath("/gallery");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to delete gallery item" };
  }
}

/**
 * Like a Gallery Photo
 */
export async function toggleGalleryPhotoLikeAction(id: string): Promise<{ success: boolean; likes?: number }> {
  try {
    const safeId = id.replace(/'/g, "''");
    const sql = `
      UPDATE gallery_photos 
      SET likes = COALESCE(likes, 0) + 1 
      WHERE id = '${safeId}'
      RETURNING likes;
    `;
    const { data } = await executeSql(sql);
    return { success: true, likes: data?.[0]?.likes ?? 0 };
  } catch {
    return { success: false };
  }
}
