import {
    NOTARIZATION_APPLE_ID,
    NOTARIZATION_TEAM_ID,
    storeNotarizationPassword,
} from './macos-signing.mjs';

if (process.platform !== 'darwin') {
    console.error('macOS notarization can only be configured on macOS.');
    process.exit(1);
}

console.log(
    `Store the Apple app-specific password for ${NOTARIZATION_APPLE_ID}.`
);
console.log(`Apple Developer Team: ${NOTARIZATION_TEAM_ID}`);
console.log(
    'The password will be hidden while you type and saved only in Keychain.'
);

if (!storeNotarizationPassword()) {
    console.error('The notarization password was not saved.');
    process.exit(1);
}

console.log('Daily Planner notarization credentials saved to Keychain.');
console.log(
    'Future `pnpm tauri:build` runs will notarize Developer ID builds.'
);
