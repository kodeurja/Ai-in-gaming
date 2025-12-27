const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, 'static', 'js', 'config.js');
const backendUrl = process.env.BACKEND_URL;

if (!backendUrl) {
    console.error('❌ ERROR: BACKEND_URL environment variable is not set!');
    process.exit(1);
}

try {
    let content = fs.readFileSync(configPath, 'utf8');
    content = content.replace('__BACKEND_URL__', backendUrl);
    fs.writeFileSync(configPath, content);
    console.log(`✅ successfully injected BACKEND_URL: ${backendUrl}`);
} catch (err) {
    console.error('❌ ERROR: Failed to update config.js', err);
    process.exit(1);
}
