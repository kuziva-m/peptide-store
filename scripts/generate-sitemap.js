import { generateSeoAssets } from "./prerender-seo.js";

generateSeoAssets({ writeHtml: false, writePublic: true, writeDist: false }).catch(
  (error) => {
    console.error(error);
    process.exitCode = 1;
  },
);
