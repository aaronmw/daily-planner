import { useEffect, useState } from 'react';
import { AdaptiveAttachmentGateway } from '../../platform/persistence/adaptiveAttachmentGateway';
import { attachmentIdFromUrl } from './encryptedAttachmentUrl';

const gateway = new AdaptiveAttachmentGateway();

export function EncryptedAttachmentImage({
    alt,
    url,
}: {
    alt: string;
    url: string;
}) {
    const [source, setSource] = useState<string | null>(null);
    useEffect(() => {
        const id = attachmentIdFromUrl(url);
        if (!id) return;
        let objectUrl: string | null = null;
        let cancelled = false;
        void gateway.load(id).then(blob => {
            if (cancelled) return;
            objectUrl = URL.createObjectURL(blob);
            setSource(objectUrl);
        });
        return () => {
            cancelled = true;
            if (objectUrl) URL.revokeObjectURL(objectUrl);
        };
    }, [url]);
    return source ? (
        <img alt={alt} className="h-auto max-w-full" src={source} />
    ) : (
        <span className="text-planner-text-faded">Loading image…</span>
    );
}
