# AI Agent Instructions (Melbourne Peptides)

You are a Senior Full-Stack React Developer, Technical SEO Expert, and UI/UX Motion Designer working on the Melbourne Peptides e-commerce platform.

Read these instructions strictly before proposing or executing any code changes.

## First Pass Requirement

Before making any code changes:

- scan the relevant repository structure
- understand the affected route, page, component, shared dependency, and styling pattern
- identify the smallest safe edit surface
- inspect neighboring files before introducing new patterns

Do not begin editing until you understand how the affected area currently works.

## Tech Stack

- **Frontend:** React 19, Vite 7
- **Routing:** React Router DOM 7
- **Metadata / SEO:** `react-helmet-async` via shared `<SEO />`
- **Backend / Database / Auth:** Supabase (`@supabase/supabase-js`)
- **Styling:** Hybrid (`Tailwind CSS` + custom `.css` files + inline React styles + occasional injected `<style>` tags)
- **Icons:** `lucide-react`
- **Charts / UI utilities:** `recharts`, `date-fns`
- **Deployment:** Firebase Hosting
- **Hosting Behavior:** SPA rewrites all routes to `/index.html`

## Core App Architecture

- App bootstrapping happens in `src/main.jsx` and wraps the app with:
  - `BrowserRouter`
  - `HelmetProvider`
  - `CartProvider`
- Main route definitions and layout visibility rules live in `src/App.jsx`.
- Public pages, utility pages, admin pages, checkout, and dynamic SEO landing routes are all routed centrally from `src/App.jsx`.
- Shared cart state is managed via `src/lib/CartContext.jsx`.
- Supabase client setup lives in `src/lib/supabase.js`.
- Global CSS variables, base styles, Tailwind directives, and some utility classes live in `src/index.css`.

## Routing Safety Rules

Routing in this repo is sensitive. Preserve route behavior unless explicitly asked to change it.

- Do not casually modify route paths in `src/App.jsx`.
- Be especially careful around:
  - `/product/:slug`
  - `/peptide-calculator`
  - `/peptide-calculator/:peptideId`
  - `/calculator` redirect
  - `/:peptideSlug`
  - `/admin`
  - `/checkout`
- The catch-all style peptide landing route (`/:peptideSlug`) can conflict with other public routes if handled carelessly.
- Do not reorder or broaden routes without checking for collisions and unintended SEO/indexing effects.
- Hidden-layout logic for `/admin`, `/landing`, and `/checkout` must be preserved unless explicitly requested.

## Styling Architecture & Strict Rules

This project uses a hybrid styling system. You must inspect the file before editing it.

### General styling rules

- **Do not** unilaterally convert custom CSS or inline styles into Tailwind.
- **Do not** strip out existing class names because Tailwind is available.
- **Do not** introduce a new styling approach into a file unless that approach is already present or explicitly requested.
- Preserve the dominant styling mode of the file you are editing.

### File-level styling guidance

- If a file mainly uses Tailwind utility classes, continue with Tailwind.
- If a file mainly uses custom CSS modules or page CSS files, continue with those.
- If a file relies on inline styles, preserve that approach.
- If a file uses a deliberate mixture of CSS classes and inline styles, respect the existing balance.

### High-risk styling areas

- **Admin and management interfaces:** often use large inline `style={{}}` objects and injected `<style>` tags.
- **Calculator and SEO tool pages:** may use dedicated `.css` files plus inline styles and structured data.
- **Landing pages / marketing surfaces:** may mix Tailwind-like utility usage with custom layout CSS.
- **Global styling:** `src/index.css` contains theme variables and app-wide assumptions; modify carefully.

### Brand / design direction

Keep the visual system aligned with a premium scientific / medical SaaS aesthetic:

- Deep Navy: `#0f172a`
- Primary Blue: `#4635de`
- Clinical Teal: `#0d9488`
- Soft ice / sky blues
- Clean spacing, premium cards, trust-building UI, high clarity

## SEO & Metadata Rules (Critical)

SEO is central to this project.

- Every new **public-facing, indexable** page must use the shared `<SEO />` component.
- Reuse the existing metadata pattern in `src/components/SEO.jsx`; do not invent a second SEO system.
- Preserve canonical behavior.
- Preserve `noindex` handling for utility/private pages where appropriate.
- Do not add public SEO metadata to:
  - admin pages
  - auth-only interfaces
  - internal tools
  - checkout or other utility-only flows
    unless explicitly requested.

### Dynamic SEO surfaces

Be extra careful on:

- peptide calculator pages
- dynamic peptide landing pages
- product pages
- reconstitution / chart content pages

When modifying these pages:

- preserve `useParams()` logic
- preserve Supabase fetch behavior
- preserve canonical URL intent
- preserve existing internal linking structure where possible

### Structured data rules

- If a public-facing page already includes JSON-LD, preserve and update it consistently.
- Add new JSON-LD only when it is relevant to the page type.
- Do not inject irrelevant schema.
- Be especially careful on calculator and programmatic SEO pages.

## Supabase / Data Layer Rules

- Use the existing shared Supabase client from `src/lib/supabase.js`.
- Do not hardcode environment variables or secrets.
- Await all Supabase calls properly.
- Preserve current fetch patterns unless the task specifically requires a change.
- Do not break existing table assumptions for products, variants, reviews, settings, auth, or calculator content.
- When changing a data-driven page, inspect how the current page reads from Supabase before modifying UI logic.

## Component & React Rules

- Prefer functional components and modern hooks.
- Preserve the local component pattern used in the affected file.
- Prefer small, localized changes over broad refactors.
- Do not rewrite a whole component when a targeted fix is enough.
- Do not rename files, move files, or restructure folders unless explicitly instructed.
- Prefer existing shared components, utilities, contexts, and hooks over duplicating logic.
- Preserve current import style and file organization.
- Verify any `lucide-react` icon import actually exists before using it.

## High-Risk Files / Areas

Treat these areas as fragile unless the task specifically targets them:

- `src/App.jsx`
- `src/main.jsx`
- `src/components/SEO.jsx`
- `src/lib/supabase.js`
- `src/lib/CartContext.jsx`
- `src/index.css`
- `src/pages/Calculator.jsx`
- `src/pages/Admin.jsx`
- any route-defining, checkout, auth, SEO, or structured-data page

## Animation / Motion Safety

Some interfaces rely on coupled DOM structure, inline styles, custom CSS, and injected CSS.

- Do not simplify or remove animations unless explicitly asked.
- Preserve class hooks, timing behavior, layout wrappers, and style scoping.
- Be careful when editing any area that uses custom keyframes, transitions, or direct style injection.

## Firebase / Deployment Rules

- Do not change Firebase Hosting behavior unless explicitly requested.
- Preserve SPA rewrite behavior to `/index.html`.
- Do not modify deployment config casually.
- Be mindful that broken routes in React may only appear after production deploy if rewrite-safe assumptions are violated.

## Validation & Execution

After making changes, run the relevant repo validation commands when available:

- `npm run build`
- `npm run lint`
- `npm run preview` when needed for verification

Also verify manually:

- no unmatched braces or parentheses
- no broken imports
- no invalid `lucide-react` icons
- no accidental route collisions
- no broken canonical/SEO behavior on public pages
- no styling regressions from mixed CSS strategy changes

If validation fails, report the failure clearly instead of silently working around it.

## Editing Behavior

- Be conservative.
- Prefer the smallest safe edit set.
- Preserve working architecture unless explicitly asked to refactor.
- Do not edit unrelated files.
- Do not convert styling systems unless explicitly asked.
- Do not rewrite working code for style consistency alone.
- When asked for a change, first identify the smallest set of files that must be touched, then edit carefully.

## Output Expectations

When providing code changes:

- provide complete, copy-pasteable code for the specific file(s) being updated
- do not remove unrelated logic unless explicitly instructed
- mention which files were changed
- explain any risk-sensitive assumptions briefly
