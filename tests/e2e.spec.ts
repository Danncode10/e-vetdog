import { test, expect } from '@playwright/test';

test.describe('E2E Flow - Schedule, Pet, and Appointment', () => {
  
  test('Admin creates schedule, Owner registers pet and books appointment', async ({ page }) => {
    test.setTimeout(120000); // 2 mins timeout for full flow

    // ==========================================
    // 1. Admin Creates Schedule
    // ==========================================
    await page.goto('/login');
    const adminEmail = process.env.TEST_ADMIN_EMAIL;
    const adminPassword = process.env.TEST_ADMIN_PASSWORD;
    
    if (!adminEmail || !adminPassword) {
      test.skip(true, 'Admin credentials missing');
      return;
    }
    
    await page.locator('#email').fill(adminEmail);
    await page.locator('#password').fill(adminPassword);
    await page.locator('button[type="submit"]').click();
    
    // Wait for login success
    await expect(page.locator('text=Welcome back!').or(page.locator('text=Login successful!'))).toBeVisible({ timeout: 15000 });
    
    await page.goto('/dashboard/schedules/new');
    
    // Create schedule for 2 days from now (avoids timezone edge cases)
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 2);
    const yyyy = futureDate.getFullYear();
    const mm = String(futureDate.getMonth() + 1).padStart(2, '0');
    const dd = String(futureDate.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;
    
    await page.locator('#sched-date').fill(dateStr);
    await page.locator('#sched-start').fill('09:00');
    await page.locator('#sched-end').fill('17:00');
    await page.locator('#sched-capacity').fill('3');
    await page.locator('#status-open-btn').click();
    await page.locator('#submit-schedule-btn').click();
    
    // Wait for the redirect to the dashboard or success toast
    await expect(page.getByText('Schedule created successfully').or(page.getByText('Schedule updated successfully')).or(page.getByText('Add Schedule'))).toBeVisible({ timeout: 10000 });
    
    // Logout by clearing context
    await page.context().clearCookies();
    await page.goto('/login');

    // ==========================================
    // 2. Owner Registers Pet
    // ==========================================
    const ownerEmail = process.env.TEST_OWNER_EMAIL;
    const ownerPassword = process.env.TEST_OWNER_PASSWORD;
    
    if (!ownerEmail || !ownerPassword) {
      test.skip(true, 'Owner credentials missing');
      return;
    }
    
    await page.locator('#email').fill(ownerEmail);
    await page.locator('#password').fill(ownerPassword);
    await page.locator('button[type="submit"]').click();
    
    await expect(page.locator('text=Welcome back!').or(page.locator('text=Login successful!'))).toBeVisible({ timeout: 15000 });
    
    await page.goto('/dashboard/pets/new');
    
    const petName = `TestDog-${Date.now()}`;
    await page.getByPlaceholder('e.g. Milo, Bella, Luna').fill(petName);
    await page.locator('select').first().selectOption('dog');
    await page.getByPlaceholder('e.g. Golden Retriever, Puspin, Mixed').fill('Golden Retriever');
    await page.getByText('Save pet', { exact: true }).click();
    
    // Wait for redirect to /dashboard?tab=pets
    await page.waitForURL('**/dashboard?tab=pets', { timeout: 10000 });

    // ==========================================
    // 3. Owner Books Appointment
    // ==========================================
    await page.goto('/dashboard/appointments/new');
    
    // Step 0: Pet & Service
    // Select the pet we just created
    await page.getByText(petName).first().click();
    // Select the first available service
    await page.locator('button:has(.lucide-stethoscope)').first().click();
    await page.locator('#step-0-next-btn').click();
    
    // Step 1: Pick a Date
    // Wait for schedules to load
    await page.waitForSelector('button[title*="Available:"]', { timeout: 10000 });
    // Click the future date we created
    await page.locator('button[title*="Available:"]').filter({ hasText: futureDate.getDate().toString() }).first().click();
    await page.locator('#step-1-next-btn').click();
    
    // Step 2: Choose Time Slot
    // Click the 09:00 AM slot
    await page.getByText('09:00 AM').first().click();
    await page.locator('#step-2-next-btn').click();
    
    // Step 3: Details & Review
    await page.locator('#appt-reason').fill('Checkup test');
    await page.locator('#submit-appt-btn').click();
    
    await expect(page.locator('text=Appointment request submitted!')).toBeVisible({ timeout: 15000 });
  });
});
