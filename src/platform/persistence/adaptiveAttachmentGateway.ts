import type { AttachmentGateway } from '../../core/application/ports';
import { EncryptedDexieAttachmentGateway } from './attachmentGateway';

export class AdaptiveAttachmentGateway implements AttachmentGateway {
    readonly #local = new EncryptedDexieAttachmentGateway();

    async delete(attachmentId: string): Promise<void> {
        if (await this.#local.has(attachmentId)) {
            await this.#local.delete(attachmentId);
            return;
        }
        const { SupabaseEncryptedAttachmentGateway } =
            await import('../collaboration/cloudAttachmentGateway');
        await new SupabaseEncryptedAttachmentGateway().delete(attachmentId);
    }

    async load(attachmentId: string): Promise<Blob> {
        if (await this.#local.has(attachmentId)) {
            return this.#local.load(attachmentId);
        }
        const { SupabaseEncryptedAttachmentGateway } =
            await import('../collaboration/cloudAttachmentGateway');
        return new SupabaseEncryptedAttachmentGateway().load(attachmentId);
    }

    async upload(
        file: File,
        options: Parameters<AttachmentGateway['upload']>[1]
    ): ReturnType<AttachmentGateway['upload']> {
        if (!options.syncEnabled) return this.#local.upload(file, options);
        const { SupabaseEncryptedAttachmentGateway } =
            await import('../collaboration/cloudAttachmentGateway');
        return new SupabaseEncryptedAttachmentGateway().upload(file, options);
    }
}
