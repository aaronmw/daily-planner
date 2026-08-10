import { attachmentIdSchema } from '../../core/domain/ids';
import { AdaptiveAttachmentGateway } from '../../platform/persistence/adaptiveAttachmentGateway';

const gateway = new AdaptiveAttachmentGateway();
const PREFIX = 'daily-planner-attachment://';

export const attachmentIdFromUrl = (url: string): string | null => {
    if (!url.startsWith(PREFIX)) return null;
    const parsed = attachmentIdSchema.safeParse(url.slice(PREFIX.length));
    return parsed.success ? parsed.data : null;
};

export const openEncryptedAttachment = async (url: string): Promise<void> => {
    const id = attachmentIdFromUrl(url);
    if (!id) return;
    const blob = await gateway.load(id);
    const objectUrl = URL.createObjectURL(blob);
    window.open(objectUrl, '_blank', 'noopener,noreferrer');
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
};
