export function GET() {
  return new Response(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="12" fill="#0a0a0c" />
  <circle cx="20" cy="24" r="6" fill="#ccff00" />
  <circle cx="44" cy="20" r="6" fill="#6366f1" />
  <circle cx="38" cy="44" r="6" fill="#8b5cf6" />
  <path d="M24 24h14M24 28l10 12M42 25l-4 14" stroke="#f4f5f7" stroke-width="4" stroke-linecap="round" opacity="0.75" />
</svg>`,
    {
      headers: {
        "Content-Type": "image/svg+xml; charset=utf-8",
      },
    },
  );
}
