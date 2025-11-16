# Frequently Asked Questions

## General Questions

### What is browser automation?

Browser automation allows you to programmatically control a web browser to perform tasks like clicking buttons, filling forms, scraping data, and more.

### Is this tool free?

Yes, the tool is open source and free to use under the MIT license.

### What browsers are supported?

The tool supports Chromium-based browsers including Chrome, Edge, and Brave.

### Can I use this for commercial projects?

Yes, you can use this tool for both personal and commercial projects.

## Technical Questions

### How do I install the tool?

See our [Getting Started Guide](./getting-started.md) for installation instructions.

### What programming languages are supported?

The tool has APIs available for JavaScript/Node.js, Python, and Go.

### Can I run automations in headless mode?

Yes, headless mode is fully supported for faster execution.

### How do I handle dynamic content?

Use wait functions like `waitForSelector()` and `waitForNavigation()` to handle dynamic content.

### Can I use proxies?

Yes, proxy support is built-in. Configure proxies in your browser profile settings.

## Automation Questions

### How do I select elements?

Use CSS selectors or XPath. We recommend CSS selectors for better reliability.

### Can I automate login flows?

Yes, the tool can automate logins including 2FA and CAPTCHA with appropriate integrations.

### How do I handle infinite scroll?

Use a loop with `scrollBy()` or `scrollToBottom()` and wait for new content to load.

### Can I run multiple automations simultaneously?

Yes, you can run multiple browser instances in parallel.

### How do I take screenshots?

Use the `screenshot()` method with options for full page or specific elements.

## Performance Questions

### Why is my automation slow?

Try enabling headless mode, reducing wait times, or optimizing your selectors.

### How much memory does it use?

Typically 100-300MB per browser instance depending on the pages loaded.

### Can I limit resource usage?

Yes, configure resource limits in the browser profile settings.

## Troubleshooting

### My selector isn't working

Verify the selector in browser DevTools first. Elements may be in iframes or shadow DOM.

### Browser crashes frequently

Reduce concurrent instances, clear cache, or increase system resources.

### How do I get help?

Check our [Troubleshooting Guide](./troubleshooting.md) or file an issue on GitHub.

## Legal and Ethics

### Is web scraping legal?

Web scraping legality depends on the website's terms of service and local laws. Always check before scraping.

### Should I respect robots.txt?

Yes, always respect robots.txt and rate limits to be a good internet citizen.

### Can I automate social media?

Check each platform's terms of service. Many prohibit automation.

---

Last updated: 2025-11-16T18:01:29.169Z