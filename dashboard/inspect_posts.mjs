import { exec } from 'child_process';
import path from 'path';

const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const outDir = "C:\\Users\\Asif\\.gemini\\antigravity\\brain\\a6dc8537-a91f-4ace-9851-c149428ca25f";

function snap(url, filename, width = 1600, height = 1200) {
  return new Promise((resolve, reject) => {
    const target = path.join(outDir, filename);
    const cmd = `"${chromePath}" --headless --disable-gpu --window-size=${width},${height} --screenshot="${target}" "${url}"`;
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
  await snap('http://localhost:5173/posts', 'posts_desktop.png', 1600, 1400);
  await snap('http://localhost:5173/posts', 'posts_mobile.png', 390, 844);
  console.log('Posts screenshots captured!');
}

run();