import fs from "fs";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY,
);

const escapeXml = (str) =>
  str.replace(
    /[<>&'"]/g,
    (c) =>
      ({
        "<": "&lt;",
        ">": "&gt;",
        "&": "&amp;",
        '"': "&quot;",
        "'": "&apos;",
      })[c],
  );

async function generateSitemap() {
  const { data: products, error } = await supabase
    .from("products")
    .select("slug, image_url, updated_at, variants(image_url)")
    .eq("is_hidden", false);

  if (error) return console.error("Supabase error:", error);

  const baseUrl = "https://melbournepeptides.com.au";
  const lastmod = new Date().toISOString().split("T")[0];

  const staticPages = [
    { url: "", priority: "1.0", freq: "weekly" },
    { url: "shop", priority: "0.9", freq: "daily" },
    { url: "peptide-calculator", priority: "0.85", freq: "monthly" },
    { url: "faq", priority: "0.6", freq: "monthly" },
    { url: "shipping", priority: "0.6", freq: "monthly" },
    { url: "contact", priority: "0.5", freq: "monthly" },
  ];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">`;

  staticPages.forEach((p) => {
    xml += `
  <url>
    <loc>${escapeXml(p.url ? `${baseUrl}/${p.url}` : baseUrl)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${p.freq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`;
  });

  products.forEach((p) => {
    const images = [p.image_url, ...p.variants.map((v) => v.image_url)].filter(
      Boolean,
    );
    xml += `
  <url>
    <loc>${escapeXml(`${baseUrl}/product/${p.slug}`)}</loc>
    <lastmod>${p.updated_at ? p.updated_at.split("T")[0] : lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>`;
    images.forEach((img) => {
      xml += `
    <image:image>
      <image:loc>${escapeXml(img)}</image:loc>
    </image:image>`;
    });
    xml += `
  </url>`;
  });

  xml += `\n</urlset>`;
  fs.writeFileSync("public/sitemap.xml", xml);
  console.log("✅ Sitemap generated.");
}

generateSitemap();
