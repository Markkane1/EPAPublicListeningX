import http from 'http';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const outDir = "C:\\Users\\Asif\\.gemini\\antigravity\\brain\\a6dc8537-a91f-4ace-9851-c149428ca25f";

async function snapFilteredDashboard() {
  const target = path.join(outDir, 'verify_dashboard_filtered.png');
  const port = 9444;
  const chromeProc = spawn(chromePath, [
    '--headless',
    `--remote-debugging-port=${port}`,
    '--disable-gpu',
    'http://localhost:5173/dashboard'
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
        params: { width: 1600, height: 1400, deviceScaleFactor: 1, mobile: false }
      }));
    });

    ws.addEventListener('message', async (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id === 1) {
        
        setTimeout(() => {
          ws.send(JSON.stringify({
            id: 2,
            method: 'Runtime.evaluate',
            params: {
              expression: `(() => {
                const chips = Array.from(document.querySelectorAll('div, button, span'));
                const peakSmogChip = chips.find(el => el.textContent && el.textContent.trim() === 'Peak Smog (6PM-12AM)');
                if (peakSmogChip) {
                  peakSmogChip.click();
                  return 'CLICKED_PEAK_SMOG: ' + peakSmogChip.className;
                }
                return 'NOT_FOUND';
              })()`
            }
          }));
        }, 1500);
      } else if (msg.id === 2) {
        console.log('Runtime eval result:', msg.result?.result?.value);
        
        setTimeout(() => {
          ws.send(JSON.stringify({
            id: 3,
            method: 'Page.captureScreenshot',
            params: { format: 'png' }
          }));
        }, 600);
      } else if (msg.id === 3) {
        const buf = Buffer.from(msg.result.data, 'base64');
        fs.writeFileSync(target, buf);
        console.log('Saved verify_dashboard_filtered.png successfully!');
        ws.close();
        chromeProc.kill();
        process.exit(0);
      }
    });
  } catch (e) {
    chromeProc.kill();
    console.error(e);
    process.exit(1);
  }
}

snapFilteredDashboard();