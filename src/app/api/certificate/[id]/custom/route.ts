// src/app/api/certificate/[id]/custom/route.ts
// DEPRECATED: Custom certificates are no longer supported.
// All certificate requests are redirected to the unified official certificate.
import { NextResponse } from 'next/server';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return NextResponse.redirect(new URL(`/api/certificate/${id}`, req.url), 301);
}
