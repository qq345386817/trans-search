# Translate & Search website

A static, multilingual online query-translation tool and product website. No account, server-side query database, or saved search history is implemented.

## Develop and verify

```bash
npm ci
npm run verify
python3 -m http.server 8769 --bind 127.0.0.1
```

The browser tool sends translation requests directly to Google's web translation endpoint, then lets the user edit the translation and open Google, Bing, Baidu, or Sogou. This endpoint is not the authenticated Google Cloud Translation API and has no reliability guarantee. A failed request exposes an editable field for a user's own translation and keeps original search available. Provider requests omit credentials. Query input is not persisted or placed in the website URL.

## Files

- `_templates/`: editable HTML templates, including the homepage tool and FAQ.
- `translations.js`: English, Simplified Chinese, and Traditional Chinese copy.
- `search-core.js` / `search.js`: query translation and browser interactions.
- `scripts/build-site.mjs`: renders 15 canonical pages and 3 legacy help redirects, metadata, canonical links, reciprocal hreflang, structured data, sitemap, robots.txt, and llms.txt.
- `scripts/validate-site.mjs`: validates the generated site without running page JavaScript.
- `scripts/page-lastmod.json`: content hashes and actual generation dates; unchanged pages retain their lastmod on repeated builds.
- `site-config.json`: canonical deployment base URL. Set this to the confirmed production URL before publication. `SITE_URL` overrides it for verification.

English lives at the website root. Chinese locales use `zh-Hans/` and `zh-Hant/`. Old `?lang=` links redirect to physical locale pages. Browser language or local storage does not rewrite canonical URLs or the main page content. Old `how_to_use.html` pages redirect to localized help, are marked noindex, and are excluded from the sitemap.

## Publication and Search Console

Cloudflare Pages uses production branch `main`, build command `npm run build:pages`, and output directory `dist`. The packaging script copies only public pages and browser assets; templates, tests, and Node dependencies stay outside the deployment. Run `npm run verify` before committing. Canonical URLs use extensionless routes to match Cloudflare Pages redirects.

The confirmed production domain is `https://trans-search.luopeike.com/`. Attach this custom domain to the Cloudflare Pages project and verify HTTPS before submitting the sitemap to its GSC URL-prefix property. `robots.txt`, `sitemap.xml`, and `llms.txt` are served at this origin root. The old inherited GitHub Pages URL is a legacy copy; its canonical tags point to the confirmed domain.

In GSC, check the matching property and concrete excluded-URL examples. Submit the deployed sitemap and request indexing only for real, indexable pages. A successful sitemap submission or accepted indexing request does not prove that all URLs are indexed. Canonical aliases and compatibility redirects can legitimately remain excluded.

## GEO

The site includes plain-language FAQ content, visible product limitations, structured data matching the HTML, and a concise `llms.txt` project map. `llms.txt` is optional guidance for systems that choose to consume it, not a requirement or ranking guarantee for Google's AI features. Prioritize crawlability, stable canonical URLs, useful content, and a working tool.

The app and extension are not officially launched. Links currently lead to the setup guide and test-version contact instead of unverified store listings.
