import { z } from 'zod';

declare const brand: unique symbol;

export type Brand<Value, Name extends string> = Value & {
    readonly [brand]: Name;
};

export type ListId = Brand<string, 'ListId'>;
export type ItemId = Brand<string, 'ItemId'>;
export type AttachmentId = Brand<string, 'AttachmentId'>;
export type IdentityId = Brand<string, 'IdentityId'>;

const uuid = z.uuid();

export const listIdSchema = uuid.transform(value => value as ListId);
export const itemIdSchema = uuid.transform(value => value as ItemId);
export const attachmentIdSchema = uuid.transform(
    value => value as AttachmentId
);
export const identityIdSchema = uuid.transform(value => value as IdentityId);

export const createListId = (): ListId => crypto.randomUUID() as ListId;
export const createItemId = (): ItemId => crypto.randomUUID() as ItemId;
export const createAttachmentId = (): AttachmentId =>
    crypto.randomUUID() as AttachmentId;
