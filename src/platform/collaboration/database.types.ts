export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[];

export type Database = {
    // Allows to automatically instantiate createClient with right options
    // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
    __InternalSupabase: {
        PostgrestVersion: '14.15';
    };
    graphql_public: {
        Tables: {
            [_ in never]: never;
        };
        Views: {
            [_ in never]: never;
        };
        Functions: {
            graphql: {
                Args: {
                    extensions?: Json;
                    operationName?: string;
                    query?: string;
                    variables?: Json;
                };
                Returns: Json;
            };
        };
        Enums: {
            [_ in never]: never;
        };
        CompositeTypes: {
            [_ in never]: never;
        };
    };
    public: {
        Tables: {
            collaboration_identities: {
                Row: {
                    created_at: string;
                    is_anonymous: boolean;
                    public_key: string;
                    updated_at: string;
                    user_id: string;
                };
                Insert: {
                    created_at?: string;
                    is_anonymous: boolean;
                    public_key: string;
                    updated_at?: string;
                    user_id: string;
                };
                Update: {
                    created_at?: string;
                    is_anonymous?: boolean;
                    public_key?: string;
                    updated_at?: string;
                    user_id?: string;
                };
                Relationships: [];
            };
            comment_mentions: {
                Row: {
                    comment_id: string;
                    created_at: string;
                    mentioned_user_id: string;
                };
                Insert: {
                    comment_id: string;
                    created_at?: string;
                    mentioned_user_id: string;
                };
                Update: {
                    comment_id?: string;
                    created_at?: string;
                    mentioned_user_id?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'comment_mentions_comment_id_fkey';
                        columns: ['comment_id'];
                        isOneToOne: false;
                        referencedRelation: 'encrypted_comments';
                        referencedColumns: ['id'];
                    },
                ];
            };
            encrypted_attachment_metadata: {
                Row: {
                    chunk_count: number;
                    created_at: string;
                    deleted_at: string | null;
                    encrypted_byte_size: number;
                    id: string;
                    item_id: string;
                    key_version: number;
                    list_id: string;
                    revision: number;
                    updated_at: string;
                    uploader_id: string;
                };
                Insert: {
                    chunk_count: number;
                    created_at?: string;
                    deleted_at?: string | null;
                    encrypted_byte_size: number;
                    id: string;
                    item_id: string;
                    key_version: number;
                    list_id: string;
                    revision?: number;
                    updated_at?: string;
                    uploader_id: string;
                };
                Update: {
                    chunk_count?: number;
                    created_at?: string;
                    deleted_at?: string | null;
                    encrypted_byte_size?: number;
                    id?: string;
                    item_id?: string;
                    key_version?: number;
                    list_id?: string;
                    revision?: number;
                    updated_at?: string;
                    uploader_id?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'encrypted_attachment_metadata_list_id_item_id_fkey';
                        columns: ['list_id', 'item_id'];
                        isOneToOne: false;
                        referencedRelation: 'encrypted_items';
                        referencedColumns: ['list_id', 'id'];
                    },
                ];
            };
            encrypted_comments: {
                Row: {
                    author_id: string;
                    ciphertext: string;
                    content_revision: number;
                    created_at: string;
                    deleted_at: string | null;
                    id: string;
                    item_id: string;
                    iv: string;
                    key_version: number;
                    list_id: string;
                    parent_comment_id: string | null;
                    revision: number;
                    updated_at: string;
                };
                Insert: {
                    author_id: string;
                    ciphertext: string;
                    content_revision?: number;
                    created_at?: string;
                    deleted_at?: string | null;
                    id: string;
                    item_id: string;
                    iv: string;
                    key_version: number;
                    list_id: string;
                    parent_comment_id?: string | null;
                    revision?: number;
                    updated_at?: string;
                };
                Update: {
                    author_id?: string;
                    ciphertext?: string;
                    content_revision?: number;
                    created_at?: string;
                    deleted_at?: string | null;
                    id?: string;
                    item_id?: string;
                    iv?: string;
                    key_version?: number;
                    list_id?: string;
                    parent_comment_id?: string | null;
                    revision?: number;
                    updated_at?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'encrypted_comments_list_id_item_id_fkey';
                        columns: ['list_id', 'item_id'];
                        isOneToOne: false;
                        referencedRelation: 'encrypted_items';
                        referencedColumns: ['list_id', 'id'];
                    },
                    {
                        foreignKeyName: 'encrypted_comments_list_id_item_id_parent_comment_id_fkey';
                        columns: ['list_id', 'item_id', 'parent_comment_id'];
                        isOneToOne: false;
                        referencedRelation: 'encrypted_comments';
                        referencedColumns: ['list_id', 'item_id', 'id'];
                    },
                ];
            };
            encrypted_items: {
                Row: {
                    ciphertext: string;
                    content_revision: number;
                    created_at: string;
                    creator_id: string;
                    deleted_at: string | null;
                    id: string;
                    iv: string;
                    key_version: number;
                    list_id: string;
                    revision: number;
                    updated_at: string;
                };
                Insert: {
                    ciphertext: string;
                    content_revision?: number;
                    created_at?: string;
                    creator_id: string;
                    deleted_at?: string | null;
                    id: string;
                    iv: string;
                    key_version: number;
                    list_id: string;
                    revision?: number;
                    updated_at?: string;
                };
                Update: {
                    ciphertext?: string;
                    content_revision?: number;
                    created_at?: string;
                    creator_id?: string;
                    deleted_at?: string | null;
                    id?: string;
                    iv?: string;
                    key_version?: number;
                    list_id?: string;
                    revision?: number;
                    updated_at?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'encrypted_items_list_id_fkey';
                        columns: ['list_id'];
                        isOneToOne: false;
                        referencedRelation: 'encrypted_lists';
                        referencedColumns: ['id'];
                    },
                ];
            };
            encrypted_lists: {
                Row: {
                    ciphertext: string;
                    content_revision: number;
                    created_at: string;
                    current_key_version: number;
                    deleted_at: string | null;
                    id: string;
                    iv: string;
                    key_version: number;
                    owner_id: string;
                    revision: number;
                    updated_at: string;
                };
                Insert: {
                    ciphertext: string;
                    content_revision?: number;
                    created_at?: string;
                    current_key_version?: number;
                    deleted_at?: string | null;
                    id: string;
                    iv: string;
                    key_version?: number;
                    owner_id: string;
                    revision?: number;
                    updated_at?: string;
                };
                Update: {
                    ciphertext?: string;
                    content_revision?: number;
                    created_at?: string;
                    current_key_version?: number;
                    deleted_at?: string | null;
                    id?: string;
                    iv?: string;
                    key_version?: number;
                    owner_id?: string;
                    revision?: number;
                    updated_at?: string;
                };
                Relationships: [];
            };
            encrypted_member_profiles: {
                Row: {
                    ciphertext: string;
                    content_revision: number;
                    created_at: string;
                    iv: string;
                    key_version: number;
                    list_id: string;
                    revision: number;
                    updated_at: string;
                    user_id: string;
                };
                Insert: {
                    ciphertext: string;
                    content_revision?: number;
                    created_at?: string;
                    iv: string;
                    key_version: number;
                    list_id: string;
                    revision?: number;
                    updated_at?: string;
                    user_id: string;
                };
                Update: {
                    ciphertext?: string;
                    content_revision?: number;
                    created_at?: string;
                    iv?: string;
                    key_version?: number;
                    list_id?: string;
                    revision?: number;
                    updated_at?: string;
                    user_id?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'encrypted_member_profiles_list_id_user_id_fkey';
                        columns: ['list_id', 'user_id'];
                        isOneToOne: true;
                        referencedRelation: 'list_memberships';
                        referencedColumns: ['list_id', 'user_id'];
                    },
                ];
            };
            identity_handoffs: {
                Row: {
                    created_at: string;
                    expires_at: string;
                    id: string;
                    secret_hash: string;
                    source_user_id: string;
                    used_at: string | null;
                    used_by: string | null;
                };
                Insert: {
                    created_at?: string;
                    expires_at: string;
                    id: string;
                    secret_hash: string;
                    source_user_id: string;
                    used_at?: string | null;
                    used_by?: string | null;
                };
                Update: {
                    created_at?: string;
                    expires_at?: string;
                    id?: string;
                    secret_hash?: string;
                    source_user_id?: string;
                    used_at?: string | null;
                    used_by?: string | null;
                };
                Relationships: [];
            };
            identity_keyrings: {
                Row: {
                    account_key_iv: string | null;
                    created_at: string;
                    encrypted_account_key: string | null;
                    encrypted_private_key: string;
                    private_key_iv: string;
                    recovery_iv: string | null;
                    recovery_salt: string | null;
                    revision: number;
                    updated_at: string;
                    user_id: string;
                };
                Insert: {
                    account_key_iv?: string | null;
                    created_at?: string;
                    encrypted_account_key?: string | null;
                    encrypted_private_key: string;
                    private_key_iv: string;
                    recovery_iv?: string | null;
                    recovery_salt?: string | null;
                    revision?: number;
                    updated_at?: string;
                    user_id: string;
                };
                Update: {
                    account_key_iv?: string | null;
                    created_at?: string;
                    encrypted_account_key?: string | null;
                    encrypted_private_key?: string;
                    private_key_iv?: string;
                    recovery_iv?: string | null;
                    recovery_salt?: string | null;
                    revision?: number;
                    updated_at?: string;
                    user_id?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'identity_keyrings_user_id_fkey';
                        columns: ['user_id'];
                        isOneToOne: true;
                        referencedRelation: 'collaboration_identities';
                        referencedColumns: ['user_id'];
                    },
                ];
            };
            list_invitations: {
                Row: {
                    created_at: string;
                    created_by: string;
                    expires_at: string;
                    id: string;
                    list_id: string;
                    revoked_at: string | null;
                    revoked_by: string | null;
                    role: Database['public']['Enums']['planner_role'];
                    secret_hash: string;
                    used_at: string | null;
                    used_by: string | null;
                };
                Insert: {
                    created_at?: string;
                    created_by: string;
                    expires_at: string;
                    id: string;
                    list_id: string;
                    revoked_at?: string | null;
                    revoked_by?: string | null;
                    role: Database['public']['Enums']['planner_role'];
                    secret_hash: string;
                    used_at?: string | null;
                    used_by?: string | null;
                };
                Update: {
                    created_at?: string;
                    created_by?: string;
                    expires_at?: string;
                    id?: string;
                    list_id?: string;
                    revoked_at?: string | null;
                    revoked_by?: string | null;
                    role?: Database['public']['Enums']['planner_role'];
                    secret_hash?: string;
                    used_at?: string | null;
                    used_by?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: 'list_invitations_list_id_fkey';
                        columns: ['list_id'];
                        isOneToOne: false;
                        referencedRelation: 'encrypted_lists';
                        referencedColumns: ['id'];
                    },
                ];
            };
            list_key_envelopes: {
                Row: {
                    created_at: string;
                    created_by: string;
                    key_version: number;
                    list_id: string;
                    user_id: string;
                    wrapped_key: string;
                    wrapped_key_iv: string;
                };
                Insert: {
                    created_at?: string;
                    created_by: string;
                    key_version: number;
                    list_id: string;
                    user_id: string;
                    wrapped_key: string;
                    wrapped_key_iv: string;
                };
                Update: {
                    created_at?: string;
                    created_by?: string;
                    key_version?: number;
                    list_id?: string;
                    user_id?: string;
                    wrapped_key?: string;
                    wrapped_key_iv?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'list_key_envelopes_list_id_fkey';
                        columns: ['list_id'];
                        isOneToOne: false;
                        referencedRelation: 'encrypted_lists';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'list_key_envelopes_list_id_user_id_fkey';
                        columns: ['list_id', 'user_id'];
                        isOneToOne: false;
                        referencedRelation: 'list_memberships';
                        referencedColumns: ['list_id', 'user_id'];
                    },
                ];
            };
            list_memberships: {
                Row: {
                    joined_at: string;
                    list_id: string;
                    removed_at: string | null;
                    removed_by: string | null;
                    revision: number;
                    role: Database['public']['Enums']['planner_role'];
                    state: Database['public']['Enums']['membership_state'];
                    updated_at: string;
                    user_id: string;
                };
                Insert: {
                    joined_at?: string;
                    list_id: string;
                    removed_at?: string | null;
                    removed_by?: string | null;
                    revision?: number;
                    role: Database['public']['Enums']['planner_role'];
                    state?: Database['public']['Enums']['membership_state'];
                    updated_at?: string;
                    user_id: string;
                };
                Update: {
                    joined_at?: string;
                    list_id?: string;
                    removed_at?: string | null;
                    removed_by?: string | null;
                    revision?: number;
                    role?: Database['public']['Enums']['planner_role'];
                    state?: Database['public']['Enums']['membership_state'];
                    updated_at?: string;
                    user_id?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'list_memberships_list_id_fkey';
                        columns: ['list_id'];
                        isOneToOne: false;
                        referencedRelation: 'encrypted_lists';
                        referencedColumns: ['id'];
                    },
                ];
            };
            notification_jobs: {
                Row: {
                    attempts: number;
                    comment_id: string;
                    created_at: string;
                    delivered_at: string | null;
                    id: string;
                    item_id: string;
                    kind: Database['public']['Enums']['planner_notification_kind'];
                    last_error: string | null;
                    list_id: string;
                    locked_at: string | null;
                    next_attempt_at: string;
                    recipient_id: string;
                    state: Database['public']['Enums']['planner_notification_state'];
                    updated_at: string;
                };
                Insert: {
                    attempts?: number;
                    comment_id: string;
                    created_at?: string;
                    delivered_at?: string | null;
                    id?: string;
                    item_id: string;
                    kind: Database['public']['Enums']['planner_notification_kind'];
                    last_error?: string | null;
                    list_id: string;
                    locked_at?: string | null;
                    next_attempt_at?: string;
                    recipient_id: string;
                    state?: Database['public']['Enums']['planner_notification_state'];
                    updated_at?: string;
                };
                Update: {
                    attempts?: number;
                    comment_id?: string;
                    created_at?: string;
                    delivered_at?: string | null;
                    id?: string;
                    item_id?: string;
                    kind?: Database['public']['Enums']['planner_notification_kind'];
                    last_error?: string | null;
                    list_id?: string;
                    locked_at?: string | null;
                    next_attempt_at?: string;
                    recipient_id?: string;
                    state?: Database['public']['Enums']['planner_notification_state'];
                    updated_at?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'notification_jobs_comment_id_fkey';
                        columns: ['comment_id'];
                        isOneToOne: false;
                        referencedRelation: 'encrypted_comments';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'notification_jobs_list_id_fkey';
                        columns: ['list_id'];
                        isOneToOne: false;
                        referencedRelation: 'encrypted_lists';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'notification_jobs_list_id_item_id_fkey';
                        columns: ['list_id', 'item_id'];
                        isOneToOne: false;
                        referencedRelation: 'encrypted_items';
                        referencedColumns: ['list_id', 'id'];
                    },
                ];
            };
            push_subscriptions: {
                Row: {
                    auth: string;
                    created_at: string;
                    endpoint: string;
                    expiration_time: string | null;
                    id: string;
                    p256dh: string;
                    platform: Database['public']['Enums']['planner_push_platform'];
                    updated_at: string;
                    user_id: string;
                };
                Insert: {
                    auth: string;
                    created_at?: string;
                    endpoint: string;
                    expiration_time?: string | null;
                    id: string;
                    p256dh: string;
                    platform: Database['public']['Enums']['planner_push_platform'];
                    updated_at?: string;
                    user_id: string;
                };
                Update: {
                    auth?: string;
                    created_at?: string;
                    endpoint?: string;
                    expiration_time?: string | null;
                    id?: string;
                    p256dh?: string;
                    platform?: Database['public']['Enums']['planner_push_platform'];
                    updated_at?: string;
                    user_id?: string;
                };
                Relationships: [];
            };
            thread_reads: {
                Row: {
                    item_id: string;
                    last_read_at: string;
                    list_id: string;
                    user_id: string;
                };
                Insert: {
                    item_id: string;
                    last_read_at?: string;
                    list_id: string;
                    user_id: string;
                };
                Update: {
                    item_id?: string;
                    last_read_at?: string;
                    list_id?: string;
                    user_id?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'thread_reads_list_id_item_id_fkey';
                        columns: ['list_id', 'item_id'];
                        isOneToOne: false;
                        referencedRelation: 'encrypted_items';
                        referencedColumns: ['list_id', 'id'];
                    },
                ];
            };
        };
        Views: {
            [_ in never]: never;
        };
        Functions: {
            claim_identity_handoff: {
                Args: {
                    p_handoff_id: string;
                    p_reencrypted_profiles: Json;
                    p_rewrapped_keys: Json;
                    p_secret: string;
                };
                Returns: string;
            };
            create_encrypted_attachment: {
                Args: {
                    p_attachment_id: string;
                    p_chunk_count: number;
                    p_encrypted_byte_size: number;
                    p_item_id: string;
                    p_key_version: number;
                    p_list_id: string;
                };
                Returns: string;
            };
            create_encrypted_comment: {
                Args: {
                    p_ciphertext: string;
                    p_comment_id: string;
                    p_item_id: string;
                    p_iv: string;
                    p_key_version: number;
                    p_list_id: string;
                    p_mentioned_user_ids?: string[];
                    p_parent_comment_id: string | null;
                };
                Returns: string;
            };
            create_encrypted_item: {
                Args: {
                    p_ciphertext: string;
                    p_item_id: string;
                    p_iv: string;
                    p_key_version: number;
                    p_list_id: string;
                };
                Returns: string;
            };
            create_encrypted_list: {
                Args: {
                    p_ciphertext: string;
                    p_iv: string;
                    p_list_id: string;
                    p_wrapped_key: string;
                    p_wrapped_key_iv: string;
                };
                Returns: string;
            };
            create_identity_handoff: {
                Args: {
                    p_expires_at: string;
                    p_handoff_id: string;
                    p_secret_hash: string;
                };
                Returns: string;
            };
            create_list_invitation: {
                Args: {
                    p_expires_at: string;
                    p_invitation_id: string;
                    p_list_id: string;
                    p_role: Database['public']['Enums']['planner_role'];
                    p_secret_hash: string;
                };
                Returns: {
                    expires_at: string;
                    invitation_id: string;
                    invitation_role: Database['public']['Enums']['planner_role'];
                }[];
            };
            delete_encrypted_attachment: {
                Args: {
                    p_attachment_id: string;
                    p_expected_revision: number;
                    p_list_id: string;
                };
                Returns: number;
            };
            delete_encrypted_comment: {
                Args: {
                    p_comment_id: string;
                    p_expected_revision: number;
                    p_list_id: string;
                };
                Returns: number;
            };
            delete_push_subscription: {
                Args: { p_subscription_id: string };
                Returns: undefined;
            };
            leave_list: {
                Args: {
                    p_envelopes: Json;
                    p_expected_list_revision: number;
                    p_expected_member_revision: number;
                    p_list_id: string;
                    p_new_key_version: number;
                };
                Returns: undefined;
            };
            mark_comment_thread_read: {
                Args: {
                    p_item_id: string;
                    p_list_id: string;
                    p_read_at?: string;
                };
                Returns: string;
            };
            move_encrypted_item: {
                Args: {
                    p_attachment_ids: string[];
                    p_ciphertext: string;
                    p_comments: Json;
                    p_destination_list_id: string;
                    p_expected_revision: number;
                    p_item_id: string;
                    p_iv: string;
                    p_key_version: number;
                    p_source_list_id: string;
                };
                Returns: number;
            };
            redeem_list_invitation: {
                Args: {
                    p_invitation_id: string;
                    p_key_envelopes: Json;
                    p_secret: string;
                };
                Returns: {
                    key_version: number;
                    list_id: string;
                    member_role: Database['public']['Enums']['planner_role'];
                }[];
            };
            register_collaboration_identity: {
                Args: {
                    p_account_key_iv?: string;
                    p_encrypted_account_key?: string;
                    p_encrypted_private_key: string;
                    p_private_key_iv: string;
                    p_public_key: string;
                    p_recovery_iv?: string;
                    p_recovery_salt?: string;
                };
                Returns: string;
            };
            remove_list_member: {
                Args: {
                    p_envelopes: Json;
                    p_expected_list_revision: number;
                    p_expected_member_revision: number;
                    p_list_id: string;
                    p_new_key_version: number;
                    p_user_id: string;
                };
                Returns: number;
            };
            revoke_list_invitation: {
                Args: { p_invitation_id: string; p_list_id: string };
                Returns: undefined;
            };
            rotate_list_key: {
                Args: {
                    p_envelopes: Json;
                    p_expected_list_revision: number;
                    p_list_id: string;
                    p_new_key_version: number;
                };
                Returns: number;
            };
            set_encrypted_item_deleted: {
                Args: {
                    p_deleted: boolean;
                    p_expected_revision: number;
                    p_item_id: string;
                    p_list_id: string;
                };
                Returns: number;
            };
            set_encrypted_list_deleted: {
                Args: {
                    p_deleted: boolean;
                    p_expected_revision: number;
                    p_list_id: string;
                };
                Returns: number;
            };
            set_list_member_role: {
                Args: {
                    p_expected_revision: number;
                    p_list_id: string;
                    p_role: Database['public']['Enums']['planner_role'];
                    p_user_id: string;
                };
                Returns: number;
            };
            transfer_list_ownership: {
                Args: {
                    p_envelopes?: Json;
                    p_expected_list_revision: number;
                    p_expected_new_owner_revision: number;
                    p_former_owner_role:
                        Database['public']['Enums']['planner_role'] | null;
                    p_list_id: string;
                    p_new_key_version?: number;
                    p_new_owner_id: string;
                };
                Returns: number;
            };
            update_collaboration_keyring: {
                Args: {
                    p_account_key_iv: string;
                    p_encrypted_account_key: string;
                    p_encrypted_private_key: string;
                    p_expected_revision: number;
                    p_private_key_iv: string;
                    p_public_key: string;
                    p_recovery_iv: string;
                    p_recovery_salt: string;
                };
                Returns: number;
            };
            update_encrypted_comment: {
                Args: {
                    p_ciphertext: string;
                    p_comment_id: string;
                    p_expected_revision: number;
                    p_iv: string;
                    p_key_version: number;
                    p_list_id: string;
                };
                Returns: number;
            };
            update_encrypted_item: {
                Args: {
                    p_ciphertext: string;
                    p_expected_revision: number;
                    p_item_id: string;
                    p_iv: string;
                    p_key_version: number;
                    p_list_id: string;
                };
                Returns: number;
            };
            update_encrypted_list: {
                Args: {
                    p_ciphertext: string;
                    p_expected_revision: number;
                    p_iv: string;
                    p_key_version: number;
                    p_list_id: string;
                };
                Returns: number;
            };
            upsert_encrypted_member_profile: {
                Args: {
                    p_ciphertext: string;
                    p_expected_revision: number;
                    p_iv: string;
                    p_key_version: number;
                    p_list_id: string;
                };
                Returns: number;
            };
            upsert_push_subscription: {
                Args: {
                    p_auth: string;
                    p_endpoint: string;
                    p_expiration_time?: string;
                    p_p256dh: string;
                    p_platform: Database['public']['Enums']['planner_push_platform'];
                    p_subscription_id: string;
                };
                Returns: string;
            };
        };
        Enums: {
            membership_state: 'active' | 'removed';
            planner_notification_kind: 'mention' | 'reply';
            planner_notification_state:
                'pending' | 'processing' | 'retry' | 'delivered' | 'failed';
            planner_push_platform: 'web' | 'desktop';
            planner_role: 'read' | 'comment' | 'write' | 'full' | 'owner';
        };
        CompositeTypes: {
            [_ in never]: never;
        };
    };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<
    keyof Database,
    'public'
>];

export type Tables<
    DefaultSchemaTableNameOrOptions extends
        | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
        | { schema: keyof DatabaseWithoutInternals },
    TableName extends (DefaultSchemaTableNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals;
    }
        ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
              DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
        : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
}
    ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
          DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
          Row: infer R;
      }
        ? R
        : never
    : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] &
            DefaultSchema['Views'])
      ? (DefaultSchema['Tables'] &
            DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
            Row: infer R;
        }
          ? R
          : never
      : never;

export type TablesInsert<
    DefaultSchemaTableNameOrOptions extends
        | keyof DefaultSchema['Tables']
        | { schema: keyof DatabaseWithoutInternals },
    TableName extends (DefaultSchemaTableNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals;
    }
        ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
        : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
}
    ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
          Insert: infer I;
      }
        ? I
        : never
    : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
      ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
            Insert: infer I;
        }
          ? I
          : never
      : never;

export type TablesUpdate<
    DefaultSchemaTableNameOrOptions extends
        | keyof DefaultSchema['Tables']
        | { schema: keyof DatabaseWithoutInternals },
    TableName extends (DefaultSchemaTableNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals;
    }
        ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
        : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
}
    ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
          Update: infer U;
      }
        ? U
        : never
    : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
      ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
            Update: infer U;
        }
          ? U
          : never
      : never;

export type Enums<
    DefaultSchemaEnumNameOrOptions extends
        | keyof DefaultSchema['Enums']
        | { schema: keyof DatabaseWithoutInternals },
    EnumName extends (DefaultSchemaEnumNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals;
    }
        ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
        : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
}
    ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
    : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
      ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
      : never;

export type CompositeTypes<
    PublicCompositeTypeNameOrOptions extends
        | keyof DefaultSchema['CompositeTypes']
        | { schema: keyof DatabaseWithoutInternals },
    CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals;
    }
        ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
        : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
}
    ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
    : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
      ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
      : never;

export const Constants = {
    graphql_public: {
        Enums: {},
    },
    public: {
        Enums: {
            membership_state: ['active', 'removed'],
            planner_notification_kind: ['mention', 'reply'],
            planner_notification_state: [
                'pending',
                'processing',
                'retry',
                'delivered',
                'failed',
            ],
            planner_push_platform: ['web', 'desktop'],
            planner_role: ['read', 'comment', 'write', 'full', 'owner'],
        },
    },
} as const;
