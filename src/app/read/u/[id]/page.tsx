import type { Metadata } from "next";
import { UploadReader } from "@/components/reader/UploadReader";

export const metadata: Metadata = { title: "Reading your copy" };
export const instant = false;

export function generateStaticParams() {
  // Uploads are per account and resolved in the browser; one placeholder keeps the route statically known.
  return [{ id: "_" }];
}

export default async function UploadReadPage({ params }: PageProps<"/read/u/[id]">) {
  const { id } = await params;
  return <UploadReader id={id} />;
}
