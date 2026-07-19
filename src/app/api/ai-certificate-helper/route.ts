// src/app/api/ai-certificate-helper/route.ts
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { field, draft, context } = body;
    
    let enhanced = draft;
    if (field === 'description' && draft) {
      // Generar una redacción profesional, formal y de nivel de protección de derechos de autor
      enhanced = `Obra visual titulada bajo resguardo de firma digital. Metadata original del autor: "${draft}". Registrado bajo los términos de propiedad intelectual vigentes con protección criptográfica activa Kyllerium Corporation.`;
    }

    return NextResponse.json({ enhanced });
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
