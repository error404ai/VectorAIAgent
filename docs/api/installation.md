# Automation API Reference

## Browser Control

### `browser.launch(options)`

Launches a new browser instance.

**Parameters:**
- `options` (Object)
  - `headless` (Boolean): Run in headless mode. Default: `false`
  - `profile` (String): Browser profile to use. Default: `'default'`
  - `userAgent` (String): Custom user agent string
  - `viewport` (Object): Viewport size `{width, height}`

**Returns:** Promise<Browser>

**Example:**
```javascript
const browser = await automation.launch({
  headless: false,
  profile: 'work',
  viewport: { width: 1920, height: 1080 }
});
```

### `browser.goto(url, options)`

Navigate to a specific URL.

**Parameters:**
- `url` (String): Target URL
- `options` (Object)
  - `waitUntil` (String): Wait condition. Options: `'load'`, `'networkidle'`, `'domcontentloaded'`
  - `timeout` (Number): Navigation timeout in ms. Default: `30000`

**Returns:** Promise<void>

**Example:**
```javascript
await browser.goto('https://example.com', {
  waitUntil: 'networkidle',
  timeout: 60000
});
```

### `browser.click(selector, options)`

Click an element on the page.

**Parameters:**
- `selector` (String): CSS selector
- `options` (Object)
  - `button` (String): Mouse button. Options: `'left'`, `'right'`, `'middle'`
  - `clickCount` (Number): Number of clicks. Default: `1`

**Returns:** Promise<void>

### `browser.type(selector, text, options)`

Type text into an input field.

**Parameters:**
- `selector` (String): CSS selector
- `text` (String): Text to type
- `options` (Object)
  - `delay` (Number): Delay between keystrokes in ms

**Returns:** Promise<void>

### `browser.waitForSelector(selector, options)`

Wait for an element to appear.

**Parameters:**
- `selector` (String): CSS selector
- `options` (Object)
  - `timeout` (Number): Wait timeout in ms. Default: `30000`
  - `visible` (Boolean): Wait for element to be visible

**Returns:** Promise<void>

### `browser.screenshot(options)`

Capture a screenshot.

**Parameters:**
- `options` (Object)
  - `path` (String): File path to save screenshot
  - `fullPage` (Boolean): Capture full scrollable page
  - `type` (String): Image format. Options: `'png'`, `'jpeg'`

**Returns:** Promise<Buffer>

---

Generated: 2025-11-16T17:59:47.165Z
Version: 2.3.0