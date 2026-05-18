# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: intake.spec.js >> Intake Form >> Submit Intake shows thank-you screen
- Location: tests/intake.spec.js:116:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: /continue/i })
    - locator resolved to <button disabled>Continue →</button>
  - attempting click action
    2 × waiting for element to be visible, enabled and stable
      - element is not enabled
    - retrying click action
    - waiting 20ms
    2 × waiting for element to be visible, enabled and stable
      - element is not enabled
    - retrying click action
      - waiting 100ms
    55 × waiting for element to be visible, enabled and stable
       - element is not enabled
     - retrying click action
       - waiting 500ms

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - generic [ref=e4]:
    - button "Luminal Journeys" [ref=e5] [cursor=pointer]
    - generic [ref=e6]: New Client Intake
  - generic [ref=e7]:
    - generic [ref=e8]:
      - generic [ref=e11]: Personal Info
      - generic [ref=e14]: Contact Info
      - generic [ref=e17]: About You
      - generic [ref=e20]: Confirm
    - generic [ref=e21]: Step 1 of 4
    - heading "Personal Info" [level=2] [ref=e22]
    - paragraph [ref=e23]: Let's start with the basics — tell us who you are.
    - button "Continue →" [disabled] [ref=e29]
  - generic [ref=e30]: © 2026 Luminal Journeys · All rights reserved
  - generic [ref=e31] [cursor=pointer]:
    - generic [ref=e32]: ⚠
    - text: Mockup Prototype
```

# Test source

```ts
  108 |     await advanceToConfirm(page);
  109 |     // Summary cards should be present (review of each step's data)
  110 |     // Confirm step header text
  111 |     await expect(page.getByText(/everything look right/i)).toBeVisible();
  112 |   });
  113 | 
  114 |   // ─── Submission ──────────────────────────────────────────────────────────────
  115 | 
  116 |   test('Submit Intake shows thank-you screen', async ({ page }) => {
  117 |     await advanceToConfirm(page);
  118 |     await page.getByRole('button', { name: /submit intake/i }).click();
  119 |     await expect(page.getByText(/thank you/i)).toBeVisible();
  120 |   });
  121 | 
  122 |   test('thank-you screen has "Back to home" link', async ({ page }) => {
  123 |     await advanceToConfirm(page);
  124 |     await page.getByRole('button', { name: /submit intake/i }).click();
  125 |     const backBtn = page.getByRole('button', { name: /back to home/i });
  126 |     await expect(backBtn).toBeVisible();
  127 |     await backBtn.click();
  128 |     await expect(page).toHaveURL('/');
  129 |   });
  130 | 
  131 |   // ─── Footer ──────────────────────────────────────────────────────────────────
  132 | 
  133 |   test('copyright footer is visible on intake page', async ({ page }) => {
  134 |     await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  135 |     await expect(page.getByText(/luminal journeys · all rights reserved/i)).toBeVisible();
  136 |   });
  137 | 
  138 | });
  139 | 
  140 | // ─── Helpers ──────────────────────────────────────────────────────────────────
  141 | 
  142 | /**
  143 |  * Fills all visible required-looking fields on the current step.
  144 |  * This is intentionally permissive — it fills everything it can see,
  145 |  * which is sufficient to enable the Continue button for standard steps.
  146 |  */
  147 | async function fillCurrentStep(page) {
  148 |   const inputs = page.locator('input[type="text"], input[type="email"], input[type="tel"], input[type="date"], input[type="number"]');
  149 |   const count = await inputs.count();
  150 |   for (let i = 0; i < count; i++) {
  151 |     const input = inputs.nth(i);
  152 |     const type = await input.getAttribute('type');
  153 |     if (type === 'email') {
  154 |       await input.fill('test@example.com');
  155 |     } else if (type === 'tel') {
  156 |       await input.fill('555-123-4567');
  157 |     } else if (type === 'date') {
  158 |       await input.fill('1990-01-15');
  159 |     } else if (type === 'number') {
  160 |       await input.fill('30');
  161 |     } else {
  162 |       await input.fill('Test');
  163 |     }
  164 |   }
  165 | 
  166 |   const selects = page.locator('select');
  167 |   const selectCount = await selects.count();
  168 |   for (let i = 0; i < selectCount; i++) {
  169 |     const opts = await selects.nth(i).locator('option').all();
  170 |     if (opts.length > 1) {
  171 |       await selects.nth(i).selectOption({ index: 1 });
  172 |     }
  173 |   }
  174 | 
  175 |   const textareas = page.locator('textarea');
  176 |   const taCount = await textareas.count();
  177 |   for (let i = 0; i < taCount; i++) {
  178 |     await textareas.nth(i).fill('Sample response for testing purposes.');
  179 |   }
  180 | 
  181 |   // Select first radio option in each radio group
  182 |   const radios = page.locator('input[type="radio"]');
  183 |   const radioGroups = new Set();
  184 |   const radioCount = await radios.count();
  185 |   for (let i = 0; i < radioCount; i++) {
  186 |     const name = await radios.nth(i).getAttribute('name');
  187 |     if (name && !radioGroups.has(name)) {
  188 |       radioGroups.add(name);
  189 |       await radios.nth(i).check();
  190 |     }
  191 |   }
  192 | }
  193 | 
  194 | /**
  195 |  * Advances the form all the way to the Confirm step.
  196 |  * Fills each data step and clicks Continue until the Submit button appears.
  197 |  */
  198 | async function advanceToConfirm(page) {
  199 |   // Keep filling + clicking Continue until Submit button appears
  200 |   let maxSteps = 10;
  201 |   while (maxSteps-- > 0) {
  202 |     const submitBtn = page.getByRole('button', { name: /submit intake/i });
  203 |     if (await submitBtn.isVisible()) break;
  204 | 
  205 |     await fillCurrentStep(page);
  206 |     const continueBtn = page.getByRole('button', { name: /continue/i });
  207 |     if (await continueBtn.isVisible()) {
> 208 |       await continueBtn.click();
      |                         ^ Error: locator.click: Test timeout of 30000ms exceeded.
  209 |       await page.waitForTimeout(300); // allow React re-render
  210 |     } else {
  211 |       break;
  212 |     }
  213 |   }
  214 | }
  215 | 
```