import { test, expect } from '@playwright/test'

test.describe('Smoke Tests', () => {
  test('App loads and command palette works', async ({ page }) => {
    // Navigate to app
    await page.goto('/')
    
    // Check if the dashboard is rendered (we can look for some text like "Operations Center" or "RecruitOS")
    await expect(page.locator('text=Operations')).toBeVisible()

    // Press Cmd+K (Mac) or Ctrl+K (Windows/Linux) to open the Command Palette
    await page.keyboard.press('Meta+K')
    
    // Check if the command palette is visible
    const palette = page.locator('[role="dialog"]')
    await expect(palette).toBeVisible()
    
    // Close the palette
    await page.keyboard.press('Escape')
    await expect(palette).toBeHidden()
  })

  test('Assistant panel can be opened', async ({ page }) => {
    await page.goto('/')
    
    // Find the spark icon button in bottom right
    const assistantBtn = page.locator('button:has(.lucide-sparkles)')
    await expect(assistantBtn).toBeVisible()
    
    // Click it to open the assistant panel
    await assistantBtn.click()
    
    // Check if the assistant panel title is visible
    await expect(page.locator('text=Recruiter Assistant')).toBeVisible()
  })
})
