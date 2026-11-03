import { execSync } from 'child_process';
import fs from 'fs';

const chrome = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const html = execSync(`"${chrome}" --headless --disable-gpu --dump-dom http://localhost:5173/analytics`);
fs.writeFileSync('analytics_dom.html', html);
console.log('Analytics DOM length:', html.length);