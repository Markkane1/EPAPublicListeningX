import http from 'http';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const outDir = "C:\\Users\\Asif\\.gemini\\antigravity\\brain\\a6dc8537-a91f-4ace-9851-c149428ca25f";

function snapCDP(url, filename, width = 1600, height = 1400, isMobile = false) {
  return new Promise(async (resolve, reject) => {
    const target = path.join(outDir, filename);
    const port = 9333 + Math.floor(Math.random() * 500);
    const chromeProc = spawn(chromePath, [
      '--headless',
      `--remote-debugging-port=${port}`,
      '--disable-gpu',
      url
    ]);

    await new Promise(r => setTimeout(r, 1500));

    try {
      const targets = await new Promise((res, rej) => {
        http.get(`http://127.0.0.1:${port}/json`, (resp) => {
          let data = '';
          resp.on('data', c => data += c);
          resp.on('end', () => res(JSON.parse(data)));
        }).on('error', rej);
      });

      const page = targets.find(t => t.type === 'page');
      const ws = new WebSocket(page.webSocketDebuggerUrl);

      ws.addEventListener('open', () => {
        ws.send(JSON.stringify({
          id: 1,
          method: 'Emulation.setDeviceMetricsOverride',
          params: { width, height, deviceScaleFactor: 1, mobile: isMobile }
        }));
      });

      ws.addEventListener('message', (event) => {
        const msg = JSON.parse(event.data);
        if (msg.id === 1) {
          // Wait 1200ms for React useEffect / Auth session to hydrate
          setTimeout(() => {
            ws.send(JSON.stringify({
              id: 2,
              method: 'Page.captureScreenshot',
              params: { format: 'png' }
            }));
          }, 1200);
        } else if (msg.id === 2) {
          const buf = Buffer.from(msg.result.data, 'base64');
          fs.writeFileSync(target, buf);
          console.log(`Saved ${filename}`);
          ws.close();
          chromeProc.kill();
          resolve();
        }
      });
    } catch (e) {
      chromeProc.kill();
      reject(e);
    }
  });
}

async function run() {
  console.log('Capturing verified snapshots...');
  await snapCDP('http://localhost:5173/dashboard', 'verify_dashboard_desktop.png', 1600, 1600, false);
  await snapCDP('http://localhost:5173/search', 'verify_search_desktop.png', 1600, 1600, false);
  await snapCDP('http://localhost:5173/posts?mini=0', 'verify_posts_desktop_open.png', 1600, 1400, false);
  await snapCDP('http://localhost:5173/dashboard', 'verify_dashboard_mobile.png', 390, 1800, true);
  await snapCDP('http://localhost:5173/search', 'verify_search_mobile.png', 390, 1600, true);
  await snapCDP('http://localhost:5173/posts', 'verify_posts_mobile.png', 390, 1600, true);

  console.log('All verification snapshots captured successfully!');
  process.exit(0);
}

run();
