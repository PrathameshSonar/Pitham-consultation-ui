/**
 * Google Maps embed URL helpers.
 *
 * Why this file exists: admins paste all sorts of things into the "map URL"
 * field — the full <iframe> HTML snippet that Google's "Share → Embed a map"
 * dialog gives them, the share-link from "Share → Copy Link", a place URL
 * from the address bar, etc. Most of those CANNOT be rendered in an iframe
 * because Google sets `X-Frame-Options: SAMEORIGIN` on them. The browser
 * silently shows "refused to connect."
 *
 * Only two URL shapes actually iframe successfully:
 *   1. https://www.google.com/maps/embed?pb=...        (the official "Embed" tab)
 *   2. https://maps.google.com/maps?q=...&output=embed (legacy, still works)
 *
 * `normalizeMapUrl` accepts whatever the admin pasted and returns the best
 * iframable URL we can extract, plus a `kind` so the UI can warn when the
 * input definitely won't embed.
 */

export type MapUrlKind = "embed" | "iframe-html" | "share" | "empty" | "unknown";

export interface NormalizedMapUrl {
  url: string;        // best-effort iframe-safe URL (may be empty)
  kind: MapUrlKind;
  embeddable: boolean;
}

/**
 * Pull the `src` attribute out of an <iframe ...> snippet if present.
 * Returns the inner URL or null if the input wasn't an iframe HTML blob.
 */
function extractIframeSrc(input: string): string | null {
  const m = input.match(/<iframe[^>]*\ssrc\s*=\s*["']([^"']+)["']/i);
  return m ? m[1] : null;
}

export function normalizeMapUrl(raw: string | null | undefined): NormalizedMapUrl {
  const input = (raw || "").trim();
  if (!input) return { url: "", kind: "empty", embeddable: false };

  // Case 1: full <iframe ...> HTML — extract the src
  const fromIframe = extractIframeSrc(input);
  if (fromIframe) {
    const inner = fromIframe.trim();
    return {
      url: inner,
      kind: "iframe-html",
      embeddable: /\/maps\/embed\?/.test(inner) || /[?&]output=embed/.test(inner),
    };
  }

  // Case 2: bare URL
  if (/\/maps\/embed\?/.test(input)) {
    return { url: input, kind: "embed", embeddable: true };
  }
  if (/[?&]output=embed/.test(input)) {
    return { url: input, kind: "embed", embeddable: true };
  }

  // Case 3: a share link or place URL — these are NOT iframable, but we keep
  // the URL so the form can show it back. UI should show a warning.
  if (/maps\.app\.goo\.gl|google\.[^/]+\/maps\b/.test(input)) {
    return { url: input, kind: "share", embeddable: false };
  }

  return { url: input, kind: "unknown", embeddable: false };
}
