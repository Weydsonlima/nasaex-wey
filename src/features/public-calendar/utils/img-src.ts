const S3_BASE =
  typeof process !== "undefined" && process.env.NEXT_PUBLIC_S3_BUCKET_CONSTRUCTOR_URL
    ? `https://${process.env.NEXT_PUBLIC_S3_BUCKET_CONSTRUCTOR_URL}`
    : "";

export function imgSrc(path: string): string {
  if (!path) return "";
  if (path.startsWith("http") || path.startsWith("/")) return path;
  return S3_BASE ? `${S3_BASE}/${path}` : `/uploads/${path}`;
}
