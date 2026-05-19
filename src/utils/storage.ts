// src/utils/storage.ts
import fs from 'fs/promises';
import path from 'path';

/**
 * Saves a binary image buffer.
 * If Supabase environment variables are present, uploads to Supabase Storage bucket and returns the public URL.
 * Otherwise, falls back to writing to the local 'uploads' directory on disk.
 */
export async function saveImageFile(buffer: Buffer, filename: string, mimeType: string): Promise<string> {
  let supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
  const supabaseBucket = process.env.SUPABASE_BUCKET || 'kvs-uploads';

  // Normalize URL in case user added /rest/v1/ at the end
  if (supabaseUrl && supabaseUrl.endsWith('/rest/v1/')) {
    supabaseUrl = supabaseUrl.replace('/rest/v1/', '');
  } else if (supabaseUrl && supabaseUrl.endsWith('/rest/v1')) {
    supabaseUrl = supabaseUrl.replace('/rest/v1', '');
  }

  // If we are on Vercel or have Supabase URL, strictly use Cloud Storage
  if (supabaseUrl && supabaseAnonKey) {
    const uploadUrl = `${supabaseUrl}/storage/v1/object/${supabaseBucket}/${filename}`;
    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': mimeType,
        'x-upsert': 'true'
      },
      body: new Uint8Array(buffer)
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Supabase upload error: ${errText} (URL: ${uploadUrl})`);
    }

    // Return the public URL to view/download the image
    return `${supabaseUrl}/storage/v1/object/public/${supabaseBucket}/${filename}`;
  }

  if (process.env.VERCEL || process.env.VERCEL_ENV) {
    throw new Error('Vercel environment detected but SUPABASE_URL is missing. Local disk storage is not allowed on Vercel (/var/task/uploads is read-only).');
  }

  // Fallback: Local Disk Storage (Only for local development without Supabase)
  const uploadDir = path.join(process.cwd(), 'uploads');
  await fs.mkdir(uploadDir, { recursive: true });
  const filepath = path.join(uploadDir, filename);
  await fs.writeFile(filepath, buffer);
  return filepath;
}

/**
 * Reads a binary image buffer from a public URL (Supabase) or local file path.
 */
export async function readImageFile(filePathOrUrl: string): Promise<Buffer> {
  if (filePathOrUrl.startsWith('http://') || filePathOrUrl.startsWith('https://')) {
    const response = await fetch(filePathOrUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image from URL: ${filePathOrUrl}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }
  return await fs.readFile(filePathOrUrl);
}
