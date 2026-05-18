// @ts-check Let TS check this config file

import zotero from "@zotero-plugin/eslint-config";

export default zotero({
  overrides: [
    {
      files: ["**/*.ts"],
      rules: {
        // Zotero plugin hook signatures often include arguments that are kept
        // for API clarity even when a module does not use every value.
        "@typescript-eslint/no-unused-vars": "off",
      },
    },
  ],
});
