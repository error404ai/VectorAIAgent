// Script to update Vite configuration to use a different port
const fs = require("fs");
const path = require("path");

// Path to vite.config.js/ts (search both options)
const configPaths = [path.join(__dirname, "vite.config.js"), path.join(__dirname, "vite.config.ts")];

// Find existing config file
let configPath = null;
for (const path of configPaths) {
  if (fs.existsSync(path)) {
    configPath = path;
    break;
  }
}

if (!configPath) {
  console.error("Could not find Vite config file");
  process.exit(1);
}

// Read the file
let config = fs.readFileSync(configPath, "utf8");

// Check if server configuration already exists
if (config.includes("server: {")) {
  // Update port in existing server config
  config = config.replace(/server:\s*{[^}]*port:\s*\d+[^}]*}/g, "server: { port: 5124 }");
} else {
  // Add server configuration
  if (config.includes("export default")) {
    // Add to defineConfig
    config = config.replace(/defineConfig\(\s*{/g, "defineConfig({\n  server: { port: 5124 },");
  } else {
    console.error("Could not find location to insert server config");
    process.exit(1);
  }
}

// Write updated config back to file
fs.writeFileSync(configPath, config);
console.log(`Updated Vite config to use port 5124 in ${configPath}`);
