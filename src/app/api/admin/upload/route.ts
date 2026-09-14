import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Upload a file." }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    provider: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ? "cloudinary-ready" : "demo-storage",
    name: file.name,
    size: file.size,
  });
}
