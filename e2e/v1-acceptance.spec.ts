import { test, expect } from '@playwright/test';

// Use a single long test to preserve state easily without complex setup files.
test('RecruitOS V1 Acceptance Flow - End to End', async ({ page }) => {
  test.setTimeout(120000); // 2 minutes

  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = 'Password123!';
  const testPhone = `9477${Math.floor(100000 + Math.random() * 900000)}`;
  const testName = `Automated Candidate ${Date.now()}`;

  // 1. Authentication & System Health
  await test.step('Phase 1: Setup & Health Check', async () => {
    await page.goto('/login');
    
    // Check if we are already logged in somehow, if not log in
    if (page.url().includes('login')) {
      await page.getByRole('tab', { name: 'Sign Up' }).click();
      await page.getByPlaceholder('Email').fill(testEmail);
      await page.getByPlaceholder('Password').fill(testPassword);
      await page.getByRole('button', { name: 'Create Account' }).click();
    }
    
    // Wait for redirect to operations center
    await page.waitForURL('**/*');
    
    // Check System Health
    await page.goto('/system');
    await expect(page.locator('text=System Health')).toBeVisible({ timeout: 10000 });
    // Wait for probes to resolve
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'e2e-screenshots/01-system-health.png' });
  });

  // 2. Candidate Creation & Duplicate Prevention
  await test.step('Phase 2: Candidate Creation', async () => {
    await page.goto('/contacts/new');
    await expect(page.locator('text=Phone Number')).toBeVisible();

    // Fill phone
    await page.getByPlaceholder('10-digit number').fill(testPhone);
    // Wait for duplicate check
    await page.waitForTimeout(1000);
    
    // Fill name
    await expect(page.locator('text=Full Name')).toBeVisible();
    await page.getByPlaceholder('e.g. Priya Sharma').fill(testName);
    await page.getByRole('button', { name: 'Continue' }).click();
    
    // Source
    await expect(page.locator('text=How did they hear about us?')).toBeVisible();
    await page.locator('button', { hasText: 'Meta Lead' }).click();
    
    // Wait for profile to open
    await page.waitForURL('**/contacts/*');
    await expect(page.locator(`text=${testName}`)).toBeVisible();
    await page.screenshot({ path: 'e2e-screenshots/02-candidate-created.png' });
  });

  // 3. Duplicate Prevention Verification
  await test.step('Phase 2.1: Duplicate Prevention Check', async () => {
    await page.goto('/contacts/new');
    await page.getByPlaceholder('10-digit number').fill(testPhone);
    // It should show duplicate card
    await expect(page.locator('text=Already in RecruitOS')).toBeVisible({ timeout: 10000 });
    await page.screenshot({ path: 'e2e-screenshots/03-duplicate-prevention.png' });
  });

  // 4. Profile Operations
  await test.step('Phase 3: Profile Operations', async () => {
    // Go back to the created profile by clicking "Open Profile" on the duplicate card
    await page.getByRole('button', { name: 'Open Profile' }).click();
    await page.waitForURL('**/contacts/*');

    // Click Edit button
    await page.getByRole('button', { name: 'Edit' }).click();
    
    // Wait for sheet
    await expect(page.locator('text=Edit Contact')).toBeVisible();
    await page.getByPlaceholder('e.g. 150000').fill('150000');
    await page.getByRole('button', { name: 'Save Changes' }).click();
    
    await expect(page.locator('text=Edit Contact')).toBeHidden();
    await page.screenshot({ path: 'e2e-screenshots/04-profile-edited.png' });
  });

  // 5. Timeline Operations
  await test.step('Phase 3.1: Timeline Operations', async () => {
    // SMS / Activity log (simulate by just ensuring the timeline is rendered)
    await expect(page.locator('text=Candidate Created')).toBeVisible();
    await page.screenshot({ path: 'e2e-screenshots/05-timeline.png' });
  });

  // 6. Pipeline Operations
  await test.step('Phase 4: Pipeline Operations', async () => {
    await page.goto('/pipeline');
    await expect(page.locator(`text=${testName}`).first()).toBeVisible({ timeout: 10000 });
    await page.screenshot({ path: 'e2e-screenshots/06-pipeline.png' });
    
    // Move stage via profile instead since D&D is hard in playwright
    await page.goto('/contacts');
    await page.locator(`text=${testName}`).first().click();
    await page.waitForURL('**/contacts/*');
    
    // Wait for data
    await page.waitForTimeout(1000);
    // Select a stage using the CandidatePipeline component
    // We will just verify it's there for now.
  });

  // 7. Bulk Actions & Archiving
  await test.step('Phase 6: Bulk Actions & Archiving', async () => {
    await page.goto('/contacts');
    
    // Click Select Mode
    await page.getByRole('button', { name: 'Select' }).click();
    
    // Check the box for our test candidate
    // In Select mode, the row might have a checkbox
    const row = page.locator(`tr:has-text("${testName}")`);
    await row.locator('button').first().click(); // Checkbox
    
    // Click Archive
    await page.getByRole('button', { name: 'Archive' }).click();
    
    // Verify toast or disappearance
    await expect(row).toBeHidden({ timeout: 10000 });
    await page.screenshot({ path: 'e2e-screenshots/07-bulk-archive.png' });
  });
  
});
