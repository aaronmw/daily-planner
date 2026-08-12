import { execFileSync } from 'node:child_process';
import {
    copyFileSync,
    mkdtempSync,
    mkdirSync,
    readFileSync,
    rmSync,
    writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const iconsDirectory = join(projectRoot, 'src-tauri', 'icons');
const dockDirectory = join(iconsDirectory, 'dock');
const sourcePath = join(iconsDirectory, 'app-icon.svg');
const accentColors = JSON.parse(
    readFileSync(
        join(projectRoot, 'src', 'core', 'domain', 'accent-colors.json'),
        'utf8'
    )
);
const source = readFileSync(sourcePath, 'utf8');
const tauri = join(
    projectRoot,
    'node_modules',
    '.bin',
    process.platform === 'win32' ? 'tauri.cmd' : 'tauri'
);

const renderIcon = (input, output, pngSize) => {
    const arguments_ = ['icon', input, '--output', output];
    if (pngSize) arguments_.push('--png', String(pngSize));
    execFileSync(tauri, arguments_, { stdio: 'inherit' });
};

const devBadge = background => `
<g aria-label="Development build">
  <rect x="772" y="950" width="270" height="108" rx="54" fill="white"/>
  <text x="907" y="1023" text-anchor="middle" font-family="monospace" font-size="52" font-weight="700" fill="${background}">DEV</text>
</g>`;

const variantSource = (background, development) => {
    const variant = source.replace('fill="#001651"', `fill="${background}"`);
    return development
        ? variant.replace('</svg>', `${devBadge(background)}\n</svg>`)
        : variant;
};

const temporaryDirectory = mkdtempSync(join(tmpdir(), 'daily-planner-icons-'));

try {
    renderIcon(sourcePath, iconsDirectory);
    rmSync(dockDirectory, { force: true, recursive: true });
    mkdirSync(dockDirectory, { recursive: true });

    const variants = { default: '#001651', ...accentColors };
    for (const [name, background] of Object.entries(variants)) {
        for (const development of [false, true]) {
            const suffix = development ? '-dev' : '';
            const variantName = `${name}${suffix}`;
            const variantPath = join(temporaryDirectory, `${variantName}.svg`);
            const outputDirectory = join(temporaryDirectory, variantName);
            writeFileSync(
                variantPath,
                variantSource(background, development),
                'utf8'
            );
            renderIcon(variantPath, outputDirectory, 512);
            copyFileSync(
                join(outputDirectory, '512x512.png'),
                join(dockDirectory, `${variantName}.png`)
            );
        }
    }

    copyFileSync(
        join(dockDirectory, 'default-dev.png'),
        join(iconsDirectory, 'dev-icon.png')
    );
} finally {
    rmSync(temporaryDirectory, { force: true, recursive: true });
}
