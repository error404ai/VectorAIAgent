/**
 * Web Scraping Automation Script
 *
 * This script demonstrates how to scrape product information
 * from an e-commerce website.
 */

const automation = require('browser-automation');

async function scrapeProducts(url) {
  const browser = await automation.launch({
    headless: false,
    profile: 'default'
  });

  try {
    await browser.goto(url);
    await browser.waitForSelector('.product-card');

    const products = await browser.evaluateAll('.product-card', (elements) => {
      return elements.map(el => ({
        title: el.querySelector('.product-title')?.textContent.trim(),
        price: el.querySelector('.product-price')?.textContent.trim(),
        rating: el.querySelector('.product-rating')?.textContent.trim(),
        link: el.querySelector('a')?.href
      }));
    });

    console.log(`Scraped ${products.length} products`);
    return products;

  } catch (error) {
    console.error('Scraping failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

scrapeProducts('https://example.com/products')
  .then(products => console.log('Products:', products))
  .catch(console.error);

module.exports = { scrapeProducts };