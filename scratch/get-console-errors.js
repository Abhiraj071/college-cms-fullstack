const fs = require('fs');
const path = require('path');

const scratchDir = __dirname;
const puppeteer = require(path.join(scratchDir, 'node_modules/puppeteer-core'));

const chromePaths = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    path.join(process.env.USERPROFILE || '', 'AppData\\Local\\Google\\Chrome\\Application\\chrome.exe')
];

let chromePath = null;
for (const p of chromePaths) {
    if (fs.existsSync(p)) {
        chromePath = p;
        break;
    }
}

(async () => {
    const browser = await puppeteer.launch({
        executablePath: chromePath,
        headless: true
    });

    const page = await browser.newPage();

    // Capture errors via window.onerror before page loads
    await page.evaluateOnNewDocument(() => {
        window.addEventListener('error', event => {
            console.log(`__WINDOW_ERROR__ Message: ${event.message} | File: ${event.filename} | Line: ${event.lineno} | Col: ${event.colno}`);
        }, true);
    });

    page.on('console', msg => {
        console.log(`PAGE LOG [${msg.type()}]:`, msg.text());
    });

    page.on('pageerror', err => {
        console.error('PAGE EXCEPTION/ERROR:', err.message, '\nStack:', err.stack);
    });

    console.log('Navigating to http://localhost:3000 ...');
    try {
        await page.goto('http://localhost:3000', { waitUntil: 'load', timeout: 10000 });
    } catch (e) {
        console.error('Navigation error or timeout:', e.message);
    }

    console.log('Waiting 3 seconds for dynamic logs...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('Closing browser...');
    await browser.close();
})().catch(err => {
    console.error('Script failed:', err);
});
