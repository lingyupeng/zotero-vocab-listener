import { getEnabledVocabFields } from "./vocabFields";
import { VocabListener, type VocabRecord } from "./vocabListener";

export class VocabExporter {
  static async exportCSV(records = VocabListener.getRecords()) {
    const path = await this.pickSavePath("Export Vocabulary CSV", "vocab.csv", [
      ["CSV File(*.csv)", "*.csv"],
      ["Any", "*.*"],
    ]);
    if (!path) {
      return;
    }

    const csv = this.toCSV(records);
    await Zotero.File.putContentsAsync(this.ensureExtension(path, ".csv"), csv);
    this.showExportToast(records.length, "CSV");
  }

  static async exportAnki(records = VocabListener.getRecords()) {
    const path = await this.pickSavePath(
      "Export Vocabulary for Anki",
      "vocab-anki.txt",
      [
        ["Text File(*.txt)", "*.txt"],
        ["Any", "*.*"],
      ],
    );
    if (!path) {
      return;
    }

    const ankiText = this.toAnkiTSV(records);
    await Zotero.File.putContentsAsync(
      this.ensureExtension(path, ".txt"),
      ankiText,
    );
    this.showExportToast(records.length, "Anki text");
  }

  private static async pickSavePath(
    title: string,
    suggestion: string,
    filters: [string, string][],
  ) {
    return new ztoolkit.FilePicker(
      title,
      "save",
      filters,
      suggestion,
    ).open();
  }

  private static toCSV(records: VocabRecord[]) {
    const fields = getEnabledVocabFields();
    const rows = [
      fields.map((field) => this.escapeCSV(field.label)).join(","),
      ...records.map((record) =>
        fields.map((field) => this.escapeCSV(field.value(record))).join(","),
      ),
    ];
    return `${rows.join("\n")}\n`;
  }

  private static toAnkiTSV(records: VocabRecord[]) {
    const rows = records.map((record) => {
      const front = record.text;
      const back = [
        record.translation || record.annotationComment || "",
        record.contextSentence ? `Context: ${record.contextSentence}` : "",
        record.paperTitle || record.itemTitle
          ? `Paper: ${record.paperTitle || record.itemTitle}`
          : "",
        record.pageLabel ? `Page: ${record.pageLabel}` : "",
      ]
        .filter(Boolean)
        .join("<br>");
      const tags = "zotero vocab-listener";
      return [front, back, tags].map((value) => this.escapeTSV(value)).join("\t");
    });
    return `${rows.join("\n")}\n`;
  }

  private static escapeCSV(value: string) {
    const normalizedValue = this.normalizeText(value);
    return `"${normalizedValue.replace(/"/g, '""')}"`;
  }

  private static escapeTSV(value: string) {
    return this.normalizeText(value).replace(/\t/g, " ");
  }

  private static normalizeText(value: string) {
    return String(value || "").replace(/\r?\n/g, " ").trim();
  }

  private static ensureExtension(path: string, extension: string) {
    return path.toLowerCase().endsWith(extension) ? path : `${path}${extension}`;
  }

  private static showExportToast(count: number, kind: string) {
    new ztoolkit.ProgressWindow(addon.data.config.addonName)
      .createLine({
        text: `Exported ${count} record(s) as ${kind}.`,
        type: "success",
      })
      .show();
  }
}
