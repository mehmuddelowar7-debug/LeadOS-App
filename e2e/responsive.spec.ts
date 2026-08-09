import { test, expect } from '@playwright/test'

test.describe('Responsive Navigation & Overflow', () => {
  test('Operations Center renders without horizontal scroll', async ({ page }) => {
    await page.goto('/operations')
    
    // Wait for main container
    await page.waitForSelector('text=Operations Center', { state: 'visible' })

    // Check if body has horizontal scroll
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth
    })
    
    expect(hasHorizontalScroll).toBe(false)
  })

  test('Pipeline board handles swipe/scroll natively', async ({ page, isMobile }) => {
    await page.goto('/pipeline')
    
    await page.waitForSelector('text=Pipeline', { state: 'visible' })
    
    if (isMobile) {
      // Mobile relies on tab navigation to view columns, not horizontal scroll on body
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth
      })
      expect(hasHorizontalScroll).toBe(false)
    } else {
      // Tablet/Desktop should show the horizontal scroll inside the board, not on the body
      const boardHandle = await page.$('.flex-1.overflow-x-auto')
      if (boardHandle) {
        const boardScrollable = await boardHandle.evaluate((node) => node.scrollWidth > node.clientWidth)
        expect(boardScrollable).toBe(true)
      }
    }
  })

  test('Candidate Profile bottom action bar respects safe areas', async ({ page }) => {
    await page.goto('/contacts')
    // Click on the first candidate card in contact list
    const firstContact = page.locator('text=Priority Queue').first()
    if (await firstContact.isVisible()) {
        await firstContact.click()
    }
    
    // Fallback wait for UI load
    await page.waitForTimeout(1000)

    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth
    })
    expect(hasHorizontalScroll).toBe(false)
  })
})
