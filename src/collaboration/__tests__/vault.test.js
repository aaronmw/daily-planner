import { webcrypto } from 'node:crypto';
import {
    generateAccountKey,
    generateRecoveryCode,
    generateVaultKey,
    protectAccountKey,
    recoverAccountKey,
    unwrapAccountKeyWithVault,
    wrapAccountKeyWithVault,
} from '../vault';

describe('local collaboration vault', () => {
    it('creates a non-exportable AES-KW vault key', async () => {
        const vaultKey = await generateVaultKey(webcrypto);

        expect(vaultKey.algorithm).toMatchObject({
            name: 'AES-KW',
            length: 256,
        });
        expect(vaultKey.extractable).toBe(false);
        await expect(
            webcrypto.subtle.exportKey('raw', vaultKey)
        ).rejects.toThrow();
    });

    it('wraps an account key for local vault storage', async () => {
        const vaultKey = await generateVaultKey(webcrypto);
        const accountKey = await generateAccountKey(webcrypto);
        const wrapped = await wrapAccountKeyWithVault(
            accountKey,
            vaultKey,
            webcrypto
        );
        const restored = await unwrapAccountKeyWithVault(
            wrapped,
            vaultKey,
            webcrypto
        );

        expect(restored.algorithm).toMatchObject({
            name: 'AES-KW',
            length: 256,
        });
        expect(restored.usages).toEqual(['wrapKey', 'unwrapKey']);
    });

    it('protects and recovers an account key with PBKDF2-SHA256', async () => {
        const accountKey = await generateAccountKey(webcrypto);
        const recoveryCode = generateRecoveryCode(webcrypto);
        const result = await protectAccountKey(accountKey, {
            recoveryCode,
            cryptoImpl: webcrypto,
        });
        const recovered = await recoverAccountKey(
            result.protectedKey,
            recoveryCode.toUpperCase(),
            webcrypto
        );

        expect(result.recoveryCode).toBe(recoveryCode);
        expect(result.protectedKey).toMatchObject({
            algorithm: 'AES-256-GCM',
            iterations: 310000,
            kdf: 'PBKDF2-SHA256',
            version: 1,
        });
        expect(recovered.algorithm).toMatchObject({
            name: 'AES-KW',
            length: 256,
        });
    });

    it('rejects the wrong recovery code', async () => {
        const accountKey = await generateAccountKey(webcrypto);
        const { protectedKey } = await protectAccountKey(accountKey, {
            recoveryCode: 'abcde-fghij-klmno-pqrst-uvwxy',
            cryptoImpl: webcrypto,
        });

        await expect(
            recoverAccountKey(
                protectedKey,
                'wrong-wrong-wrong-wrong-wrong',
                webcrypto
            )
        ).rejects.toThrow();
    });
});
