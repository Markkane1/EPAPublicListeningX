import { execSync } from 'child_process';
import fs from 'fs';

const chrome = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const html = execSync(`"${chrome}" --headless --disable-gpu --dump-dom http://localhost:5173/dashboard`);
fs.writeFileSync('dashboard_dom.html', html);
console.log('DOM length:', html.length);