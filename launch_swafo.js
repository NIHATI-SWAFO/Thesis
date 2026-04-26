const { spawn } = require('child_process');
const path = require('path');

const runCommand = (command, args, cwd, name) => {
  const process = spawn(command, args, { cwd, shell: true });

  process.stdout.on('data', (data) => {
    console.log(`[${name}] ${data.toString().trim()}`);
  });

  process.stderr.on('data', (data) => {
    console.error(`[${name} ERROR] ${data.toString().trim()}`);
  });

  process.on('close', (code) => {
    console.log(`[${name}] process exited with code ${code}`);
  });

  return process;
};

console.log('🚀 Starting SWAFO Full-Stack System...');

const backendPath = path.join(__dirname, 'swafo-web-app', 'backend');
const frontendPath = path.join(__dirname, 'swafo-web-app', 'frontend');

// Start Backend
const backend = runCommand('.venv\\Scripts\\python.exe', ['manage.py', 'runserver', '5000'], backendPath, 'BACKEND');

// Start Frontend
const frontend = runCommand('npm', ['run', 'dev'], frontendPath, 'FRONTEND');

process.on('SIGINT', () => {
  backend.kill();
  frontend.kill();
  process.exit();
});
