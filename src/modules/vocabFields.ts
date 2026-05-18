import { getPref } from "../utils/prefs";
import type { VocabRecord } from "./vocabListener";

export type VocabFieldKey =
  | "category"
  | "word"
  | "paperTitle"
  | "excerptDate"
  | "translation"
  | "contextSentence"
  | "pageLabel";

export interface VocabField {
  key: VocabFieldKey;
  label: string;
  prefKey:
    | "fieldCategory"
    | "fieldWord"
    | "fieldPaperTitle"
    | "fieldExcerptDate"
    | "fieldTranslation"
    | "fieldContextSentence"
    | "fieldPageLabel";
  value: (record: VocabRecord) => string;
}

export const VOCAB_FIELDS: VocabField[] = [
  {
    key: "category",
    label: "Category",
    prefKey: "fieldCategory",
    value: (record) => record.categoryLabel || "",
  },
  {
    key: "word",
    label: "Word",
    prefKey: "fieldWord",
    value: (record) => record.text,
  },
  {
    key: "paperTitle",
    label: "Paper",
    prefKey: "fieldPaperTitle",
    value: (record) => record.paperTitle || record.itemTitle || "",
  },
  {
    key: "excerptDate",
    label: "Date",
    prefKey: "fieldExcerptDate",
    value: (record) => formatDate(record.excerptDate || record.createdAt),
  },
  {
    key: "translation",
    label: "Translation",
    prefKey: "fieldTranslation",
    value: (record) => record.translation || record.annotationComment || "",
  },
  {
    key: "contextSentence",
    label: "Context",
    prefKey: "fieldContextSentence",
    value: (record) => record.contextSentence || "",
  },
  {
    key: "pageLabel",
    label: "Page",
    prefKey: "fieldPageLabel",
    value: (record) => record.pageLabel || "",
  },
];

export function getEnabledVocabFields() {
  const enabledFields = VOCAB_FIELDS.filter((field) => getPref(field.prefKey));
  return enabledFields.length ? enabledFields : VOCAB_FIELDS;
}

export function formatDate(value: string | undefined) {
  if (!value) {
    return "";
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}
