#!/usr/bin/env node
// CDP geometry probe for mathsexercise.we1co.me worksheet layout.
// Verifies cells fit their boxes PROGRAMMATICALLY (overflow=0) instead of trusting screenshots.
//
// Usage:  node cdp_geom_probe.js [url] [perRow] [viewportW] [viewportH]
//   url       default http://localhost:8894/   (or file:///home/ubuntu/mathsexercise/index.html)
//   perRow    default "4"
//   viewport  default 390x800 (mobile)
//
// Requires: Chrome listening on :9222 (restart if dead):
//   pkill -f "remote-debugging-port=9222"; \
//   /home/ubuntu/.cache/ms-playwright/chromium_headless_shell-1234/chrome-linux/headless_shell \
//     --headless --no-sandbox --disable-gpu --remote-debugging-port=9222 \
//     --user-data-dir=/home/ubuntu/.config/chromium about:blank &
// Also requires the `ws` npm module resolvable from CWD.
//
// Prints: GEN status, GEOM json {cells, overflow, cellW, cellH, fs, first}
// Target: overflow = 0. If overflow > 0, font is too big for cells — lower the
// cell-font ratio in render() (0.42 -> 0.28 fixed it; math needs ~1/3 of CJK ratio).

const http = require('http');
const fs = require('fs');
const WebSocket = require('ws');

const pageUrl = process.argv[2] || 'http://localhost:8894/';
const perRow = process.argv[3] || '4';
const vw = parseInt(process.argv[4] || '390', 10);
const vh = parseInt(process.argv[5] || '800', 10);

const req = http.request(`http://localhost:9222/json/new?${encodeURIComponent(pageUrl)}`, { method: 'PUT' }, (res) => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    const page = JSON.parse(d);
    const ws = new WebSocket(page.webSocketDebuggerUrl);
    let nextId = 1;
    const send = (method, params) => ws.send(JSON.stringify({ id: nextId++, method, params }));
    ws.on('open', () => {
      send('Runtime.enable', {});
      send('Emulation.setDeviceMetricsOverride', { width: vw, height: vh, deviceScaleFactor: 2, mobile: true });
      setTimeout(() => {
        send('Runtime.evaluate', { expression: `(() => {
          try {
            document.getElementById('optPerRow').value='${perRow}';
            generate();
            return 'gen-ok';
          } catch(e) { return 'gen-ERR: ' + e.message; }
        })()`, returnByValue: true });
        setTimeout(() => {
          send('Runtime.evaluate', { expression: `(() => {
            let bad=0; const cells=document.querySelectorAll('.qcell');
            cells.forEach(c=>{const cr=c.getBoundingClientRect();const q=c.querySelector('.qtext');if(!q)return;const qr=q.getBoundingClientRect();if(qr.bottom>cr.bottom+1||qr.right>cr.right+1)bad++});
            const c0=cells[0];const r0=c0?c0.getBoundingClientRect():null;
            const q0=c0&&c0.querySelector('.qtext')?getComputedStyle(c0.querySelector('.qtext')).fontSize:'';
            return JSON.stringify({cells:cells.length,overflow:bad,cellW:r0?Math.round(r0.width):0,cellH:r0?Math.round(r0.height):0,fs:q0,first:c0?c0.innerText.replace(/\\s+/g,' ').slice(0,15):''});
          })()`, returnByValue: true });
          setTimeout(() => send('Page.captureScreenshot', { format: 'png' }), 400);
        }, 900);
      }, 2500);
    });
    ws.on('message', (msg) => {
      const r = JSON.parse(msg);
      if (r.id === 3 && r.result && r.result.result) console.log('GEN:', r.result.result.value);
      if (r.id === 4 && r.result && r.result.result) console.log('GEOM:', r.result.result.value);
      if (r.id === 5 && r.result && r.result.data) {
        fs.writeFileSync('/tmp/math_geom_probe.png', Buffer.from(r.result.data, 'base64'));
        console.log('SAVED /tmp/math_geom_probe.png'); ws.close(); process.exit(0);
      }
    });
    ws.on('error', e => console.log('WS ERR', e.message));
  });
});
req.on('error', e => console.log('http err:', e.message));
req.end();
setTimeout(() => { console.log('TIMEOUT'); process.exit(0); }, 20000);
