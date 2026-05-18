import { VocabListener, VocabRecord } from "./vocabListener";
import { getEnabledVocabFields, VOCAB_FIELDS } from "./vocabFields";
import { getPref, setPref } from "../utils/prefs";
import { VocabExporter } from "./vocabExporter";

export class VocabWindow {
  static registerMenuItem() {
    ztoolkit.Menu.register("menuTools", {
      tag: "menuitem",
      label: "Vocab Listener: Show Vocabulary",
      oncommand: "Zotero.VocabListener.hooks.onDialogEvents('showVocabulary')",
    });
  }

  static show() {
    const records = VocabListener.getRecords();
    const dialogData: { loadCallback: () => void } = {
      loadCallback: () => {
        this.renderPanel(addon.data.dialog?.window, records);
      },
    };

    addon.data.dialog = new ztoolkit.Dialog(1, 1)
      .addCell(0, 0, {
        tag: "div",
        namespace: "html",
        id: "vocab-listener-root",
        styles: {
          boxSizing: "border-box",
          width: "100%",
          height: "100%",
          overflow: "auto",
          padding: "16px",
          fontFamily:
            "-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
          color: "#222",
        },
      })
      .setDialogData(dialogData)
      .open("Vocab Listener", {
        width: 1120,
        height: 740,
        centerscreen: true,
        resizable: true,
        noDialogMode: true,
      });
  }

  private static renderPanel(win: Window | undefined, records: VocabRecord[]) {
    const doc = win?.document;
    const root = doc?.querySelector("#vocab-listener-root") as
      | HTMLDivElement
      | undefined;
    if (!doc || !root) {
      return;
    }

    root.innerHTML = "";
    root.append(this.createToolbar(doc, records));

    if (!records.length) {
      const empty = doc.createElement("p");
      empty.textContent = "No gray highlights have been captured yet.";
      root.append(empty);
      return;
    }

    const table = doc.createElement("table");
    table.style.width = "100%";
    table.style.borderCollapse = "collapse";
    table.style.fontSize = "13px";
    table.append(this.createHeader(doc));

    const body = doc.createElement("tbody");
    for (const record of records) {
      body.append(this.createRow(doc, record));
    }
    table.append(body);
    root.append(table);
  }

  private static refresh(win: Window | undefined) {
    this.renderPanel(win, VocabListener.getRecords());
  }

  private static createToolbar(doc: Document, records: VocabRecord[]) {
    const wrapper = doc.createElement("div");
    wrapper.style.position = "sticky";
    wrapper.style.top = "0";
    wrapper.style.zIndex = "2";
    wrapper.style.padding = "0 0 14px";
    wrapper.style.background = "#fff";
    wrapper.style.borderBottom = "1px solid #d8d8d8";
    wrapper.style.marginBottom = "12px";

    const topRow = doc.createElement("div");
    topRow.style.display = "flex";
    topRow.style.alignItems = "center";
    topRow.style.justifyContent = "space-between";
    topRow.style.gap = "12px";

    const title = doc.createElement("h1");
    title.textContent = `Vocabulary (${records.length})`;
    title.style.margin = "0";
    title.style.fontSize = "22px";
    topRow.append(title);

    const actions = doc.createElement("div");
    actions.style.display = "flex";
    actions.style.gap = "8px";
    actions.append(
      this.createButton(doc, "Export CSV", () => VocabExporter.exportCSV()),
      this.createButton(doc, "Export Anki", () => VocabExporter.exportAnki()),
    );
    topRow.append(actions);
    wrapper.append(topRow);

    const settings = doc.createElement("div");
    settings.style.display = "grid";
    settings.style.gridTemplateColumns = "minmax(260px, 360px) 1fr";
    settings.style.gap = "16px";
    settings.style.marginTop = "12px";
    settings.append(this.createColorSettings(doc), this.createFieldSettings(doc));
    wrapper.append(settings);
    return wrapper;
  }

  private static createColorSettings(doc: Document) {
    const section = doc.createElement("section");
    const label = doc.createElement("label");
    label.textContent = "Watched colors";
    label.style.display = "block";
    label.style.fontWeight = "600";
    label.style.marginBottom = "4px";

    const input = doc.createElement("input");
    input.type = "text";
    input.value = String(getPref("grayColors") || "");
    input.style.boxSizing = "border-box";
    input.style.width = "100%";
    input.style.padding = "6px 8px";
    input.style.border = "1px solid #aaa";
    input.style.borderRadius = "4px";
    input.addEventListener("change", () => {
      setPref("grayColors", input.value);
      this.refresh(addon.data.dialog?.window);
    });

    const swatches = doc.createElement("div");
    swatches.style.marginTop = "6px";
    for (const color of input.value.split(",").map((value) => value.trim())) {
      if (!color) {
        continue;
      }
      const swatch = doc.createElement("span");
      swatch.title = color;
      swatch.style.display = "inline-block";
      swatch.style.width = "18px";
      swatch.style.height = "18px";
      swatch.style.marginRight = "5px";
      swatch.style.border = "1px solid #888";
      swatch.style.background = color;
      swatches.append(swatch);
    }

    section.append(label, input, swatches);
    return section;
  }

  private static createFieldSettings(doc: Document) {
    const section = doc.createElement("section");
    const label = doc.createElement("div");
    label.textContent = "Visible / exported fields";
    label.style.fontWeight = "600";
    label.style.marginBottom = "4px";
    section.append(label);

    const fields = doc.createElement("div");
    fields.style.display = "flex";
    fields.style.flexWrap = "wrap";
    fields.style.gap = "8px 14px";
    for (const field of VOCAB_FIELDS) {
      const fieldLabel = doc.createElement("label");
      fieldLabel.style.whiteSpace = "nowrap";
      const checkbox = doc.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = Boolean(getPref(field.prefKey));
      checkbox.style.marginRight = "4px";
      checkbox.addEventListener("change", () => {
        setPref(field.prefKey, checkbox.checked);
        this.refresh(addon.data.dialog?.window);
      });
      fieldLabel.append(checkbox, field.label);
      fields.append(fieldLabel);
    }
    section.append(fields);
    return section;
  }

  private static createButton(
    doc: Document,
    label: string,
    onClick: () => void | Promise<void>,
  ) {
    const button = doc.createElement("button");
    button.type = "button";
    button.textContent = label;
    button.style.padding = "6px 10px";
    button.style.border = "1px solid #aaa";
    button.style.borderRadius = "4px";
    button.style.background = "#f7f7f7";
    button.addEventListener("click", () => {
      onClick();
    });
    return button;
  }

  private static createHeader(doc: Document) {
    const header = doc.createElement("thead");
    const row = doc.createElement("tr");
    for (const { label } of getEnabledVocabFields()) {
      const cell = doc.createElement("th");
      cell.textContent = label;
      cell.style.position = "sticky";
      cell.style.top = "0";
      cell.style.zIndex = "1";
      cell.style.padding = "8px";
      cell.style.borderBottom = "1px solid #bbb";
      cell.style.background = "#f6f6f6";
      cell.style.textAlign = "left";
      row.append(cell);
    }
    header.append(row);
    return header;
  }

  private static createRow(doc: Document, record: VocabRecord) {
    const row = doc.createElement("tr");
    const values = getEnabledVocabFields().map((field) => field.value(record));

    for (const value of values) {
      const cell = doc.createElement("td");
      cell.textContent = value;
      cell.style.padding = "8px";
      cell.style.borderBottom = "1px solid #e5e5e5";
      cell.style.verticalAlign = "top";
      cell.style.lineHeight = "1.35";
      row.append(cell);
    }
    return row;
  }
}
