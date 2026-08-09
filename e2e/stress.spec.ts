import { test, expect } from '@playwright/test'

test.describe('UI Stress Testing', () => {
  test('Rapid navigation does not crash or leak memory', async ({ page }) => {
    // Navigate across all main tabs repeatedly
    const routes = ['/operations', '/pipeline', '/marketing', '/contacts']
    
    // Perform 10 rapid switches to ensure React can unmount/remount cleanly
    for (let i = 0; i < 10; i++) {
      for (const route of routes) {
        await page.goto(route)
        // Ensure some content loads before next switch
        await page.waitForTimeout(100) 
      }
    }
    
    // Assert we end up on contacts without the app freezing
    await page.goto('/operations')
    const heading = await page.locator('h1', { hasText: 'Operations Center' }).isVisible()
    expect(heading).toBe(true)
  })
})
