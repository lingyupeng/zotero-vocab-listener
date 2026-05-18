# Publishing

This repository is prepared for GitHub open-source publishing, but it still
needs your real GitHub account metadata before the first public release.

## 1. Replace Placeholders

In `package.json`, replace:

- `YOUR_GITHUB_USERNAME`
- `YOUR_NAME`

Then rebuild:

```sh
npm run build
```

## 2. Create the GitHub Repository

Create an empty public repository named:

```text
zotero-vocab-listener
```

Then push:

```sh
git remote add origin git@github.com:YOUR_GITHUB_USERNAME/zotero-vocab-listener.git
git push -u origin main
```

HTTPS also works:

```sh
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/zotero-vocab-listener.git
git push -u origin main
```

## 3. Release

Create and push a version tag:

```sh
git tag v0.1.6
git push origin v0.1.6
```

The release workflow builds the XPI and uploads release artifacts.

## 4. Community Listing

After the first release works, submit the plugin to community Zotero plugin
indexes, such as `zotero-chinese/zotero-plugins`, with the repository URL,
release URL, description, license, and Zotero compatibility range.
