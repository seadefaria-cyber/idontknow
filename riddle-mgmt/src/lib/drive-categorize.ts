/**
 * Categorize a Google Drive file as "legal" or "assets" based on filename and MIME type.
 *
 * Legal: contracts, NDAs, agreements, legal docs
 * Assets: images, videos, audio, creative content, everything else
 */

const LEGAL_KEYWORDS = [
  "contract",
  "agreement",
  "nda",
  "non-disclosure",
  "legal",
  "license",
  "terms",
  "amendment",
  "addendum",
  "rider",
  "release",
  "waiver",
];

export type DriveCategory = "legal" | "assets";

export function categorizeDriveFile(file: { name: string; mimeType: string }): DriveCategory {
  const name = file.name.toLowerCase();

  // Check filename for legal keywords
  if (LEGAL_KEYWORDS.some((kw) => name.includes(kw))) {
    return "legal";
  }

  // Everything else goes to assets
  return "assets";
}
