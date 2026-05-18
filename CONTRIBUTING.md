# Contributing

Issues and pull requests are welcome.

## Local Setup

```sh
npm ci
npm run build
```

For development with live reload, configure `.env` from `.env.example` and run:

```sh
npm start
```

## Notes

- Keep vocabulary data local unless a feature explicitly asks the user to export
  it.
- Avoid changing Zotero annotations unless the user triggers a clear action.
- Keep support for Zotero 9 in mind when changing manifest or runtime APIs.
