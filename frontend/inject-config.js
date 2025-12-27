const fs = require('fs');
const path = require('path');

const configPath = path.resolve(__dirname, 'static', 'js', 'config.js');
const backendUrl = process.env.BACKEND_URL;

console.log('--- Environment Injection Start ---');
console.log('Target Path:', configPath);

if (!backendUrl) {
    console.error('❌ ERROR: BACKEND_URL environment variable is MISSING in Vercel Settings!');
    process.exit(1);
}

try {
    if (!fs.existsSync(configPath)) {
        console.error('❌ ERROR: config.js not found at', configPath);
        process.exit(1);
    }

    let content = fs.readFileSync(configPath, 'utf8');

    if (!content.includes('__BACKEND_URL__')) {
        console.warn('⚠️ WARNING: "__BACKEND_URL__" placeholder not found in config.js. Already replaced?');
    } else {
        const newContent = content.replace('__BACKEND_URL__', backendUrl);
        fs.writeFileSync(configPath, newContent);
        console.log(`✅ SUCCESS: Injected BACKEND_URL -> ${backendUrl}`);
    }
} catch (err) {
    console.error('❌ ERROR: Unexpected failure during injection:', err.message);
    process.exit(1);
}
console.log('--- Environment Injection End ---');
