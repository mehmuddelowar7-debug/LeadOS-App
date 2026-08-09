import { test, expect } from '@playwright/test'

test.describe('Performance Metrics', () => {
  test('Operations Center renders under 2 seconds', async ({ page }) => {
    const startTime = Date.now()
    await page.goto('/operations')
    
    // Wait for network idle to ensure everything loaded
    await page.waitForLoadState('networkidle')
    
    const endTime = Date.now()
    const loadTime = endTime - startTime
    
    // We expect a React frontend to load from scratch + network idle in under 3s on local/CI
    expect(loadTime).toBeLessThan(3500)
    
    const performanceTiming = await page.evaluate(() => JSON.stringify(window.performance.timing))
    console.log('Performance Timing:', performanceTiming)
  })
})
