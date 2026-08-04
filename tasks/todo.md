# 2026-07-26 — hardening pass: access control, cost, performance, SEO/AEO, assistant

Driven by a 13-agent creative audit (wf_ee06c479-644) and a 9-agent hardening audit
(wf_e0e61c1c-6a7). Every item below was verified in code or in rendered pixels before it was touched.

## Done — creative pipeline (inside the lite architecture; concepting stays OFF for PLAIN apparel)
- [x] no-baked-text guard made unconditional — it was dead code on 100% of renders (shipped a fake
      shopping-app screenshot and a gibberish headline)
- [x] garment reference declared a PRODUCT PHOTO — kills copied hangers, hang tags, size stickers, mannequin tiaras
- [x] PLAIN runs no longer reserve a headline safe-zone they never composite
- [x] styling lock so one product's frames cut together as one shoot
- [x] model-QA: gender/age judged first, plus garmentSuitsWearer / noBakedText / fullyInFrame
- [x] pack-QA: a product-less frame now FAILS; judges people, collage, stray text and product truth
- [x] productIntel (sceneDo/sceneDont) reaches the RENDER prompt, not just the concept LLM
- [x] copy block anchored by measured height — CTA fell off the canvas on 4 of 7 sampled creatives
- [x] all four archetypes render the subhead (3 of 4 silently binned the benefit line)
- [x] dissection: sentence-safe trim + importance ordering + 700 chars (was a mid-word 400-char cut)
- [x] product_hero deleted — contradictory with the retired cutout paste, 0 of 40 concepts used it
- [x] enhancer no longer discards a paid Opus pass over one em dash
- [x] property test: no layer may leave the canvas, any archetype x any aspect

## Done — access control
- [x] requireSuperAdmin on all six admin pages (the layout was the only guard)
- [x] invites must carry a future expiry (null-expiry rows granted membership forever)
- [x] requireWriteAccess across 30 mutating actions (VIEWER was enforced nowhere)
- [x] god-view cookie cleared on sign-out; both cookies Secure in production
- [x] /models gated on account type at the route, not just the nav

## Done — cost correctness
- [x] Runware Nano Banana Pro $0.060 → $0.1424; added Qwen-Image and Wan 2.7; 4K rate for NB Pro
- [x] unknown model id no longer costs $0 silently (frontier-rate fallback + warning)
- [x] generate-model tracked (premium render, previously invisible)
- [x] multi-aspect debits per rendered plate; "compare" respects a workspace pin; refunds proportional

## Done — performance
- [x] vercel.json regions hnd1 (DB + storage are in Tokyo; functions were cross-planet)
- [x] index on creatives(generationRunId) + migration
- [x] realtime token cached per run (was a cross-region API call on every refresh)
- [x] studio refresh coalesced to 1/900ms
- [x] library: aspect-ratio placeholders + narrowed select (was SELECT * of 60 rows with JSON blobs)
- [x] getBalance request-deduped

## Done — SEO / AEO / GEO
- [x] robots.ts, sitemap.ts, canonicals, metadataBase that never leaks production canonicals from a preview
- [x] Organization / WebSite / SoftwareApplication / FAQPage / BreadcrumbList JSON-LD
- [x] generated OG image; twitter summary_large_image
- [x] /llms.txt for answer engines; FAQ section on the Studio page
- [x] noindex on app + admin; LCP reveal no longer starts at opacity 0

## Done — marketing assistant
- [x] errors surface instead of closing a 200 with half a sentence (fullStream, not textStream)
- [x] pinned model, thinking disabled, budget 500 → 1200 (reasoning tokens were eating the budget)
- [x] history window starts on a user turn; blank turns can no longer brick the conversation
- [x] partial text survives a dropped stream; markdown rendered; aria-live; focus kept; stop button
- [x] anti-buffering headers

## Open — needs My Lord's call or a follow-up session
- [ ] `npx prisma migrate deploy` for the new index (I do not run migrations against prod)
- [ ] generateBrandModel spends on a premium image with no debit; refreshBrandIntel / redissectProduct
      have no cooldown
- [ ] assertApproved is dead code — the download gate is client-side only
- [ ] brand-intel cost misses Anthropic cache + web_search charges; brand-ingest and the chatbot untracked
- [ ] editor free edits composite inline in a server action instead of enqueuing
- [ ] no conversation logging or lead capture on the assistant
- [ ] 16.9 MB of unreferenced PNGs in public/images
