# Student Portfolio Directory

Responsive Next.js directory UI inspired by the provided student hub mock. The app includes reusable section components, instant filtering, mobile filter drawer support, and a multi-theme color system designed for future customization.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- CSS variable design tokens with named themes

## Run Locally

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Component Map

- Top navigation: src/components/layout/TopNav.tsx
- Hero title: src/components/hero/DirectoryHero.tsx
- Search bar: src/components/search/DirectorySearch.tsx
- Desktop filter sidebar: src/components/filters/FilterSidebar.tsx
- Mobile filter drawer: src/components/filters/MobileFilterDrawer.tsx
- Shared filter controls: src/components/filters/FilterPanel.tsx
- Student card: src/components/cards/StudentCard.tsx
- Student grid and CTA tile: src/components/cards/StudentGrid.tsx, src/components/cards/SubmitPortfolioCard.tsx
- Footer: src/components/layout/Footer.tsx
- App wiring and state: src/components/directory/DirectoryApp.tsx

## Theme Customization Plan

Theme colors are controlled by semantic CSS tokens in src/app/globals.css.

1. Edit tokens under [data-theme="classic"], [data-theme="slate"], or [data-theme="sunrise"].
2. Keep component classes semantic by using var(--color-...) tokens instead of hard-coded values.
3. Add a new named theme by creating another [data-theme="your-name"] block.
4. Add the new theme name in src/types/student.ts and src/components/theme/ThemeSwitcher.tsx.

Because components consume semantic token names, color changes are centralized and low-risk.

## Data

Mock data lives in src/data/students.ts and is typed in src/types/student.ts.

## Quality Checks

```bash
npm run lint
npm run build
```
