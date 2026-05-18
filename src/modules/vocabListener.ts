import { getPref, setPref } from "../utils/prefs";
import { getMappingForColor, normalizeColor } from "./highlightMappings";

type ZoteroItem = any;

export interface VocabRecord {
  text: string;
  normalizedText: string;
  categoryLabel?: string;
  categorySlug?: string;
  translation?: string;
  paperTitle?: string;
  excerptDate?: string;
  contextSentence?: string;
  contextSource?: "annotation" | "fulltext-cache";
  annotationKey: string;
  annotationID: number;
  annotationColor: string;
  annotationComment?: string;
  attachmentKey?: string;
  attachmentTitle?: string;
  itemKey?: string;
  itemTitle?: string;
  libraryID?: number;
  pageLabel?: string;
  createdAt?: string;
  updatedAt: string;
}

export class VocabListener {
  static registerNotifier() {
    if (addon.data.notifierID) {
      return;
    }

    const callback = {
      notify: async (
        event: string,
        type: string,
        ids: number[] | string[],
        extraData: { [key: string]: any },
      ) => {
        if (!addon?.data.alive) {
          this.unregisterNotifier();
          return;
        }

        await addon.hooks.onNotify(event, type, ids, extraData);
      },
    };

    addon.data.notifierID = Zotero.Notifier.registerObserver(callback, [
      "item",
    ]);

    Zotero.Plugins.addObserver({
      shutdown: ({ id }) => {
        if (id === addon.data.config.addonID) {
          this.unregisterNotifier();
        }
      },
    });

    ztoolkit.log("Highlight Collector notifier registered");
  }

  static unregisterNotifier() {
    if (!addon.data.notifierID) {
      return;
    }
    Zotero.Notifier.unregisterObserver(addon.data.notifierID);
    addon.data.notifierID = undefined;
  }

  static async handleNotify(
    event: string,
    type: string,
    ids: Array<string | number>,
  ) {
    if (!getPref("enable")) {
      return;
    }

    if (type !== "item" || !["add", "modify"].includes(event)) {
      return;
    }

    const captured: VocabRecord[] = [];
    for (const id of ids) {
      const itemID = Number(id);
      if (!Number.isFinite(itemID)) {
        continue;
      }

      const item = Zotero.Items.get(itemID) as ZoteroItem | false;
      if (!item || !this.isWatchedHighlightAnnotation(item)) {
        continue;
      }

      const record = await this.recordFromAnnotation(item);
      if (record && this.wasRecentlyCaptured(record)) {
        continue;
      }
      if (record) {
        captured.push(record);
      }
    }

    if (captured.length) {
      const changedRecords = this.upsertRecords(captured);
      if (changedRecords.length) {
        this.showCaptureToast(changedRecords);
      }
    }
  }

  private static isWatchedHighlightAnnotation(item: ZoteroItem) {
    if (typeof item.isAnnotation === "function" && !item.isAnnotation()) {
      return false;
    }

    if (item.annotationType && item.annotationType !== "highlight") {
      return false;
    }

    const text = this.getAnnotationText(item);
    if (!text) {
      return false;
    }

    return Boolean(getMappingForColor(item.annotationColor));
  }

  private static async recordFromAnnotation(
    annotation: ZoteroItem,
  ): Promise<VocabRecord | undefined> {
    const text = this.getAnnotationText(annotation);
    if (!text) {
      return undefined;
    }

    const attachment = annotation.parentItemID
      ? (Zotero.Items.get(annotation.parentItemID) as ZoteroItem | false)
      : false;
    const parentItem =
      attachment && attachment.parentItemID
        ? (Zotero.Items.get(attachment.parentItemID) as ZoteroItem | false)
        : attachment || false;
    const paperTitle = parentItem ? this.getTitle(parentItem) : "";
    const category = getMappingForColor(annotation.annotationColor);
    const contextSentence = getPref("fieldContextSentence")
      ? await this.getContextSentence(text, attachment)
      : "";
    const excerptDate = this.toISOString(annotation.dateAdded);

    const now = new Date().toISOString();
    return {
      text,
      normalizedText: this.normalizeVocabularyText(text),
      categoryLabel: category?.label || "",
      categorySlug: category?.slug || "",
      translation: this.cleanText(annotation.annotationComment),
      paperTitle,
      excerptDate,
      contextSentence,
      contextSource:
        contextSentence && contextSentence !== text
          ? "fulltext-cache"
          : "annotation",
      annotationKey: annotation.key,
      annotationID: annotation.id,
      annotationColor: normalizeColor(annotation.annotationColor),
      annotationComment: this.cleanText(annotation.annotationComment),
      attachmentKey: attachment ? attachment.key : undefined,
      attachmentTitle: attachment ? this.getTitle(attachment) : undefined,
      itemKey: parentItem ? parentItem.key : undefined,
      itemTitle: paperTitle,
      libraryID: annotation.libraryID,
      pageLabel: this.cleanText(annotation.annotationPageLabel),
      createdAt: excerptDate,
      updatedAt: now,
    };
  }

  private static upsertRecords(records: VocabRecord[]) {
    const existingRecords = this.getRecords();
    const byAnnotationKey = new Map(
      existingRecords.map((record) => [record.annotationKey, record]),
    );
    const changedRecords: VocabRecord[] = [];

    for (const record of records) {
      const existingRecord = byAnnotationKey.get(record.annotationKey);
      if (existingRecord && this.recordsEqual(existingRecord, record)) {
        continue;
      }

      const nextRecord = {
        ...existingRecord,
        ...record,
      };
      byAnnotationKey.set(record.annotationKey, nextRecord);
      changedRecords.push(nextRecord);
    }

    if (!changedRecords.length) {
      return [];
    }

    const nextRecords = Array.from(byAnnotationKey.values()).sort((a, b) =>
      b.updatedAt.localeCompare(a.updatedAt),
    );
    setPref("records", JSON.stringify(nextRecords));
    setPref("lastCapturedAt", new Date().toISOString());
    ztoolkit.log(
      "Highlight Collector captured records",
      changedRecords,
      nextRecords,
    );
    return changedRecords;
  }

  static getRecords(): VocabRecord[] {
    try {
      const raw = getPref("records");
      return typeof raw === "string" ? JSON.parse(raw) : [];
    } catch (error) {
      ztoolkit.log("Failed to parse vocab records", error);
      return [];
    }
  }

  private static showCaptureToast(records: VocabRecord[]) {
    const preview = records
      .slice(0, 3)
      .map((record) => record.text)
      .join(", ");
    new ztoolkit.ProgressWindow(addon.data.config.addonName)
      .createLine({
        text: `Captured ${records.length} highlight(s): ${preview}`,
        type: "success",
      })
      .show();
  }

  private static wasRecentlyCaptured(record: VocabRecord) {
    const key = [
      record.annotationKey,
      record.text,
      record.translation || "",
      record.annotationComment || "",
    ].join("::");
    const now = Date.now();
    addon.data.captureEvents ||= {};

    const lastCapturedAt = addon.data.captureEvents[key] || 0;
    addon.data.captureEvents[key] = now;

    for (const [eventKey, timestamp] of Object.entries(
      addon.data.captureEvents,
    )) {
      if (now - timestamp > 10000) {
        delete addon.data.captureEvents[eventKey];
      }
    }

    return now - lastCapturedAt < 2500;
  }

  private static recordsEqual(existing: VocabRecord, next: VocabRecord) {
    const keys: Array<keyof VocabRecord> = [
      "text",
      "normalizedText",
      "categoryLabel",
      "categorySlug",
      "translation",
      "paperTitle",
      "excerptDate",
      "contextSentence",
      "contextSource",
      "annotationColor",
      "annotationComment",
      "attachmentKey",
      "attachmentTitle",
      "itemKey",
      "itemTitle",
      "libraryID",
      "pageLabel",
      "createdAt",
    ];

    return keys.every((key) => existing[key] === next[key]);
  }

  private static getAnnotationText(item: ZoteroItem) {
    return this.cleanText(item.annotationText);
  }

  private static normalizeVocabularyText(text: string) {
    return text.trim().replace(/\s+/g, " ").toLocaleLowerCase();
  }

  private static async getContextSentence(
    text: string,
    attachment: ZoteroItem | false,
  ) {
    if (this.looksLikeSentence(text)) {
      return text;
    }

    const fullText = await this.getAttachmentFullText(attachment);
    if (!fullText) {
      return "";
    }

    return this.findSentenceContainingText(fullText, text);
  }

  private static async getAttachmentFullText(attachment: ZoteroItem | false) {
    if (!attachment) {
      return "";
    }

    try {
      const cacheFile = Zotero.Fulltext.getItemCacheFile(attachment);
      if (!cacheFile?.exists()) {
        return "";
      }

      const contents = await Zotero.File.getContentsAsync(cacheFile, "utf-8");
      if (typeof contents === "string") {
        return contents;
      }
      return "";
    } catch (error) {
      ztoolkit.log("Failed to read full-text cache for context", error);
      return "";
    }
  }

  private static findSentenceContainingText(fullText: string, text: string) {
    const normalizedFullText = this.cleanText(fullText);
    const normalizedNeedle = this.normalizeVocabularyText(text);
    if (!normalizedFullText || !normalizedNeedle) {
      return "";
    }

    const sentencePattern = /[^.!?。！？]+(?:[.!?。！？]+|$)/g;
    const sentences = normalizedFullText.match(sentencePattern) || [
      normalizedFullText,
    ];
    const escapedNeedle = this.escapeRegExp(normalizedNeedle);
    const wordBoundary =
      /^[a-z0-9-]+$/i.test(normalizedNeedle) && !normalizedNeedle.includes(" ")
        ? "\\b"
        : "";
    const needlePattern = new RegExp(
      `${wordBoundary}${escapedNeedle}${wordBoundary}`,
      "i",
    );

    const sentence = sentences.find((candidate) =>
      needlePattern.test(candidate),
    );
    return sentence ? this.cleanText(sentence) : "";
  }

  private static looksLikeSentence(text: string) {
    return /[.!?。！？]$/.test(text) || this.cleanText(text).split(" ").length > 8;
  }

  private static escapeRegExp(text: string) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  private static cleanText(value: unknown) {
    return typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
  }

  private static getTitle(item: ZoteroItem) {
    if (typeof item.getField === "function") {
      return this.cleanText(item.getField("title"));
    }
    return "";
  }

  private static toISOString(value: unknown) {
    if (!value) {
      return undefined;
    }
    const date = new Date(String(value));
    return Number.isNaN(date.getTime()) ? String(value) : date.toISOString();
  }

}
