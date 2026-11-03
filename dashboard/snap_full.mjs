import { exec } from 'child_process';
import path from 'path';

const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const outDir = "C:\\Users\\Asif\\.gemini\\antigravity\\brain\\e29a6678-633e-40f2-b5c0-230ddde89f47";

function snap(url, filename, h = 2200) {
  return new Promise((resolve, reject) => {
    const target = path.join(outDir, filename);
    const cmd = `"${chromePath}" --headless --disable-gpu --window-size=1600,${h} --screenshot="${target}" "${url}"`;
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
  await snap('http://localhost:5173/dashboard', 'updated_dashboard.png', 2400);
}

run();
