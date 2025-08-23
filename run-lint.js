const { exec } = require('child_process');

console.log('Current directory:', __dirname);

exec('cd frontend && npm run lint', (error, stdout, stderr) => {
  console.log('exec callback');
  if (error) {
    console.error(`error: ${error.message}`);
    return;
  }

  if (stderr) {
    console.error(`stderr: ${stderr}`);
    return;
  }

  console.log(`stdout: ${stdout}`);
});