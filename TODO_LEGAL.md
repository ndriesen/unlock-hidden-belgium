# Legal Center Integration TODO

## Plan Status
✅ Plan approved by user

## Tasks

### 1. Dependencies (0/1)
- [ ] Install: `npm i react-markdown remark-gfm rehype-raw rehype-sanitize dompurify`

### 2. Core Files (2/5)
- [x] Create `src/lib/legal.ts` - dynamic legal docs loader
- [x] Create `src/components/legal/LegalDocViewer.tsx` - secure MD renderer w/ anti-scrape
- [ ] Create `src/components/legal/LegalCenter.tsx` - responsive docs list/accordion
- [ ] Create `src/components/legal/LegalCenter.tsx` - responsive docs list/accordion
- [ ] Create `src/app/legal/page.tsx` - main Legal Center page
- [ ] Create `src/components/legal/DocumentModal.tsx` - modal viewer

### 3. Integration (0/1)
- [ ] Update `src/components/home/PreLoginFooter.tsx` - add full legal links to /legal#slug

### 4. Polish & Test (0/3)
- [ ] Add anti-scrape protections (CSS/JS)
- [ ] Test mobile responsiveness, accessibility, hash nav
- [ ] Verify auto-discovery of new /legal/*.md files

### 5. Completion
- [ ] Run `npm run dev`, test http://localhost:3000/legal
- [ ] Update this TODO with ✓ as completed
- [ ] attempt_completion

**Next step:** Install deps, then create files sequentially confirming each.

