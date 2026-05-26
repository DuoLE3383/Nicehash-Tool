import 'dotenv/config';
import { execFile } from 'node:child_process';
import { platform } from 'node:os';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const port = Number.parseInt(process.env.PORT || '8080', 10);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  console.error(`Invalid PORT value: ${process.env.PORT}`);
  process.exit(1);
}

async function findWindowsPids() {
  const command = [
    `$connections = Get-NetTCPConnection -LocalPort ${port} -State Listen -ErrorAction SilentlyContinue;`,
    '$connections.OwningProcess | Sort-Object -Unique'
  ].join(' ');
  const { stdout } = await execFileAsync('powershell.exe', ['-NoProfile', '-Command', command]);
  return stdout
    .split(/\r?\n/)
    .map((line) => Number.parseInt(line.trim(), 10))
    .filter(Number.isInteger);
}

async function findUnixPids() {
  try {
    const { stdout } = await execFileAsync('lsof', ['-ti', `tcp:${port}`]);
    return stdout
      .split(/\r?\n/)
      .map((line) => Number.parseInt(line.trim(), 10))
      .filter(Number.isInteger);
  } catch (err) {
    if (err.code === 1) {
      return [];
    }
    throw err;
  }
}

const pids = platform() === 'win32' ? await findWindowsPids() : await findUnixPids();

if (pids.length === 0) {
  console.log(`No process is listening on port ${port}`);
  process.exit(0);
}

for (const pid of pids) {
  if (platform() === 'win32') {
    await execFileAsync('taskkill.exe', ['/PID', String(pid), '/F']);
  } else {
    process.kill(pid, 'SIGTERM');
  }
}

console.log(`Killed process${pids.length === 1 ? '' : 'es'} on port ${port}: ${pids.join(', ')}`);
