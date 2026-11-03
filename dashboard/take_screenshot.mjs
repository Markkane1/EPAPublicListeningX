import { exec } from 'child_process';
import path from 'path';

const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const outDir = "C:\\Users\\Asif\\.gemini\\antigravity\\brain\\a6dc8537-a91f-4ace-9851-c149428ca25f";

function snap(url, filename) {
  return new Promise((resolve, reject) => {
    const target = path.join(outDir, filename);
    const cmd = `"${chromePath}" --headless --disable-gpu --window-size=1600,1200 --screenshot="${target}" "${url}"`;
    exec(cmd, (err) => {
      if (err) reject(err);
      else {
        console.log(`Saved ${filename}`);
        resolve();
      }
    });
  });
}

async function run() {
  await snap('http://localhost:5173/dashboard', 'polished_dashboard.png');
  await snap('http://localhost:5173/analytics', 'polished_analytics.png');
  await snap('http://localhost:5173/posts', 'polished_posts.png');
  await snap('http://localhost:5173/audit', 'polished_audit.png');
  console.log('All screenshots captured!');
}

run();