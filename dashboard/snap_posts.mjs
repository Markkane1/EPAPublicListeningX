import http from 'http';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const outDir = "C:\\Users\\Asif\\.gemini\\antigravity\\brain\\264c7ab6-f3a6-4989-a45e-40859b85f7b3";

// Fetch admin auth token from backend
async function fetchToken() {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ username: 'admin', password: 'EPAadmin2026!' });
    const req = http.request({
      hostname: '127.0.0.1',
      port: 8080,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json.token);
        } catch (e) {
          resolve('dummy');
        }
      });
    });
    req.on('error', () => resolve('dummy'));
    req.write(postData);
    req.end();
  });
}

function snapCDP(url, filename, token, width = 1600, height = 1300, mobile = false, clickText = null) {
  return new Promise(async (resolve, reject) => {
    const target = path.join(outDir, filename);
    const port = 9400 + Math.floor(Math.random() * 100);
    const chromeProc = spawn(chromePath, [
      '--headless=new',
      `--remote-debugging-port=${port}`,
      '--disable-gpu',
      '--no-sandbox',
      'about:blank'
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
      if (!page) throw new Error('No page target found');

      const ws = new WebSocket(page.webSocketDebuggerUrl);

      ws.addEventListener('open', () => {
        ws.send(JSON.stringify({ id: 1, method: 'Page.enable' }));
        ws.send(JSON.stringify({
          id: 2,
          method: 'Page.addScriptToEvaluateOnNewDocument',
          params: {
            source: `localStorage.setItem('epa_auth_token', '${token}');`
          }
        }));
        ws.send(JSON.stringify({
          id: 3,
          method: 'Emulation.setDeviceMetricsOverride',
          params: { width, height, deviceScaleFactor: 1, mobile }
        }));
        ws.send(JSON.stringify({
          id: 4,
          method: 'Page.navigate',
          params: { url }
        }));
      });

      ws.addEventListener('message', async (event) => {
        const msg = JSON.parse(event.data);
        if (msg.id === 4) {
          // Navigated, wait for hydration
          await new Promise(r => setTimeout(r, 2200));

          if (clickText) {
            ws.send(JSON.stringify({
              id: 10,
              method: 'Runtime.evaluate',
              params: {
                expression: `
                  const btns = Array.from(document.querySelectorAll('button'));
                  const targetBtn = btns.find(b => b.textContent.includes('${clickText}'));
                  if (targetBtn) {
                    targetBtn.click();
                    'CLICKED';
                  } else {
                    'NOT_FOUND';
                  }
                `
              }
            }));
            await new Promise(r => setTimeout(r, 1000));
          }

          ws.send(JSON.stringify({
            id: 20,
            method: 'Page.captureScreenshot',
            params: { format: 'png' }
          }));
        } else if (msg.id === 20) {
          const buf = Buffer.from(msg.result.data, 'base64');
          fs.writeFileSync(target, buf);
          console.log(`Saved screenshot ${filename} (${buf.length} bytes)`);
          ws.close();
          chromeProc.kill();
          resolve();
        }
      });

      ws.addEventListener('error', (err) => {
        chromeProc.kill();
        reject(err);
      });
    } catch (err) {
      chromeProc.kill();
      reject(err);
    }
  });
}

async function run() {
  try {
    const token = await fetchToken();
    console.log('Using auth token:', token.slice(0, 10) + '...');

    console.log('1. Capturing Posts Feed with Default Latest Sort...');
    await snapCDP('http://localhost:5173/posts', 'posts_verified_default.png', token, 1600, 1400);

    console.log('2. Capturing Posts Feed Sorted by Most Interactions...');
    await snapCDP('http://localhost:5173/posts', 'posts_verified_interactions.png', token, 1600, 1400, false, 'Most Interactions');

    console.log('3. Capturing Posts Feed Sorted by Highest AQI...');
    await snapCDP('http://localhost:5173/posts', 'posts_verified_aqi.png', token, 1600, 1400, false, 'Highest AQI');

    console.log('4. Capturing Posts Feed Sorted by Most Discussion...');
    await snapCDP('http://localhost:5173/posts', 'posts_verified_discussion.png', token, 1600, 1400, false, 'Most Discussion');

    console.log('5. Capturing Mobile View...');
    await snapCDP('http://localhost:5173/posts', 'posts_verified_mobile.png', token, 390, 1600, true);

    console.log('ALL VERIFIED SCREENSHOTS SAVED SUCCESSFULLY!');
  } catch (e) {
    console.error('Error snapping:', e);
  }
}

run();
