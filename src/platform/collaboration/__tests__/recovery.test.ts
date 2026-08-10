import { describe, expect, it } from 'vitest';
import { protectAccountKey, recoverAccountKey } from '../recovery';

const exportKey = (key: CryptoKey) => crypto.subtle.exportKey('raw', key);

describe('account recovery', () => {
    it('restores the account key without storing it in plaintext', async () => {
        const accountKey = await crypto.subtle.generateKey(
            { length: 256, name: 'AES-GCM' },
            true,
            ['decrypt', 'encrypt']
        );
        const recoveryCode = 'ABCD-EFGH-JKLM-NPQR-STUV-WXYZ';
        const protectedAccount = await protectAccountKey(
            accountKey,
            recoveryCode
        );
        const restored = await recoverAccountKey(
            protectedAccount.protectedKey,
            recoveryCode.toLowerCase().replaceAll('-', ' ')
        );

        expect(JSON.stringify(protectedAccount.protectedKey)).not.toContain(
            recoveryCode
        );
        expect(new Uint8Array(await exportKey(restored))).toEqual(
            new Uint8Array(await exportKey(accountKey))
        );
        await expect(
            recoverAccountKey(protectedAccount.protectedKey, 'WRONG-CODE')
        ).rejects.toThrow();
    });
});
