import { getPref, setPref } from "../utils/prefs";

export interface HighlightMapping {
  color: string;
  label: string;
  slug: string;
}

export const CATEGORY_PRESETS = [
  "Vocabulary",
  "Core Claim",
  "Quote",
  "Method",
  "Finding",
  "Conclusion",
  "Limitation",
  "Question",
  "Idea",
  "Other",
];

export const DEFAULT_MAPPINGS: HighlightMapping[] = [
  { color: "#aaaaaa", label: "Vocabulary", slug: "vocabulary" },
  { color: "#ffd400", label: "Core Claim", slug: "core_claim" },
  { color: "#2ea8ff", label: "Quote", slug: "quote" },
  { color: "#5fbf75", label: "Method", slug: "method" },
  { color: "#ff6666", label: "Conclusion", slug: "conclusion" },
  { color: "#b983ff", label: "Idea", slug: "idea" },
];

export function getHighlightMappings() {
  const mappings = parseMappings(getPref("highlightMappings"));
  if (mappings.length) {
    return mappings;
  }

  const legacyMappings = getLegacyGrayColorMappings();
  return legacyMappings.length ? legacyMappings : DEFAULT_MAPPINGS;
}

export function setHighlightMappings(mappings: HighlightMapping[]) {
  const cleanedMappings = mappings
    .map((mapping) => ({
      color: normalizeColor(mapping.color),
      label: cleanLabel(mapping.label),
      slug: cleanSlug(mapping.slug || mapping.label),
    }))
    .filter((mapping) => mapping.color && mapping.label);

  setPref("highlightMappings", JSON.stringify(cleanedMappings));
  setPref(
    "grayColors",
    cleanedMappings.map((mapping) => mapping.color).join(","),
  );
}

export function getMappingForColor(color: string | undefined) {
  const normalizedColor = normalizeColor(color);
  if (!normalizedColor) {
    return undefined;
  }
  return getHighlightMappings().find(
    (mapping) => normalizeColor(mapping.color) === normalizedColor,
  );
}

export function getCategoryOptions() {
  const mappings = getHighlightMappings();
  const options = new Map<string, string>();
  for (const mapping of mappings) {
    options.set(mapping.slug, mapping.label);
  }
  return Array.from(options.entries()).map(([slug, label]) => ({
    slug,
    label,
  }));
}

export function normalizeColor(color: string | undefined) {
  if (!color) {
    return "";
  }

  const trimmed = color.trim().toLowerCase();
  if (/^#[0-9a-f]{6}$/.test(trimmed)) {
    return trimmed;
  }
  if (/^#[0-9a-f]{3}$/.test(trimmed)) {
    return `#${trimmed[1]}${trimmed[1]}${trimmed[2]}${trimmed[2]}${trimmed[3]}${trimmed[3]}`;
  }
  return "";
}

export function cleanSlug(value: string) {
  return (
    value
      .trim()
      .toLocaleLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "") || "other"
  );
}

function parseMappings(value: unknown): HighlightMapping[] {
  if (typeof value !== "string" || !value.trim()) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed
      .map((mapping) => ({
        color: normalizeColor(mapping?.color),
        label: cleanLabel(mapping?.label),
        slug: cleanSlug(String(mapping?.slug || mapping?.label || "")),
      }))
      .filter((mapping) => mapping.color && mapping.label);
  } catch (error) {
    ztoolkit.log("Failed to parse highlight mappings", error);
    return [];
  }
}

function getLegacyGrayColorMappings() {
  const raw = getPref("grayColors");
  if (typeof raw !== "string") {
    return [];
  }

  return raw
    .split(",")
    .map((color) => normalizeColor(color))
    .filter(Boolean)
    .map((color) => ({
      color,
      label: "Vocabulary",
      slug: "vocabulary",
    }));
}

function cleanLabel(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}
