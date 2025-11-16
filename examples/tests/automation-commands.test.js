/**
 * Automated Testing Script
 *
 * Demonstrates how to use browser automation for E2E testing
 */

const automation = require('browser-automation');
const assert = require('assert');

describe('E2E Testing Suite', () => {
  let browser;

  before(async () => {
    browser = await automation.launch({ headless: true });
  });

  after(async () => {
    await browser.close();
  });

  it('should load homepage successfully', async () => {
    await browser.goto('https://example.com');
    const title = await browser.getTitle();
    assert.strictEqual(title, 'Example Domain');
  });

  it('should navigate to about page', async () => {
    await browser.click('a[href="/about"]');
    await browser.waitForNavigation();
    const url = await browser.getCurrentURL();
    assert(url.includes('/about'));
  });

  it('should submit contact form', async () => {
    await browser.goto('https://example.com/contact');

    await browser.type('#name', 'Test User');
    await browser.type('#email', 'test@example.com');
    await browser.type('#message', 'This is a test message');
    await browser.click('button[type="submit"]');

    await browser.waitForSelector('.success-message');
    const successText = await browser.getText('.success-message');
    assert(successText.includes('Thank you'));
  });

  it('should handle form validation', async () => {
    await browser.goto('https://example.com/contact');

    await browser.click('button[type="submit"]');

    const errorVisible = await browser.isVisible('.error-message');
    assert.strictEqual(errorVisible, true);
  });

  it('should search for content', async () => {
    await browser.goto('https://example.com');

    await browser.type('#search-input', 'automation');
    await browser.pressKey('Enter');

    await browser.waitForSelector('.search-results');
    const results = await browser.countElements('.search-result-item');
    assert(results > 0, 'Should have search results');
  });
});

module.exports = { describe };