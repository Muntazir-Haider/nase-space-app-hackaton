import { spawn } from 'child_process';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const SCREENSHOT_DIR = path.resolve('screenshots');

if (!existsSync(SCREENSHOT_DIR)) {
  mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getDebuggerUrl(port = 9222) {
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (res.ok) {
        const data = await res.json();
        return data.webSocketDebuggerUrl;
      }
    } catch (e) {
      // wait
    }
    await sleep(250);
  }
  throw new Error('Could not connect to Chrome debugger port');
}

class CDPClient {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.msgId = 0;
    this.pending = new Map();
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.ws.onopen = () => resolve();
      this.ws.onerror = (err) => reject(err);
      this.ws.onmessage = (event) => {
        try {
          const res = JSON.parse(event.data);
          if (res.id && this.pending.has(res.id)) {
            const { resolve, reject } = this.pending.get(res.id);
            this.pending.delete(res.id);
            if (res.error) reject(new Error(JSON.stringify(res.error)));
            else resolve(res.result);
          }
        } catch (e) {
          console.error('Error handling message', e);
        }
      };
    });
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = ++this.msgId;
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async close() {
    this.ws.close();
  }
}

async function capture() {
  console.log('Launching headless Chrome...');
  const tempUserData = path.resolve('temp_chrome_profile');
  const chromeProc = spawn(CHROME_PATH, [
    '--headless=new',
    '--remote-debugging-port=9222',
    `--user-data-dir=${tempUserData}`,
    '--window-size=1920,1080',
    '--hide-scrollbars',
    '--disable-gpu',
    '--no-sandbox',
    'http://localhost:5173/'
  ], { stdio: 'ignore' });

  try {
    const wsUrl = await getDebuggerUrl(9222);
    console.log('Connected to Chrome DevTools Protocol at:', wsUrl);

    // Get the page target
    const targetsRes = await fetch('http://127.0.0.1:9222/json/list');
    const targets = await targetsRes.json();
    const pageTarget = targets.find(t => t.type === 'page');
    if (!pageTarget) throw new Error('No page target found');

    const client = new CDPClient(pageTarget.webSocketDebuggerUrl);
    await client.connect();

    await client.send('Page.enable');
    await client.send('DOM.enable');
    await client.send('Network.enable');

    // Set 1920x1080 Full HD viewport
    await client.send('Emulation.setDeviceMetricsOverride', {
      width: 1920,
      height: 1080,
      deviceScaleFactor: 1,
      mobile: false,
    });

    console.log('Setting authenticated localStorage...');
    await client.send('Runtime.evaluate', {
      expression: `
        localStorage.setItem('mission_sentinel_operator', JSON.stringify({
          callsign: 'ARTEMIS-CMO',
          full_name: 'Dr. Elena Vance',
          role: 'CREW_MEDICAL_OFFICER',
          permissions: ['ALL']
        }));
        localStorage.setItem('mission_sentinel_token', 'mock_token_artemis_2026');
        window.location.reload();
      `
    });

    // Wait for reload and initial data loading
    console.log('Waiting for authenticated dashboard to render...');
    await sleep(3500);

    // 1. Station Command Overview
    console.log('Capturing 01_station_command_overview.png...');
    const shot1 = await client.send('Page.captureScreenshot', { format: 'png' });
    writeFileSync(path.join(SCREENSHOT_DIR, '01_station_command_overview.png'), Buffer.from(shot1.data, 'base64'));

    // 2. Scroll to 3D Orion Spacecraft Subsystem
    console.log('Focusing 3D Orion Spacecraft Viewport...');
    await client.send('Runtime.evaluate', {
      expression: `
        const btn = document.querySelector('button span') || document.body;
        const orionTabs = Array.from(document.querySelectorAll('button')).filter(b => b.textContent.includes('360° Orion Spacecraft'));
        if (orionTabs.length > 0) orionTabs[0].click();
        const el = document.getElementById('spatial-reference-section');
        if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
      `
    });
    await sleep(2000);
    console.log('Capturing 02_real_3d_orion_spacecraft.png...');
    const shot2 = await client.send('Page.captureScreenshot', { format: 'png' });
    writeFileSync(path.join(SCREENSHOT_DIR, '02_real_3d_orion_spacecraft.png'), Buffer.from(shot2.data, 'base64'));

    // 3. Switch to 360° Real Human Anatomy Scanner
    console.log('Switching to 360° Human Anatomy Scanner...');
    await client.send('Runtime.evaluate', {
      expression: `
        const anatomyTabs = Array.from(document.querySelectorAll('button')).filter(b => b.textContent.includes('360° Human Anatomy'));
        if (anatomyTabs.length > 0) anatomyTabs[0].click();
        const el = document.getElementById('spatial-reference-section');
        if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
      `
    });
    await sleep(2000);
    console.log('Capturing 03_real_3d_human_anatomy.png...');
    const shot3 = await client.send('Page.captureScreenshot', { format: 'png' });
    writeFileSync(path.join(SCREENSHOT_DIR, '03_real_3d_human_anatomy.png'), Buffer.from(shot3.data, 'base64'));

    // 4. Navigate to Review / Astronaut Profile Detail
    console.log('Navigating to Astronaut Profile View...');
    await client.send('Runtime.evaluate', {
      expression: `
        window.scrollTo(0, 0);
        const reviewLinks = Array.from(document.querySelectorAll('button, a')).filter(b => b.textContent.includes('Crew Review') || b.textContent.includes('Elena Vance') || b.textContent.includes('Telemetry'));
        if (reviewLinks.length > 0) reviewLinks[0].click();
      `
    });
    await sleep(2500);
    console.log('Capturing 04_astronaut_profile_dr_elena_vance.png...');
    const shot4 = await client.send('Page.captureScreenshot', { format: 'png' });
    writeFileSync(path.join(SCREENSHOT_DIR, '04_astronaut_profile_dr_elena_vance.png'), Buffer.from(shot4.data, 'base64'));

    // 5. Scroll to Synchronized Biometric Corridor Charts
    console.log('Scrolling to Synchronized Corridor Charts...');
    await client.send('Runtime.evaluate', {
      expression: `
        const chartSec = document.querySelector('svg') || document.body;
        window.scrollBy(0, 450);
      `
    });
    await sleep(1500);
    console.log('Capturing 05_synchronized_biometric_corridor_charts.png...');
    const shot5 = await client.send('Page.captureScreenshot', { format: 'png' });
    writeFileSync(path.join(SCREENSHOT_DIR, '05_synchronized_biometric_corridor_charts.png'), Buffer.from(shot5.data, 'base64'));

    // 6. Open Evidence Modal / Clinical Handover Report
    console.log('Opening Clinical Alert Evidence Modal...');
    await client.send('Runtime.evaluate', {
      expression: `
        const inspectBtns = Array.from(document.querySelectorAll('button')).filter(b => b.textContent.includes('Inspect Evidence') || b.textContent.includes('Clinical Audit') || b.textContent.includes('Audit Log'));
        if (inspectBtns.length > 0) inspectBtns[0].click();
      `
    });
    await sleep(2000);
    console.log('Capturing 06_clinical_handover_report.png...');
    const shot6 = await client.send('Page.captureScreenshot', { format: 'png' });
    writeFileSync(path.join(SCREENSHOT_DIR, '06_clinical_handover_report.png'), Buffer.from(shot6.data, 'base64'));

    await client.close();
    console.log('Screenshot capture process finished successfully!');
  } finally {
    try {
      chromeProc.kill('SIGTERM');
    } catch (e) {}
  }
}

capture().catch((err) => {
  console.error('Screenshot capture failed:', err);
  process.exit(1);
});
