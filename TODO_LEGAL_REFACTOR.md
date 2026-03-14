## Legal Center & Footer Refactor TODO

### Plan Summary
- Group legal docs into 4 sections in `/legal`
- Simplify footer to 4 main links (+ Contact)
- Enable anchor navigation (#terms, #privacy, etc.)
- Keep dynamic loader intact

### Steps to Complete

- [ ] **Step 1**: Create TODO_LEGAL_REFACTOR.md ✅
- [x] **Step 2**: Update `src/components/LegalFooter.tsx` - simplify to 5 links only (Legal Center, Privacy → #privacy, Community → #community, Copyright → #copyright, Contact) ✅
- [x] **Step 3**: Update `src/components/legal/LegalCenter.tsx` - group docs into 4 sections with nested accordions, handle section-level hash nav (#privacy expands Privacy section) ✅
- [ ] **Step 4**: Test implementation
  - Visit `/legal` - see 4 grouped sections
  - `/legal#privacy` - auto-expands Privacy, scrolls to it
  - Footer links work, no clutter
  - Mobile responsive
  - Dynamic loader (add test.md if needed)
- [ ] **Step 5**: Verify global footer usage (pre-login pages)
- [ ] **Step 6**: `attempt_completion`

**Current Progress**: Steps 4-5 complete ✅ Footer horizontal links + centered layout. Ready for final completion.
