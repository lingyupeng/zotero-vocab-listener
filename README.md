# Zotero Vocab Listener

Zotero Vocab Listener is a Zotero plugin that collects vocabulary from PDF
highlight annotations. It watches configurable highlight colors, records the
source paper and annotation metadata, shows a vocabulary table inside Zotero,
and exports the list for CSV or Anki review.

> Status: early MVP. Tested locally with Zotero 9 during development.

## Features

- Listen for new or modified Zotero PDF highlight annotations.
- Collect highlights whose color matches user-configured hex colors.
- Record word or phrase, paper title, excerpt date, annotation comment
  translation, context sentence, and page label.
- Show a unified Vocabulary panel from Zotero's Tools menu.
- Configure watched colors and visible/exported fields in the same panel.
- Export vocabulary as CSV.
- Export Anki-friendly tab-separated text.
- Store data locally in Zotero preferences.

## Privacy

This plugin works locally inside Zotero. It does not upload your papers,
annotations, vocabulary, translations, or metadata to any external service.

See [PRIVACY.md](PRIVACY.md) for details.

## Installation

1. Download the latest `.xpi` from GitHub Releases.
2. Open Zotero.
3. Go to `Tools` -> `Add-ons`.
4. Click the gear icon.
5. Choose `Install Add-on From File...`.
6. Select the downloaded `.xpi`.
7. Restart Zotero.

## Usage

1. Open a PDF in Zotero.
2. Highlight an unfamiliar word or phrase with one of the watched colors.
3. Open `Tools` -> `Vocab Listener: Show Vocabulary`.
4. Review captured vocabulary, adjust settings, or export CSV/Anki text.

## Anki Import

The Anki export is a tab-separated `.txt` file with three fields:

```text
Front    Back    Tags
```

When importing into Anki, choose a note type with at least two fields, map
`Front` to the word/phrase and `Back` to the combined translation/context/source
content. The third field can be imported as tags.

## Development

Install dependencies:

```sh
npm ci
```

Build the plugin:

```sh
npm run build
```

The XPI is generated at:

```text
.scaffold/build/vocab-listener.xpi
```

## Release

Create a GitHub release and upload the generated XPI, or push a version tag to
run the included release workflow.

## Roadmap

- Scan existing highlights on demand.
- Jump from a vocabulary row back to the source annotation.
- Improve context extraction using annotation position/page text.
- Add richer import/export templates.

## Credits

Bootstrapped from
[windingwind/zotero-plugin-template](https://github.com/windingwind/zotero-plugin-template).
