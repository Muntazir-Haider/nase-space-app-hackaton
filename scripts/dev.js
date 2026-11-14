import { spawn } from 'child_process';
import net from 'net';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const frontendDir = path.join(rootDir, 'frontend');

const isWindows = process.platform === 'win32';
const pythonCmd = isWindows ? 'python' : 'python3';
const viteBin = path.join(frontendDir, 'node_modules', 'vite', 'bin', 'vite.js');

import http from 'http';

function isBackendActive(port = 8000, host = '127.0.0.1') {
  return new Promise((resolve) => {
    const req = http.get(`http://${host}:${port}/api/v1/health`, { timeout: 800 }, (res) => {
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function main() {
  console.log('====================================================');
  console.log('  🛰️  MISSION SENTINEL - Integrated Dev Launcher');
  console.log('====================================================');

  const backendAlreadyRunning = await isBackendActive(8000);
  let backendProcess = null;

  if (backendAlreadyRunning) {
    console.log('[Backend] ✅ Station engine already active on http://127.0.0.1:8000');
  } else {
    console.log('[Backend] 🚀 Starting FastAPI on http://127.0.0.1:8000 ...');
    backendProcess = spawn(
      pythonCmd,
      ['-m', 'uvicorn', 'backend.app.main:app', '--reload', '--host', '127.0.0.1', '--port', '8000'],
      {
        cwd: rootDir,
        stdio: 'inherit',
        shell: false,
      }
    );

    backendProcess.on('error', (err) => {
      console.error('[Backend] Failed to start Python backend:', err.message);
    });
  }

  console.log('[Frontend] ⚡ Starting Vite workstation on http://localhost:5173 ...');
  const frontendProcess = spawn(process.execPath, [viteBin], {
    cwd: frontendDir,
    stdio: 'inherit',
    shell: false,
  });

  frontendProcess.on('error', (err) => {
    console.error('[Frontend] Failed to start Vite frontend:', err.message);
  });

  function shutdown() {
    console.log('\nShutting down Mission Sentinel services...');
    if (backendProcess && backendProcess.pid) {
      if (isWindows) {
        spawn('taskkill', ['/pid', backendProcess.pid.toString(), '/f', '/t'], { stdio: 'ignore', shell: true });
      } else {
        backendProcess.kill('SIGINT');
      }
    }
    if (frontendProcess && frontendProcess.pid) {
      if (isWindows) {
        spawn('taskkill', ['/pid', frontendProcess.pid.toString(), '/f', '/t'], { stdio: 'ignore', shell: true });
      } else {
        frontendProcess.kill('SIGINT');
      }
    }
    process.exit(0);
  }

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main();
