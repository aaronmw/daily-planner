import type { ListId, ItemId } from '../../core/domain/ids';
import { AdaptiveAttachmentGateway } from '../../platform/persistence/adaptiveAttachmentGateway';

interface UploadRequest {
    clientId: string;
    controller: AbortController;
    file: File;
    keyVersion: number;
    listId: ListId;
    onProgress: (progress: number) => void;
    reject: (error: unknown) => void;
    resolve: (value: {
        attachmentKey: string;
        id: string;
        url: string;
    }) => void;
    syncEnabled: boolean;
    itemId: ItemId;
}

export class AttachmentUploadManager {
    readonly #gateway = new AdaptiveAttachmentGateway();
    readonly #controllers = new Map<string, AbortController>();
    readonly #queue: UploadRequest[] = [];
    #active = 0;

    enqueue(
        file: File,
        options: {
            clientId: string;
            keyVersion: number;
            listId: ListId;
            onProgress: (progress: number) => void;
            syncEnabled: boolean;
            itemId: ItemId;
        }
    ): Promise<{ attachmentKey: string; id: string; url: string }> {
        const controller = new AbortController();
        this.#controllers.set(options.clientId, controller);
        return new Promise((resolve, reject) => {
            this.#queue.push({
                controller,
                file,
                reject,
                resolve,
                ...options,
            });
            this.#drain();
        });
    }

    cancel(clientId: string): void {
        this.#controllers.get(clientId)?.abort();
    }

    #drain(): void {
        while (this.#active < 3 && this.#queue.length > 0) {
            const request = this.#queue.shift();
            if (!request) return;
            if (request.controller.signal.aborted) {
                this.#controllers.delete(request.clientId);
                request.reject(new DOMException('Aborted', 'AbortError'));
                continue;
            }
            this.#active += 1;
            void this.#run(request).finally(() => {
                this.#active -= 1;
                this.#controllers.delete(request.clientId);
                this.#drain();
            });
        }
    }

    async #run(request: UploadRequest): Promise<void> {
        let lastError: unknown;
        for (let attempt = 0; attempt < 3; attempt += 1) {
            try {
                const result = await this.#gateway.upload(request.file, {
                    keyVersion: request.keyVersion,
                    listId: request.listId,
                    onProgress: request.onProgress,
                    signal: request.controller.signal,
                    syncEnabled: request.syncEnabled,
                    itemId: request.itemId,
                });
                request.resolve(result);
                return;
            } catch (error) {
                lastError = error;
                if (
                    request.controller.signal.aborted ||
                    (error instanceof DOMException &&
                        error.name === 'AbortError')
                ) {
                    break;
                }
                await new Promise(resolve =>
                    setTimeout(resolve, 250 * 2 ** attempt)
                );
            }
        }
        request.reject(lastError);
    }
}

export const attachmentUploadManager = new AttachmentUploadManager();
