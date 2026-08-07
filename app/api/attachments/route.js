import {
    AttachmentRequestError,
    storeAttachmentRequest,
    validateAttachmentRequest,
} from '../../../src/server/attachmentStorage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const errorResponse = error => {
    const status = error instanceof AttachmentRequestError ? error.status : 500;
    const message =
        error instanceof AttachmentRequestError
            ? error.message
            : 'The attachment could not be stored.';

    return Response.json({ error: message }, { status });
};

export async function POST(request) {
    try {
        validateAttachmentRequest(request, {
            requireMutationProtection: true,
        });
        const metadata = await storeAttachmentRequest(request);

        return Response.json(metadata, { status: 201 });
    } catch (error) {
        return errorResponse(error);
    }
}
