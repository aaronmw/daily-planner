import type { AttachmentId, IdentityId, ListId, ItemId } from './ids';
import type { PlannerCommandId } from '../application/commandIds';

export const ACCENT_KEYS = [
    'red',
    'orange',
    'amber',
    'yellow',
    'lime',
    'green',
    'emerald',
    'teal',
    'cyan',
    'sky',
] as const;

export type AccentKey = (typeof ACCENT_KEYS)[number];
export type ThemeMode = 'system' | 'light' | 'dark';
export type PlannerColumn = 'timeline' | 'lists' | 'items' | 'details';
export type ColumnVisibility = Record<PlannerColumn, boolean>;

export interface CollaborationMetadata {
    keyVersion: number;
    revision: number;
}

export interface PlannerList extends CollaborationMetadata {
    accentKey: AccentKey;
    createdAt: string;
    id: ListId;
    isArchived: boolean;
    isPrivateCopy: boolean;
    label: string;
    ownerIdentityId: IdentityId | null;
    updatedAt: string;
}

interface AttachmentBase {
    byteSize: number;
    clientId: string;
    filename: string;
    mimeType: string;
}

export interface UploadingAttachment extends AttachmentBase {
    placeholderToken: string;
    progress: number;
    status: 'uploading';
}

export interface FailedAttachment extends AttachmentBase {
    error: string;
    placeholderToken: string;
    status: 'failed';
}

export interface ReadyAttachment extends AttachmentBase {
    attachmentKey: string;
    createdAt: string;
    id: AttachmentId;
    markdown: string;
    status: 'ready';
    url: string;
}

export type ItemAttachment =
    UploadingAttachment | FailedAttachment | ReadyAttachment;

export interface PlannerItem extends CollaborationMetadata {
    attachments: ItemAttachment[];
    createdAt: string;
    creatorIdentityId: IdentityId | null;
    durationMinutes: number;
    icon: string;
    id: ItemId;
    isArchived: boolean;
    isComplete: boolean;
    isPrivateCopy: boolean;
    label: string;
    listId: ListId;
    notes: string;
    orderKey: string;
    scheduledStartMinutes: number | null;
    updatedAt: string;
}

export interface PlannerSnapshot {
    lists: PlannerList[];
    items: PlannerItem[];
}

export type LabelEditSession =
    | { status: 'idle' }
    | {
          entityId: ListId | ItemId;
          entityType: 'list' | 'item';
          requestId: string;
          status: 'requested' | 'editing';
      };

export type SyncStatus =
    | { status: 'local-only' }
    | { status: 'connecting' | 'syncing' }
    | { status: 'synced'; syncedAt: string }
    | { error: string; status: 'error' };

export interface PlannerPreferences {
    columnVisibility: ColumnVisibility;
    desktopShortcuts: Record<PlannerCommandId, string>;
    focusAssistEnabled: boolean;
    highlightIncompleteSentencesEnabled: boolean;
    notificationsEnabled: boolean;
    relativeCardSizingEnabled: boolean;
    syncEnabled: boolean;
    themeMode: ThemeMode;
    timelineHoursPerScreen: number;
}
