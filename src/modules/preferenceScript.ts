import { config } from "../../package.json";
import { getPref } from "../utils/prefs";
import { VocabListener } from "./vocabListener";

export async function registerPrefsScripts(_window: Window) {
  addon.data.prefs = { window: _window };
  updatePrefsUI();
  bindPrefEvents();
}

function updatePrefsUI() {
  const doc = addon.data.prefs?.window.document;
  const summary = doc?.querySelector(
    `#zotero-prefpane-${config.addonRef}-records-summary`,
  );
  if (!doc || !summary) {
    return;
  }

  const records = VocabListener.getRecords();
  const lastCapturedAt = getPref("lastCapturedAt");
  const lastCapturedText =
    typeof lastCapturedAt === "string" && lastCapturedAt
      ? ` Last captured at ${lastCapturedAt}.`
      : "";
  summary.textContent = `Captured ${records.length} highlight(s).${lastCapturedText}`;
  updateColorPreview(doc);
}

function bindPrefEvents() {
  const doc = addon.data.prefs?.window.document;
  doc
    ?.querySelector(`#zotero-prefpane-${config.addonRef}-enable`)
    ?.addEventListener("command", (event: Event) => {
      ztoolkit.log("Highlight Collector enable changed", event);
    });

  doc
    ?.querySelector(`#zotero-prefpane-${config.addonRef}-grayColors`)
    ?.addEventListener("change", (event: Event) => {
      ztoolkit.log("Highlight Collector colors changed", event);
      updatePrefsUI();
    });
}

function updateColorPreview(doc: Document) {
  const preview = doc.querySelector(
    `#zotero-prefpane-${config.addonRef}-color-preview`,
  );
  if (!preview) {
    return;
  }

  preview.textContent = "";
  const rawColors = getPref("grayColors");
  const colors =
    typeof rawColors === "string"
      ? rawColors
          .split(",")
          .map((color) => color.trim())
          .filter(Boolean)
      : [];

  for (const color of colors) {
    const swatch = doc.createElementNS(
      "http://www.w3.org/1999/xhtml",
      "span",
    ) as HTMLElement;
    swatch.setAttribute("title", color);
    swatch.style.display = "inline-block";
    swatch.style.width = "22px";
    swatch.style.height = "22px";
    swatch.style.margin = "2px 6px 6px 0";
    swatch.style.border = "1px solid #888";
    swatch.style.background = color;
    preview.appendChild(swatch);
  }
}
