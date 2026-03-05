const { execSync } = require('child_process');

const dir = 'e:\\HAPPYAGENCY\\00 Clients\\00 En cours\\Manuel\\code src\\react-native\\mobile';

try {
    const out = execSync('node_modules\\.bin\\tsc --noEmit --skipLibCheck', {
        cwd: dir,
        encoding: 'utf8',
        timeout: 90000,
    });
    console.log('--- FULL GREEN: 0 TypeScript errors ---');
    if (out) console.log(out);
} catch (e) {
    const msg = String(e.stdout || '') + String(e.stderr || '');
    if (msg.trim()) {
        console.log('=== ERRORS ===');
        console.log(msg.slice(0, 5000));
    } else {
        console.log('Exit code:', e.status, '— no text output captured');
    }
}
