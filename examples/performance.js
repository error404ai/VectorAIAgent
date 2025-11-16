/**
 * Data Extraction Script
 *
 * Extract structured data from websites
 */

const automation = require('browser-automation');
const fs = require('fs').promises;

async function extractTableData(url) {
  const browser = await automation.launch({ headless: true });

  try {
    await browser.goto(url);
    await browser.waitForSelector('table');

    const tableData = await browser.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('table tr'));
      return rows.map(row => {
        const cells = Array.from(row.querySelectorAll('td, th'));
        return cells.map(cell => cell.textContent.trim());
      });
    });

    return tableData;

  } finally {
    await browser.close();
  }
}

async function extractArticles(url) {
  const browser = await automation.launch({ headless: true });

  try {
    await browser.goto(url);
    await browser.waitForSelector('article');

    const articles = await browser.evaluateAll('article', (elements) => {
      return elements.map(article => ({
        title: article.querySelector('h2')?.textContent.trim(),
        author: article.querySelector('.author')?.textContent.trim(),
        date: article.querySelector('.date')?.textContent.trim(),
        excerpt: article.querySelector('.excerpt')?.textContent.trim(),
        url: article.querySelector('a')?.href
      }));
    });

    return articles;

  } finally {
    await browser.close();
  }
}

async function extractWithPagination(baseUrl, maxPages = 5) {
  const browser = await automation.launch({ headless: true });
  const allData = [];

  try {
    for (let page = 1; page <= maxPages; page++) {
      await browser.goto(`${baseUrl}?page=${page}`);
      await browser.waitForSelector('.item');

      const pageData = await browser.evaluateAll('.item', (elements) => {
        return elements.map(el => ({
          title: el.querySelector('.title')?.textContent.trim(),
          description: el.querySelector('.description')?.textContent.trim(),
          price: el.querySelector('.price')?.textContent.trim()
        }));
      });

      allData.push(...pageData);

      const hasNextPage = await browser.isVisible('.next-page');
      if (!hasNextPage) break;
    }

    return allData;

  } finally {
    await browser.close();
  }
}

async function saveToJSON(data, filename) {
  await fs.writeFile(filename, JSON.stringify(data, null, 2));
  console.log(`Data saved to ${filename}`);
}

async function main() {
  const articles = await extractArticles('https://example.com/blog');
  await saveToJSON(articles, 'articles.json');

  const tableData = await extractTableData('https://example.com/data');
  await saveToJSON(tableData, 'table-data.json');

  const products = await extractWithPagination('https://example.com/products', 10);
  await saveToJSON(products, 'products.json');
}

main().catch(console.error);

module.exports = { extractTableData, extractArticles, extractWithPagination };