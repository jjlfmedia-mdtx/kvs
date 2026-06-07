export function normalizeBaseUrl(value: string) {
  return value.replace(/\/+$/, '');
}

export function getRequestBaseUrl(req: Request) {
  const configured = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL;
  if (configured) return normalizeBaseUrl(configured);

  const url = new URL(req.url);
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || url.host;
  const protocol = req.headers.get('x-forwarded-proto') || url.protocol.replace(':', '') || 'https';
  return normalizeBaseUrl(`${protocol}://${host}`);
}

export function buildVerifyUrl(baseUrl: string, kvsId: string) {
  return `${normalizeBaseUrl(baseUrl)}/verify/${kvsId}`;
}
