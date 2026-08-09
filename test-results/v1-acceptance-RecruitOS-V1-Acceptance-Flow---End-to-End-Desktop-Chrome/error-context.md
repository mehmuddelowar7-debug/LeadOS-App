# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: v1-acceptance.spec.ts >> RecruitOS V1 Acceptance Flow - End to End
- Location: e2e/v1-acceptance.spec.ts:4:1

# Error details

```
Error: Channel closed
```

```
Error: locator.click: Target page, context or browser has been closed
Call log:
  - waiting for getByRole('tab', { name: 'Sign Up' })

```

```
Error: browserContext.close: Target page, context or browser has been closed
```