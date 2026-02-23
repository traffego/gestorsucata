const fs = require('fs');
const path = require('path');

function copyDirSync(src, dest) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        if (entry.isDirectory()) {
            copyDirSync(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

const root = path.resolve(__dirname, '..');
const distDir = path.join(root, 'dist');

// Clean
if (fs.existsSync(distDir)) fs.rmSync(distDir, { recursive: true });

// 1. Copy landing page dist to root dist/
copyDirSync(path.join(root, 'landingpage', 'dist'), distDir);

// 2. Copy app dist into dist/app/
copyDirSync(path.join(root, 'app', 'dist'), path.join(distDir, 'app'));

console.log('✅ Merged: landing → dist/, app → dist/app/');
