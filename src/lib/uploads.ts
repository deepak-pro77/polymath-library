"use client";

import { getSupabase } from "./supabase";
import type { CategoryId } from "@/data/categories";

export interface Upload {
  id: string;
  title: string;
  author: string;
  category_id: CategoryId | null;
  file_kind: "epub" | "pdf";
  file_path: string;
  size_bytes: number | null;
  created_at: string;
}

/** Progress / annotation key for an upload. */
export const uploadKey = (id: string) => `u:${id}`;

export async function listUploads(): Promise<Upload[]> {
  const sb = getSupabase();
  if (!sb) return [];
  const { data } = await sb.from("user_uploads").select("*").order("created_at", { ascending: false });
  return (data as Upload[]) ?? [];
}

export async function getUpload(id: string): Promise<Upload | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data } = await sb.from("user_uploads").select("*").eq("id", id).maybeSingle();
  return (data as Upload) ?? null;
}

/** Short-lived private URL for the reader. */
export async function uploadFileUrl(u: Upload): Promise<string | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data } = await sb.storage.from("uploads").createSignedUrl(u.file_path, 60 * 60 * 6);
  return data?.signedUrl ?? null;
}

export async function addUpload(userId: string, file: File, meta: { title: string; author: string; category_id: CategoryId | null }): Promise<Upload> {
  const sb = getSupabase();
  if (!sb) throw new Error("Supabase is not configured");
  const kind: "epub" | "pdf" = file.name.toLowerCase().endsWith(".pdf") ? "pdf" : "epub";
  const id = crypto.randomUUID();
  const path = `${userId}/${id}.${kind}`;
  const { error: upErr } = await sb.storage.from("uploads").upload(path, file, { contentType: kind === "epub" ? "application/epub+zip" : "application/pdf", upsert: false });
  if (upErr) throw new Error(upErr.message);
  const { data, error } = await sb.from("user_uploads").insert({ id, user_id: userId, title: meta.title, author: meta.author, category_id: meta.category_id, file_kind: kind, file_path: path, size_bytes: file.size }).select("*").single();
  if (error) throw new Error(error.message);
  return data as Upload;
}

export async function removeUpload(u: Upload) {
  const sb = getSupabase();
  if (!sb) return;
  await sb.storage.from("uploads").remove([u.file_path]);
  await sb.from("user_uploads").delete().eq("id", u.id);
}

/** Best-effort title/author from an EPUB's metadata, so the form is pre-filled. */
export async function sniffEpub(file: File): Promise<{ title?: string; author?: string }> {
  try {
    const ePub = (await import("epubjs")).default;
    const buf = await file.arrayBuffer();
    const book = ePub(buf, { openAs: "binary" });
    const meta = await book.loaded.metadata;
    book.destroy();
    return { title: meta.title || undefined, author: meta.creator || undefined };
  } catch {
    return {};
  }
}
