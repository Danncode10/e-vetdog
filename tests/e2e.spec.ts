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
    await page.locator('#sched-capacity').fill('99');
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
    
    // Handle the mandatory profile completion if the account is incomplete
    if (await page.getByText('Complete your profile').isVisible({ timeout: 5000 }).catch(() => false)) {
      // The Full Name might already be pre-filled, so we clear and fill it just in case
      await page.getByPlaceholder('Jane Doe').fill('Test Owner');
      await page.getByPlaceholder('+1 555 123 4567').fill('555-555-5555');
      await page.getByPlaceholder('123 Clinic St, City').fill('123 Test St');
      await page.getByRole('button', { name: 'Continue to dashboard' }).click();
      
      // Wait for the dashboard to load after completing the profile
      await expect(page.getByText('Welcome to E-VetDoc')).toBeVisible({ timeout: 10000 });
    }

    await page.goto('/dashboard/pets/new');
    await page.waitForTimeout(2000); // Give it a little time to render
    const content = await page.content();
    console.log("DEBUG CONTENT START:");
    console.log(content.substring(0, 1500));
    console.log("DEBUG CONTENT END");
    
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
    // Select the first available service by waiting for the text "min" (which is in the duration) or just the first button under the Service section
    await page.getByText('Select a Service').isVisible();
    await page.locator('text=min').first().click();
    await page.locator('#step-0-next-btn').click();
    
    // Step 1: Pick a Date
    // Wait for schedules to load
    await page.waitForSelector('button[title*="Available:"]', { timeout: 10000 });
    // Click the future date we created
    await page.locator('button[title*="Available:"]').filter({ hasText: futureDate.getDate().toString() }).first().click();
    await page.locator('#step-1-next-btn').click();
    
    // Step 2: Choose Time Slot
    // Click the 9:00 AM slot (filtering out disabled ones from previous test runs)
    await page.locator('button:not([disabled])').filter({ hasText: '9:00 AM' }).first().click();
    await page.locator('#step-2-next-btn').click();
    
    // Step 3: Details & Review
    await page.locator('#appt-reason').fill('Checkup test');
    await page.locator('#submit-appt-btn').click();
    
    await expect(page.locator('text=Appointment request submitted!')).toBeVisible({ timeout: 15000 });

    // --- PART 2: Admin/Vet Diagnosis and Status Update ---
    
    // Log out Owner by clearing cookies and navigating to login
    await page.context().clearCookies();
    await page.goto('/login');

    // Log in as Admin/Vet (falling back to admin if Vet email not set)
    const loginEmail = process.env.TEST_VET_EMAIL || process.env.TEST_ADMIN_EMAIL || 'adminTest@gmail.com';
    const loginPassword = process.env.TEST_VET_PASSWORD || process.env.TEST_ADMIN_PASSWORD || 'jytmos-serQo0-sawfyv';
    
    await page.locator('#email').fill(loginEmail);
    await page.locator('#password').fill(loginPassword);
    await page.locator('button[type="submit"]').click();

    // Wait for login success
    await expect(page.locator('text=Welcome back!').or(page.locator('text=Login successful!'))).toBeVisible({ timeout: 15000 });

    // Go to Appointments dashboard
    await page.goto('/dashboard/appointments');
    await expect(page.locator('text=Appointments').first()).toBeVisible({ timeout: 10000 });

    // Use the search bar to find the specific pet (bypasses pagination limits since we created many pets)
    await page.getByPlaceholder('Search pet, service, owner, or reason...').fill(petName);

    // Ensure the pet is visible on the dashboard
    await expect(page.getByText(petName)).toBeVisible({ timeout: 15000 });
    
    // Find the View Details button specifically within the container that has the petName
    await page.locator('div').filter({ hasText: petName }).getByRole('button', { name: 'View details' }).first().click();
    
    // Wait for the detail view and click "Start Encounter"
    await expect(page.getByRole('button', { name: 'Start Encounter' })).toBeVisible({ timeout: 10000 });
    await page.getByRole('button', { name: 'Start Encounter' }).click();

    // In Encounter Workspace, fill some notes
    await expect(page.locator('text=Encounter Workspace')).toBeVisible({ timeout: 10000 });
    
    await page.getByPlaceholder("What is the primary reason for today's visit?").fill('Checkup test');
    await page.getByPlaceholder('e.g. Lethargic for 2 days, not eating...').fill('Patient is healthy');

    // Add Diagnosis
    await page.getByRole('button', { name: 'Add' }).first().click(); // "+ Add" for Diagnoses
    await page.getByPlaceholder('Diagnosis description...').first().fill('Healthy pet');
    
    // Click Sign & Lock Record
    await page.getByRole('button', { name: /Sign & Lock Record/i }).click();
    
    // Click confirm in the dialog
    await page.getByRole('button', { name: 'Sign Record' }).click();
    
    // Verify success toast or status badge
    await expect(page.locator('text=Encounter signed successfully!')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('text=Signed').first()).toBeVisible();
    
    // Verify logs
    await page.goto('/dashboard/logs');
    // Ensure logs are visible and status updates are tracked (e.g. "signed")
    await expect(page.locator('text=signed').first()).toBeVisible({ timeout: 15000 });
  });
});
