import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(exec);
const PORT = process.env.PORT || 8080;

async function killPort() {
  const isWindows = process.platform === 'win32';
  console.log(`[Kill-Port] Checking for processes on port ${PORT}...`);

  try {
    if (isWindows) {
      const { stdout } = await execAsync(`netstat -ano | findstr :${PORT}`);
      if (!stdout) return;

      const lines = stdout.trim().split('\n');
      const pids = new Set();
      
      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1];
        if (pid && pid !== '0' && /^\d+$/.test(pid)) pids.add(pid);
      }

      for (const pid of pids) {
        console.log(`[Kill-Port] Terminating PID ${pid}...`);
        try {
          await execAsync(`taskkill /F /PID ${pid}`);
        } catch (e) {}
      }
    } else {
      await execAsync(`lsof -t -i:${PORT} | xargs kill -9 2>/dev/null || true`);
    }
  } catch (error) {}
}

killPort();