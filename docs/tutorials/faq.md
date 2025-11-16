# Tutorial: Automating Form Submissions

## Introduction

Learn how to automate form submissions. This tutorial covers login forms, registration forms, and complex multi-step forms.

## Prerequisites

- Browser automation tool installed
- Basic understanding of CSS selectors
- Target website URL

## Step 1: Basic Login Form

```javascript
async function login(email, password) {
  const browser = await automation.launch();

  await browser.goto('https://example.com/login');
  await browser.type('#email', email);
  await browser.type('#password', password);
  await browser.click('button[type="submit"]');

  await browser.waitForNavigation();
  console.log('Login successful!');

  await browser.close();
}
```

## Step 2: Handling Dropdowns and Checkboxes

```javascript
await browser.select('#country', 'United States');
await browser.check('#terms-agreement');
await browser.check('input[name="payment"][value="credit-card"]');
```

## Step 3: Multi-Step Forms

```javascript
async function fillMultiStepForm(userData) {
  const browser = await automation.launch();

  await browser.goto('https://example.com/signup');
  await browser.type('#firstName', userData.firstName);
  await browser.type('#lastName', userData.lastName);
  await browser.click('button.next-step');

  await browser.waitForSelector('#email');
  await browser.type('#email', userData.email);
  await browser.type('#password', userData.password);
  await browser.click('button.next-step');

  await browser.waitForSelector('#interests');
  await browser.check('#newsletter');
  await browser.click('button[type="submit"]');

  await browser.waitForSelector('.success-message');
  console.log('Registration complete!');

  await browser.close();
}
```

## Step 4: Error Handling

```javascript
async function safeFormSubmit() {
  const browser = await automation.launch();

  try {
    await browser.goto('https://example.com/form');
    await browser.type('#email', 'user@example.com');

    const errorVisible = await browser.isVisible('.error-message');
    if (errorVisible) {
      const errorText = await browser.getText('.error-message');
      throw new Error(`Validation error: ${errorText}`);
    }

    await browser.click('button[type="submit"]');
    await browser.waitForNavigation({ timeout: 10000 });

  } catch (error) {
    console.error('Form submission failed:', error.message);
    await browser.screenshot({ path: 'error.png' });
  } finally {
    await browser.close();
  }
}
```

## Best Practices

1. **Use Specific Selectors**: Prefer IDs over classes for reliability
2. **Add Waits**: Always wait for elements before interacting
3. **Handle Errors**: Wrap automation in try-catch blocks
4. **Take Screenshots**: Capture screenshots on errors for debugging
5. **Respect Rate Limits**: Add delays between requests
6. **Clean Up**: Always close the browser after completion

## Conclusion

Form automation saves time and reduces manual errors.

Last updated: 2025-11-16T18:12:36.606Z