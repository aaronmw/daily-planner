import {
    AttachmentRequestError,
    createAttachmentResponse,
    deleteAttachment,
    validateAttachmentRequest,
} from '../../../../src/server/attachmentStorage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const errorResponse = error => {
    if (error?.code === 'ENOENT') {
        return Response.json(
            { error: 'Attachment not found.' },
            { status: 404 }
        );
    }

    const status = error instanceof AttachmentRequestError ? error.status : 500;
    const message =
        error instanceof AttachmentRequestError
            ? error.message
            : 'The attachment request failed.';

    return Response.json({ error: message }, { status });
};

export async function GET(request, { params }) {
    try {
        validateAttachmentRequest(request);
        const { id } = await params;

        return await createAttachmentResponse(id);
    } catch (error) {
        return errorResponse(error);
    }
}

export async function DELETE(request, { params }) {
    try {
        validateAttachmentRequest(request, {
            requireMutationProtection: true,
        });
        const { id } = await params;

        await deleteAttachment(id);
        return new Response(null, { status: 204 });
    } catch (error) {
        return errorResponse(error);
    }
}
