import { z } from 'zod';
import {
    attachmentIdSchema,
    identityIdSchema,
    listIdSchema,
    itemIdSchema,
} from './ids';
import { ACCENT_KEYS } from './types';

const isoDate = z.iso.datetime();

const attachmentBaseSchema = z.object({
    byteSize: z.int().nonnegative(),
    clientId: z.string().min(1),
    filename: z.string(),
    mimeType: z.string().min(1),
});

export const itemAttachmentSchema = z.discriminatedUnion('status', [
    attachmentBaseSchema.extend({
        placeholderToken: z.string().min(1),
        progress: z.number().min(0).max(1),
        status: z.literal('uploading'),
    }),
    attachmentBaseSchema.extend({
        error: z.string().min(1),
        placeholderToken: z.string().min(1),
        status: z.literal('failed'),
    }),
    attachmentBaseSchema.extend({
        attachmentKey: z.string().min(1),
        createdAt: isoDate,
        id: attachmentIdSchema,
        markdown: z.string(),
        status: z.literal('ready'),
        url: z.string().min(1),
    }),
]);

const collaborationMetadataSchema = z.object({
    keyVersion: z.int().positive(),
    revision: z.int().nonnegative(),
});

export const plannerListSchema = collaborationMetadataSchema.extend({
    accentKey: z.enum(ACCENT_KEYS),
    createdAt: isoDate,
    id: listIdSchema,
    isArchived: z.boolean(),
    isPrivateCopy: z.boolean().default(false),
    label: z.string(),
    ownerIdentityId: identityIdSchema.nullable(),
    updatedAt: isoDate,
});

export const plannerItemSchema = collaborationMetadataSchema.extend({
    attachments: z.array(itemAttachmentSchema),
    createdAt: isoDate,
    creatorIdentityId: identityIdSchema.nullable(),
    durationMinutes: z.int().positive(),
    icon: z.string(),
    id: itemIdSchema,
    isArchived: z.boolean(),
    isComplete: z.boolean(),
    isPrivateCopy: z.boolean().default(false),
    label: z.string(),
    listId: listIdSchema,
    notes: z.string(),
    orderKey: z.string().min(1),
    scheduledStartMinutes: z.int().min(0).max(1439).nullable(),
    updatedAt: isoDate,
});

export const plannerPreferencesSchema = z.object({
    columnVisibility: z.object({
        details: z.boolean(),
        lists: z.boolean(),
        items: z.boolean(),
        timeline: z.boolean(),
    }),
    desktopShortcuts: z.object({
        'create-list': z.string().min(1),
        'create-item': z.string().min(1),
        'show-planner': z.string().min(1),
    }),
    focusAssistEnabled: z.boolean(),
    highlightIncompleteSentencesEnabled: z.boolean(),
    notificationsEnabled: z.boolean(),
    relativeCardSizingEnabled: z.boolean(),
    syncEnabled: z.boolean(),
    themeMode: z.enum(['system', 'light', 'dark']),
    timelineHoursPerScreen: z.number().min(4).max(24),
});
