# WordPress quiz → native Skin Check

**Date:** 2026-07-22
**Status:** native flow built; migration NOT yet executed

---

## 1. Current state — the live funnel is broken

Verified 2026-07-21 and again 2026-07-22, in raw HTTP and in a real mobile browser.

| URL | HTTP | Forms | Inputs | Main content |
|---|---|---|---|---|
| `https://myskinwise.com/pigmentation-form-quiz/` | 200 | 0 | 0 | 0 characters |
| `https://myskinwise.com/acne-form-quiz/` | 200 | 0 | 0 | 0 characters |
| `https://myskinwise.com/other-issues-form-quiz/` | 200 | 0 | 0 | 0 characters |

A control page (`/pigmentation/`) on the same site renders 2 forms and 10 inputs, so the platform
renders forms correctly — these three pages specifically do not.

The pages return **HTTP 200**, which is why no uptime monitor flagged it. Users cannot submit.
No leads are captured.

The homepage still links to all three:

```
href="https://myskinwise.com/pigmentation-form-quiz/"
href="https://myskinwise.com/acne-form-quiz/"
href="https://myskinwise.com/other-issues-form-quiz/"
```

### Diagnosis

The quiz pages render **12 Elementor elements**; a working page renders **385**. Both load the
Elementor page wrapper, so Elementor is running — it has nothing to draw for these pages.

The quiz content still exists in the WordPress database (it is present in the content export).
Elementor renders from a separate `_elementor_data` field rather than from `post_content`, so the
content being in the export does not mean Elementor can see it. The likely state is that
`_elementor_data` is empty or corrupted for exactly these three pages.

### Second, unrelated bug

Every page on the site throws:

```
Syntax error, unrecognized expression: [id=&#039;site-footer&#039;] &gt; *
```

A footer plugin (`jabvfcr`) has HTML-escaped quotes saved into a jQuery selector. This is **not**
what breaks the quiz — the forms are absent before any JavaScript runs — but it should be fixed.

---

## 2. Repair — requires WordPress admin access

**Nothing in this repository can fix the live pages.** They are rendered by WordPress on a host this
codebase has no access to. The following must be done in wp-admin:

1. Open `/acne-form-quiz/` → **Edit with Elementor**.
2. Check whether the canvas is empty. Expectation: it is.
3. Open **Elementor → Revision History** for the page.
4. Restore the most recent revision that has content.
5. Verify **Elementor Pro's licence is active** — an expired Pro licence stops Pro widgets (including
   the Form widget) from rendering.
6. Update/save.
7. Clear Elementor CSS cache, any page cache, and CDN cache.
8. Test in an incognito window.
9. Test on a real phone.
10. Submit the form and confirm the lead arrives wherever leads are meant to arrive.
11. Repeat for `/pigmentation-form-quiz/` and `/other-issues-form-quiz/`.

Separately, fix the `jabvfcr` plugin's footer setting so the selector is not HTML-escaped.

---

## 3. The native replacement

`/skin-check` — built in this repository, independent of WordPress and Elementor.

- Questions migrated from all three source quizzes (`Assets/WEBSITE_CONTENT.md` §4, §7, §10).
- Contact capture moved from the first screen to the last.
- Photos made optional rather than mandatory.
- The source quizzes' "why is it important?" explainer is preserved as a required field on every
  question.
- Recommendations come from explicit rules over the brand's own content — not a language model.
- Server-side validation is authoritative.

### The no-silent-loss guarantee

The defect above is *silent lead loss behind an HTTP 200*. The native flow is built so it cannot
repeat that:

| Response | Meaning | What the user sees |
|---|---|---|
| `201 stored` | Persisted to the database | Result, saved |
| `200 fallback` | **No database configured** | Result **plus** an explicit "not yet saved" notice and a WhatsApp hand-off carrying their answers |
| `400 invalid` | Validation failed | Returned to the flow with every answer intact |

There is deliberately no "looks successful but went nowhere" state.

Supabase credentials do not exist yet, so **every submission currently takes the fallback path**. The
user still completes the assessment and still reaches the team. When credentials are supplied, the
storage adapter switches on with no UI change.

---

## 4. Migration sequence

Deliberately ordered so live traffic is never pointed at something unproven.

| Phase | Action | Gate before proceeding |
|---|---|---|
| **A** | Repair the WordPress quiz (§2) | All three pages render a working form and capture a test lead |
| **B** | Supply Supabase credentials; enable persistence | A test submission returns `201` and appears in the database |
| **C** | Internal QA of `/skin-check` on real devices | Team completes the flow on Android and iPhone |
| **D** | Soft launch — expose the native flow on the new site only | Leads arrive correctly for a week |
| **E** | Run both funnels in parallel | Conversion of native ≥ WordPress |
| **F** | Switch homepage CTAs to `/skin-check` | Monitored daily for a week |
| **G** | Update ad destination URLs | Ad platforms re-approved |
| **H** | Add 301s from the three quiz URLs → `/skin-check` | Referrer traffic verified arriving |
| **I** | Retire the WordPress quiz pages | Only after H has been stable for a month |

### Rules

- **Do not delete the three quiz URLs.** They carry live ad traffic and accumulated SEO history.
  Retire the *content*, keep the *URLs* redirecting.
- **Do not switch the homepage CTA before Phase F.** Pointing more traffic at an unproven funnel
  multiplies the loss rather than fixing it.
- **Do not run Phase F while `/skin-check` is still in fallback mode.** WhatsApp hand-off is a safety
  net for a small number of users, not a substitute for lead capture at full ad volume.

---

## 5. Current CTA state — unchanged on purpose

The new Next.js homepage points at `/skin-check`. The **live WordPress homepage still points at the
broken quiz pages** and has not been touched — this repository is not deployed to
`myskinwise.com`, and changing production CTAs is Phase F, not today.

No production traffic has been redirected by any work in this repository.
