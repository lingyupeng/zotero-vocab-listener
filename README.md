# Zotero Highlight Collector

Zotero Highlight Collector turns Zotero PDF highlights into a personal research
dataset. Map highlight colors to meanings such as Vocabulary, Core Claim,
Quote, Method, Conclusion, or Idea, and the plugin will collect matching
annotations with source metadata for filtering and export.

> Status: early MVP. Tested locally with Zotero 9 during development.

## Features

- Listen for new or modified Zotero PDF highlight annotations.
- Map each watched highlight color to a category.
- Record category, highlight text, paper title, excerpt date, annotation
  comment translation, context sentence, and page label.
- Show a unified Highlight Dataset panel from Zotero's Tools menu.
- Edit color-to-category mappings in the panel.
- Filter records by category.
- Configure visible/exported fields.
- Export the dataset as CSV.
- Export Anki-friendly tab-separated text for vocabulary review.
- Store data locally in Zotero preferences.

## Privacy

This plugin works locally inside Zotero. It does not upload your papers,
annotations, vocabulary, translations, highlights, or metadata to any external
service.

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
2. Highlight text using a color that you mapped to a research category.
3. Open `Tools` -> `Highlight Collector: Show Dataset`.
4. Review captured highlights, edit color/category mappings, filter by
   category, or export CSV/Anki text.

## Suggested Color Categories

You can choose your own system. A common setup is:

| Color | Category |
| --- | --- |
| Gray | Vocabulary |
| Yellow | Core Claim |
| Blue | Quote |
| Green | Method |
| Red | Conclusion |
| Purple | Idea |

## Translation Plugin Workflow

This plugin does not translate text by itself. It reads Zotero annotation
comments and stores them as the Translation field.

If you use a Zotero Translate / PDF Translate plugin, enable the option that
automatically fills translations into annotation comments. Then this plugin can
capture both the highlighted text and its translation.

## Anki Import

The Anki export is a tab-separated `.txt` file with three fields:

```text
Front    Back    Tags
```

When importing into Anki, choose a note type with at least two fields, map
`Front` to the word/phrase and `Back` to the combined category,
translation/context/source content. The third field can be imported as tags.

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
.scaffold/build/zotero-highlight-collector.xpi
```

## Release

Create a GitHub release and upload the generated XPI, or push a version tag to
run the included release workflow.

## Roadmap

- Scan existing highlights on demand.
- Jump from a dataset row back to the source annotation.
- Improve context extraction using annotation position/page text.
- Add richer export templates, such as literature review CSV and quote bank
  Markdown.

## Credits

Bootstrapped from
[windingwind/zotero-plugin-template](https://github.com/windingwind/zotero-plugin-template).
