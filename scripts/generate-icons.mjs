import sharp from 'sharp';
import { existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const src = join(root, 'public', 'icon-source.png');
const out = join(root, 'public');

if (!existsSync(src)) {
  console.error('❌ icon-source.png não encontrado em public/');
  process.exit(1);
}

const sizes = [
  { name: 'favicon-16.png',       size: 16  },
  { name: 'favicon-32.png',       size: 32  },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'icon-192.png',         size: 192 },
  { name: 'icon-512.png',         size: 512 },
  { name: 'icon-1024.png',        size: 1024 },
];

for (const { name, size } of sizes) {
  await sharp(src)
    .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 1 } })
    .png()
    .toFile(join(out, name));
  console.log(`✅ ${name} (${size}x${size})`);
}

// favicon.ico = ICO com 16 e 32 dentro (usando raw PNG renomeado para máxima compatibilidade)
// Browsers modernos aceitam PNG como favicon; vamos copiar o 32px
import { copyFileSync } from 'fs';
copyFileSync(join(out, 'favicon-32.png'), join(out, 'favicon.ico'));
console.log('✅ favicon.ico (32x32 PNG)');

console.log('\n🎉 Todos os ícones gerados em /public/');
