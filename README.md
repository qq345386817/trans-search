# Translate & Search website

A static, multilingual online query-translation tool and product website. No account, server-side query database, saved search history, or custom app/extension usage tracking is implemented. The website retains official Cloudflare Web Analytics for visits and page performance.

## Develop and verify

```bash
npm ci
npm run verify
python3 -m http.server 8769 --bind 127.0.0.1
```

The tool defaults to browser on-device translation using the Translator and LanguageDetector APIs where supported. Models may need an initial download; query text is processed locally. Unsupported APIs, language pairs, low-confidence detection, and download failures expose manual recovery without silently calling an online provider. Users can explicitly select Google online translation. Online requests have a six-second timeout per attempt and retry once only for transient failures; they omit credentials and referrers. Google's web endpoint is not the authenticated Cloud Translation API and has no service guarantee. Query input stays in page memory and is not put in site URLs or persistent storage. Opening a search deliberately sends that query to the chosen engine.

## Files

- `_templates/`: editable HTML templates, including the homepage tool and FAQ.
- `translations.js`: English, Simplified Chinese, and Traditional Chinese source copy.
- `locales/*.json` / `site-locales.json`: eight additional complete locales and the shared locale registry, including Arabic RTL.
- `site-pages.json`: indexable pages, including technical and learning use cases.
- `search-core.js` / `search.js`: query translation and browser interactions.
- `scripts/build-site.mjs`: renders 77 canonical pages across 11 locales and 11 legacy help redirects, metadata, canonical links, reciprocal hreflang, structured data, sitemap, robots.txt, and llms.txt.
- `scripts/validate-site.mjs`: validates the generated site without running page JavaScript.
- `scripts/page-lastmod.json`: content hashes and actual generation dates; unchanged pages retain their lastmod on repeated builds.
- `site-config.json`: canonical deployment base URL. Set this to the confirmed production URL before publication. `SITE_URL` overrides it for verification.

English lives at the website root. Other locales use `zh-Hans/`, `zh-Hant/`, `ja/`, `ko/`, `es/`, `fr/`, `de/`, `pt/`, `ar/`, and `hi/`. Arabic pages use `dir="rtl"`. Language switching keeps the current page type. Old `?lang=` links redirect to physical locale pages. Browser language or local storage does not rewrite canonical URLs or the main page content. Old `how_to_use.html` pages redirect to localized help, are marked noindex, and are excluded from the sitemap.

## Publication and Search Console

Cloudflare Pages uses production branch `main`, build command `npm run build:pages`, and output directory `dist`. The packaging script copies only public pages and browser assets; templates, tests, and Node dependencies stay outside the deployment. Run `npm run verify` before committing. Canonical URLs use extensionless routes to match Cloudflare Pages redirects.

The confirmed production domain is `https://trans-search.luopeike.com/`. Attach this custom domain to the Cloudflare Pages project and verify HTTPS before submitting the sitemap to its GSC URL-prefix property. `robots.txt`, `sitemap.xml`, and `llms.txt` are served at this origin root. The old inherited GitHub Pages URL is a legacy copy; its canonical tags point to the confirmed domain. Cloudflare Bulk Redirects sends `trans-search.pages.dev/` to this custom domain with status 301 and preserves paths and query strings. This is an account dashboard rule, not a repository `_redirects` rule. `_headers` keeps cache revalidation and security headers while allowing Cloudflare’s official Web Analytics beacon to be automatically injected. The existing dashboard setting remains enabled, excluding visitor data in the EU. Do not add a duplicate manual beacon. Custom app/extension usage tracking remains deferred.

In GSC, check the matching property and concrete excluded-URL examples. Submit the deployed sitemap and request indexing only for real, indexable pages. A successful sitemap submission or accepted indexing request does not prove that all URLs are indexed. Canonical aliases and compatibility redirects can legitimately remain excluded.

## GEO

The site includes plain-language FAQ content, visible product limitations, structured data matching the HTML, and a concise `llms.txt` project map. `llms.txt` is optional guidance for systems that choose to consume it, not a requirement or ranking guarantee for Google's AI features. Prioritize crawlability, stable canonical URLs, useful content, and a working tool.

The app and extension are not officially launched. Links currently lead to the setup guide and test-version contact instead of unverified store listings.

The technical and learning guides include original-source links and known demo presets. A guide link passes only a public preset identifier (`?example=technical` or `?example=learning`), never a user query. The tool removes the identifier after loading the preset. Generated locale copy was bootstrapped from English and checked for complete keys, preserved markup/format placeholders, and native-language core controls; further native-speaker review remains useful.
