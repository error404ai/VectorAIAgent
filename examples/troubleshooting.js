/**
 * Form Automation Script
 *
 * Automates form submissions including login, registration,
 * and multi-step forms.
 */

const automation = require('browser-automation');

async function fillLoginForm(credentials) {
  const browser = await automation.launch();

  try {
    await browser.goto('https://example.com/login');

    await browser.type('#email', credentials.email);
    await browser.type('#password', credentials.password);
    await browser.click('button[type="submit"]');

    await browser.waitForNavigation();
    console.log('Login successful!');

    const isLoggedIn = await browser.isVisible('.user-profile');
    return isLoggedIn;

  } catch (error) {
    console.error('Login failed:', error);
    await browser.screenshot({ path: 'login-error.png' });
    return false;
  } finally {
    await browser.close();
  }
}

async function fillRegistrationForm(userData) {
  const browser = await automation.launch();

  try {
    await browser.goto('https://example.com/register');

    await browser.type('#firstName', userData.firstName);
    await browser.type('#lastName', userData.lastName);
    await browser.type('#email', userData.email);
    await browser.type('#password', userData.password);
    await browser.check('#terms-agreement');
    await browser.click('button[type="submit"]');

    await browser.waitForSelector('.success-message');
    console.log('Registration complete!');

  } finally {
    await browser.close();
  }
}

module.exports = { fillLoginForm, fillRegistrationForm };