# Claude Code — Hero Headline Edit Fix + Admin Font Size
## Context: Read CLAUDE.md in the 2nd Brain wiki for full project context.

## Project
`/Users/springsparrow/01-tie-babeh-apps/luminaljourneys`
React + Vite + Firebase. Two branches: `dev` → staging (admin.luminaljourneys.com), `main` → production (luminaljourneys.com).

---

## Bug 1 — Hardcoded "with" not editable in hero headline

**File:** `src/pages/LandingPage.jsx` ~line 178

**Current code:**
```jsx
<EditableContent contentKey="hero.headline.pre" fallback="Care that begins" tag="span" />
<br />
with{" "}
<em style={{ color: B.teal, fontStyle: "italic" }}>
  <EditableContent contentKey="hero.headline.em" fallback="listening." tag="span" />
</em>
```

**Problem:** `with` is hardcoded JSX — cannot be edited or deleted by the client.

**Fix:** Wrap it in its own `EditableContent`:
```jsx
<EditableContent contentKey="hero.headline.pre" fallback="Care that begins" tag="span" />
<br />
<EditableContent contentKey="hero.headline.mid" fallback="with" tag="span" />{" "}
<em style={{ color: B.teal, fontStyle: "italic" }}>
  <EditableContent contentKey="hero.headline.em" fallback="listening." tag="span" />
</em>
```

---

## Bug 2 — Hero font size not updated on admin/staging

**File:** `src/pages/LandingPage.jsx` ~line 173

Confirm this line reads:
```jsx
fontSize: mobile ? "clamp(3rem, 11vw, 8.5rem)" : "clamp(4rem, 11vw, 8rem)",
```
If it already does, the fix is just merging `dev → main` (see Deploy below). If it still has old values (`clamp(2rem,11vw,7rem)` or `clamp(4rem,11vw,10rem)`), update it to the above.

---

## Deploy

After both fixes are confirmed in the file:

```bash
# Commit on dev
git add src/pages/LandingPage.jsx
git commit -m "fix: hero headline 'with' now editable, font size correct on all envs"

# Merge to main → triggers production CI/CD
git checkout main
git merge dev --no-ff -m "release: hero edit fix + font size"
git push origin main
git checkout dev
```

Both branches will then have the same font size and the headline will be fully editable.
