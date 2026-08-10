import sample from 'lodash/sample';
import sortBy from 'lodash/sortBy';
import {
    useCallback,
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import { canWrite, ROLES } from '../collaboration/roles';
import {
    ACCENT_SWATCHES,
    buildThemeStyle,
    COPY,
    DEFAULT_ACCENT_KEY,
    DEFAULT_FOCUS_ASSIST_ENABLED,
    DEFAULT_HIGHLIGHT_INCOMPLETE_SENTENCES_ENABLED,
    DEFAULT_RELATIVE_CARD_SIZING_ENABLED,
    DEFAULT_THEME_MODE,
    HOURS_PER_SCREEN,
    ICONS,
    getNextThemeMode,
    INITIAL_LISTS,
    INITIAL_SELECTED_LIST_ID,
    INITIAL_SELECTED_TASK_ID,
    INITIAL_TASKS,
    INTERACTION_ANIMATION_DURATION,
    ROUTE_TRANSITION_ANIMATION_DURATION,
    THEME_MODES,
    TIMELINE_HOURS_PER_SCREEN_MAX,
    TIMELINE_HOURS_PER_SCREEN_MIN,
    TIMELINE_HOURS_PER_SCREEN_STEP,
} from '../components/atoms/tokens';
import { getMinuteHeightCss } from '../utils/plannerGeometry';
import { buildPlannerIndexes } from '../utils/plannerIndexes';
import {
    createAttachmentClientId,
    createPendingAttachment,
    insertAttachmentPlaceholders,
} from '../utils/attachments';
import {
    deleteStoredAttachment,
    loadLocalAttachment,
} from '../platform/attachments';
import {
    deleteCollaborationAttachment,
    downloadCollaborationAttachment,
} from '../platform/collaborationAttachments';
import { loadCollaborationListKey } from '../platform/collaborationIdentityStore';
import { changeDesktopShortcuts } from '../platform/desktopIntegration';
import {
    assertUniqueDesktopShortcuts,
    DEFAULT_DESKTOP_CREATION_SHORTCUTS,
    DEFAULT_DESKTOP_GLOBAL_SHORTCUT,
    DEFAULT_DESKTOP_SHORTCUTS,
    normalizeDesktopShortcut,
    normalizeDesktopShortcuts,
} from '../platform/desktopShortcut';
import { isDesktopRuntime } from '../platform/runtime';
import { PLANNER_COMMANDS } from '../utils/plannerCommands';
import {
    beginTaskAttachmentUploads,
    normalizeTasksForHydration,
    rejectTaskAttachmentUpload,
    removeReadyTaskAttachment,
    resolveTaskAttachmentUpload,
} from '../utils/taskAttachments';
import useAttachmentUploads from './useAttachmentUploads';
import useEncryptedPlannerData from './useEncryptedPlannerData';
import useKeyboardShortcut from './useKeyboardShortcut';
import usePersistentState from './usePersistentState';
import usePlannerCollaboration from './usePlannerCollaboration';
import useSystemThemeName from './useSystemThemeName';

const keyboardShortcutNamespace = 'global';
const LABEL_EDIT_ENTITY_TYPES = Object.freeze({
    LIST: 'list',
    TASK: 'task',
});
const LABEL_EDIT_AFTER_COMMIT = Object.freeze({
    OPEN_TASK_VIEW: 'open-task-view',
});
const PLANNER_COLUMNS = Object.freeze({
    LISTS: 'lists',
    TASK_DETAILS: 'taskDetails',
    TASKS: 'tasks',
    TIMELINE: 'timeline',
});
const waitForInteractionMotion = () =>
    new Promise(resolve => setTimeout(resolve, INTERACTION_ANIMATION_DURATION));

const withPreventDefault = func => e => {
    e.preventDefault();
    func(e);
};

const getRelativeIndexOffset = (relativeIndex, itemCount) =>
    relativeIndex >= 0
        ? relativeIndex
        : Math.abs(relativeIndex) * (itemCount - 1);

const normalizeThemeMode = themeMode =>
    THEME_MODES.includes(themeMode) ? themeMode : DEFAULT_THEME_MODE;

const createFallbackList = lists => {
    return {
        accent_key: DEFAULT_ACCENT_KEY,
        id: crypto.randomUUID(),
        isArchived: false,
        label: '',
    };
};

const normalizeListsForHydration = savedLists => {
    const normalizedLists = Array.isArray(savedLists) ? savedLists : [];

    return normalizedLists.some(list => !list.isArchived)
        ? normalizedLists
        : normalizedLists.concat(createFallbackList(normalizedLists));
};

const normalizeTimelineHoursPerScreen = hoursPerScreen => {
    const numericHoursPerScreen = Number(hoursPerScreen);

    if (!Number.isFinite(numericHoursPerScreen)) {
        return HOURS_PER_SCREEN;
    }

    const steppedHoursPerScreen =
        Math.round(numericHoursPerScreen / TIMELINE_HOURS_PER_SCREEN_STEP) *
        TIMELINE_HOURS_PER_SCREEN_STEP;

    return Math.min(
        TIMELINE_HOURS_PER_SCREEN_MAX,
        Math.max(TIMELINE_HOURS_PER_SCREEN_MIN, steppedHoursPerScreen)
    );
};

const buildColumnWidths = ({
    isListColumnOpen,
    isSidebarOpen,
    isTaskDetailsOpen,
    isTimelineOpen,
}) => {
    const columns = [
        ['timeline', isTimelineOpen, 3],
        ['primary', isListColumnOpen, 4],
        ['sidebar', isSidebarOpen, 3],
        ['taskDetails', isTaskDetailsOpen, 4],
    ];
    const collapsedCount = columns.filter(([, isOpen]) => !isOpen).length;
    const expandedWeight = columns.reduce(
        (total, [, isOpen, weight]) => total + (isOpen ? weight : 0),
        0
    );
    const widths = Object.fromEntries(
        columns.map(([name, isOpen, weight]) => {
            if (!isOpen || expandedWeight === 0) {
                return [name, 'var(--spacing-icon-slot)'];
            }

            const ratio = weight / expandedWeight;
            return [
                name,
                `calc(${ratio * 100}vw - (var(--spacing-icon-slot) * ${ratio * collapsedCount}))`,
            ];
        })
    );

    return {
        listManager: widths.primary,
        sidebar: widths.sidebar,
        taskDetails: widths.taskDetails,
        timeline: widths.timeline,
    };
};

export default function usePlannerApp() {
    const [isShowingSidebar, setIsShowingSidebar] = usePersistentState(
        'is-showing-sidebar',
        true
    );
    const [isTimelineOpen, setIsTimelineOpen] = usePersistentState(
        'is-timeline-open',
        true
    );
    const [isListColumnOpen, setIsListColumnOpen] = usePersistentState(
        'is-list-column-open',
        true
    );
    const [isTaskDetailsOpen, setIsTaskDetailsOpen] = usePersistentState(
        'is-task-details-open',
        true
    );
    const [selectedListId, setSelectedListId] = usePersistentState(
        'selected-list-id',
        INITIAL_SELECTED_LIST_ID
    );
    const [selectedTaskId, setSelectedTaskId] = usePersistentState(
        'selected-task-id',
        INITIAL_SELECTED_TASK_ID
    );
    const onMigrateSelection = useCallback(
        migratedSelection => {
            if (migratedSelection.selectedListId) {
                setSelectedListId(migratedSelection.selectedListId);
            }
            setSelectedTaskId(migratedSelection.selectedTaskId);
        },
        [setSelectedListId, setSelectedTaskId]
    );
    const {
        error: plannerVaultError,
        isLoaded: isPlannerVaultLoaded,
        lists,
        setLists,
        setTasks,
        tasks,
    } = useEncryptedPlannerData({
        defaultLists: INITIAL_LISTS,
        defaultTasks: INITIAL_TASKS,
        normalizeLists: normalizeListsForHydration,
        normalizeTasks: normalizeTasksForHydration,
        onMigrateSelection,
        selectedListId,
        selectedTaskId,
    });
    const [isShowingListManager, setIsShowingListManager] = usePersistentState(
        'is-showing-list-manager',
        true
    );
    const [themeMode, setThemeMode] = usePersistentState(
        'theme-mode',
        DEFAULT_THEME_MODE
    );
    const [desktopGlobalShortcut, setDesktopGlobalShortcut] =
        usePersistentState(
            'desktop-global-shortcut',
            DEFAULT_DESKTOP_GLOBAL_SHORTCUT,
            normalizeDesktopShortcut
        );
    const [desktopCreationShortcuts, setDesktopCreationShortcuts] =
        usePersistentState(
            'desktop-creation-shortcuts',
            DEFAULT_DESKTOP_CREATION_SHORTCUTS,
            savedShortcuts =>
                Object.fromEntries(
                    Object.entries(DEFAULT_DESKTOP_CREATION_SHORTCUTS).map(
                        ([commandId, defaultShortcut]) => [
                            commandId,
                            normalizeDesktopShortcut(
                                savedShortcuts?.[commandId],
                                defaultShortcut
                            ),
                        ]
                    )
                )
        );
    const [timelineHoursPerScreen, setTimelineHoursPerScreen] =
        usePersistentState('timeline-hours-per-screen', HOURS_PER_SCREEN);
    const [relativeCardSizingEnabled, setRelativeCardSizingEnabled] =
        usePersistentState(
            'relative-card-sizing-enabled',
            DEFAULT_RELATIVE_CARD_SIZING_ENABLED
        );
    const [focusAssistEnabled, setFocusAssistEnabled] = usePersistentState(
        'focus-assist-enabled',
        DEFAULT_FOCUS_ASSIST_ENABLED
    );
    const [
        highlightIncompleteSentencesEnabled,
        setHighlightIncompleteSentencesEnabled,
    ] = usePersistentState(
        'highlight-incomplete-sentences-enabled',
        DEFAULT_HIGHLIGHT_INCOMPLETE_SENTENCES_ENABLED
    );
    const [labelEditSession, setLabelEditSession] = useState(null);
    const [isCardSizingTransitioning, setIsCardSizingTransitioning] =
        useState(false);
    const [isDraggingTask, setIsDraggingTask] = useState(false);
    const [isOptionsMenuOpen, setIsOptionsMenuOpen] = useState(false);
    const [isShowingTrashContents, setIsShowingTrashContents] = useState(false);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [attachmentRemovalStateById, setAttachmentRemovalStateById] =
        useState({});
    const cardSizingTransitionTimerRef = useRef(null);
    const labelEditRequestIdRef = useRef(0);
    const labelEditSessionRef = useRef(null);
    const routeTransitionTimerRef = useRef(null);
    const isDesktop = isDesktopRuntime();
    const plannerCollaboration = usePlannerCollaboration({
        lists,
        selectedListId,
        selectedTaskId,
        setSelectedListId,
        setSelectedTaskId,
        setLists,
        setTasks,
        tasks,
    });
    const canMutateList = useCallback(
        listId =>
            !plannerCollaboration.data.isEnabled ||
            lists.some(list => list.id === listId && list.is_private_copy) ||
            canWrite(
                plannerCollaboration.data.roleByListId.get(listId) || ROLES.READ
            ),
        [
            plannerCollaboration.data.isEnabled,
            plannerCollaboration.data.roleByListId,
            lists,
        ]
    );

    const unarchivedLists = useMemo(
        () =>
            sortBy(
                lists.filter(list => !list.isArchived),
                [list => list.label]
            ),
        [lists]
    );
    const unarchivedListIndexById = useMemo(
        () => new Map(unarchivedLists.map((list, index) => [list.id, index])),
        [unarchivedLists]
    );

    const systemThemeName = useSystemThemeName();
    const normalizedThemeMode = normalizeThemeMode(themeMode);
    const themeName =
        normalizedThemeMode === 'SYSTEM'
            ? systemThemeName
            : normalizedThemeMode;

    const plannerIndexes = useMemo(
        () =>
            buildPlannerIndexes(lists, tasks, list =>
                buildThemeStyle(themeName, list)
            ),
        [lists, tasks, themeName]
    );
    const { listById } = plannerIndexes;
    const selectedListState = listById.get(selectedListId);
    const resolvedSelectedListId =
        selectedListState && !selectedListState.isArchived
            ? selectedListId
            : unarchivedLists[0]?.id;
    const selectedList = listById.get(resolvedSelectedListId);
    const selectedTaskState = plannerIndexes.taskById.get(selectedTaskId);
    const resolvedSelectedTaskId =
        selectedTaskState &&
        !selectedTaskState.isComplete &&
        selectedTaskState.list_id === resolvedSelectedListId
            ? selectedTaskId
            : (plannerIndexes.tasksByListId.get(resolvedSelectedListId)?.[0]
                  ?.id ?? null);
    const currentListIndex =
        unarchivedListIndexById.get(resolvedSelectedListId) ?? -1;
    const desktopShortcuts = useMemo(
        () =>
            normalizeDesktopShortcuts({
                ...desktopCreationShortcuts,
                [PLANNER_COMMANDS.SHOW_PLANNER]: desktopGlobalShortcut,
            }),
        [desktopCreationShortcuts, desktopGlobalShortcut]
    );
    const normalizedTimelineHoursPerScreen = normalizeTimelineHoursPerScreen(
        timelineHoursPerScreen
    );
    const effectiveRelativeCardSizingEnabled = relativeCardSizingEnabled;
    const appThemeStyle = useMemo(
        () => ({
            ...(plannerIndexes.themeByListId.get(resolvedSelectedListId) ||
                buildThemeStyle(themeName, selectedList)),
            '--planner-card-minute-height': getMinuteHeightCss(
                normalizedTimelineHoursPerScreen
            ),
            '--planner-timeline-minute-height': getMinuteHeightCss(
                normalizedTimelineHoursPerScreen
            ),
        }),
        [
            normalizedTimelineHoursPerScreen,
            plannerIndexes.themeByListId,
            selectedList,
            resolvedSelectedListId,
            themeName,
        ]
    );
    const isSidebarOpen = unarchivedLists.length > 0 && isShowingSidebar;
    const columnVisibilityRef = useRef({
        [PLANNER_COLUMNS.LISTS]: isListColumnOpen,
        [PLANNER_COLUMNS.TASK_DETAILS]: isTaskDetailsOpen,
        [PLANNER_COLUMNS.TASKS]: isSidebarOpen,
        [PLANNER_COLUMNS.TIMELINE]: isTimelineOpen,
    });
    const openColumnCount = [
        isListColumnOpen,
        isSidebarOpen,
        isTaskDetailsOpen,
        isTimelineOpen,
    ].filter(Boolean).length;

    useLayoutEffect(() => {
        columnVisibilityRef.current = {
            [PLANNER_COLUMNS.LISTS]: isListColumnOpen,
            [PLANNER_COLUMNS.TASK_DETAILS]: isTaskDetailsOpen,
            [PLANNER_COLUMNS.TASKS]: isSidebarOpen,
            [PLANNER_COLUMNS.TIMELINE]: isTimelineOpen,
        };

        if (openColumnCount === 0) {
            setIsTaskDetailsOpen(true);
        }
    }, [
        isListColumnOpen,
        isSidebarOpen,
        isTaskDetailsOpen,
        isTimelineOpen,
        openColumnCount,
        setIsTaskDetailsOpen,
    ]);

    useEffect(() => {
        if (
            resolvedSelectedListId !== undefined &&
            selectedListId !== resolvedSelectedListId
        ) {
            setSelectedListId(resolvedSelectedListId);
        }
    }, [resolvedSelectedListId, selectedListId, setSelectedListId]);

    useEffect(() => {
        if (selectedTaskId !== resolvedSelectedTaskId) {
            setSelectedTaskId(resolvedSelectedTaskId);
        }
    }, [resolvedSelectedTaskId, selectedTaskId, setSelectedTaskId]);

    useEffect(() => {
        const handleDragOver = () => setIsDraggingTask(true);
        const handleDragEnd = () => setIsDraggingTask(false);

        document.addEventListener('dragover', handleDragOver);
        document.addEventListener('dragend', handleDragEnd);
        document.addEventListener('drop', handleDragEnd);

        return () => {
            document.removeEventListener('dragover', handleDragOver);
            document.removeEventListener('dragend', handleDragEnd);
            document.removeEventListener('drop', handleDragEnd);
        };
    }, []);

    useEffect(
        () => () => {
            if (cardSizingTransitionTimerRef.current !== null) {
                clearTimeout(cardSizingTransitionTimerRef.current);
            }

            if (routeTransitionTimerRef.current !== null) {
                clearTimeout(routeTransitionTimerRef.current);
            }
        },
        []
    );

    const createEntityId = useCallback(() => {
        return crypto.randomUUID();
    }, []);

    const replaceLabelEditSession = useCallback(nextSession => {
        labelEditSessionRef.current = nextSession;
        setLabelEditSession(nextSession);
    }, []);

    const beginLabelEdit = useCallback(
        ({ afterCommit = null, entityId, entityType }) => {
            const nextSession = {
                afterCommit,
                entityId,
                entityType,
                phase: 'requested',
                requestId: labelEditRequestIdRef.current + 1,
            };

            labelEditRequestIdRef.current = nextSession.requestId;
            replaceLabelEditSession(nextSession);
            return nextSession;
        },
        [replaceLabelEditSession]
    );

    const onFulfillLabelEdit = useCallback(requestId => {
        const currentSession = labelEditSessionRef.current;

        if (!currentSession || currentSession.requestId !== requestId) {
            return;
        }

        const nextSession = { ...currentSession, phase: 'editing' };
        labelEditSessionRef.current = nextSession;
        setLabelEditSession(nextSession);
    }, []);

    const onCancelLabelEdit = useCallback(
        requestId => {
            if (labelEditSessionRef.current?.requestId === requestId) {
                replaceLabelEditSession(null);
            }
        },
        [replaceLabelEditSession]
    );

    const showPrimaryViewImmediately = useCallback(
        nextIsShowingListManager => {
            if (routeTransitionTimerRef.current !== null) {
                clearTimeout(routeTransitionTimerRef.current);
                routeTransitionTimerRef.current = null;
            }

            setIsTransitioning(false);
            setIsShowingTrashContents(false);
            setIsShowingListManager(nextIsShowingListManager);
        },
        [setIsShowingListManager, setIsShowingTrashContents]
    );

    const onUpdateList = useCallback(
        (listId, updates) => {
            if (!canMutateList(listId)) return;
            setLists(prevLists =>
                prevLists.map(list =>
                    list.id === listId
                        ? {
                              ...list,
                              ...updates,
                          }
                        : list
                )
            );
        },
        [canMutateList, setLists]
    );

    const onUpdateTask = useCallback(
        (taskId, updates) => {
            setTasks(prevTasks =>
                prevTasks.map(task =>
                    task.id === taskId &&
                    canMutateList(task.list_id) &&
                    (!updates.list_id || canMutateList(updates.list_id))
                        ? {
                              ...task,
                              ...updates,
                          }
                        : task
                )
            );
        },
        [canMutateList, setTasks]
    );

    const updateTaskWith = useCallback(
        (taskId, updateTask) => {
            setTasks(currentTasks =>
                currentTasks.map(task =>
                    task.id === taskId && canMutateList(task.list_id)
                        ? updateTask(task)
                        : task
                )
            );
        },
        [canMutateList, setTasks]
    );

    const onBeginAttachmentUploads = useCallback(
        (taskId, pendingAttachments, notes) => {
            updateTaskWith(taskId, task =>
                beginTaskAttachmentUploads(task, pendingAttachments, notes)
            );
        },
        [updateTaskWith]
    );

    const onResolveAttachmentUpload = useCallback(
        (taskId, clientId, readyAttachment) => {
            updateTaskWith(taskId, task =>
                resolveTaskAttachmentUpload(task, clientId, readyAttachment)
            );
        },
        [updateTaskWith]
    );

    const onRejectAttachmentUpload = useCallback(
        (taskId, clientId) => {
            updateTaskWith(taskId, task =>
                rejectTaskAttachmentUpload(task, clientId)
            );
        },
        [updateTaskWith]
    );

    const getCollaborationAttachmentContext = useCallback(
        async taskId => {
            const task = tasks.find(item => item.id === taskId);
            const identity = plannerCollaboration.data.identity;
            if (!task || !identity) {
                throw new Error('Encrypted attachment sync is unavailable.');
            }
            const keyVersion = task.key_version || 1;
            const listKey = await loadCollaborationListKey({
                accountKey: identity.accountKey,
                keyVersion,
                listId: task.list_id,
            });
            if (!listKey) {
                throw new Error('The encrypted list key is unavailable.');
            }
            return {
                keyVersion,
                listId: task.list_id,
                listKey,
            };
        },
        [plannerCollaboration.data.identity, tasks]
    );

    const attachmentUploads = useAttachmentUploads({
        collaborationUpload: {
            enabled:
                plannerCollaboration.data.isEnabled &&
                plannerCollaboration.data.isReady,
            getContext: getCollaborationAttachmentContext,
        },
        onReject: onRejectAttachmentUpload,
        onResolve: onResolveAttachmentUpload,
    });

    const onLoadTaskAttachment = useCallback(
        async attachment => {
            if (attachment.local_encrypted) {
                const blob = await loadLocalAttachment(attachment);
                const url = URL.createObjectURL(blob);
                return {
                    filename: attachment.filename,
                    mimeType: attachment.mime_type,
                    revoke: () => URL.revokeObjectURL(url),
                    url,
                };
            }
            if (!attachment.encrypted) {
                return {
                    filename: attachment.filename,
                    mimeType: attachment.mime_type,
                    revoke: () => {},
                    url: attachment.url,
                };
            }
            const identity = plannerCollaboration.data.identity;
            const listKey = await loadCollaborationListKey({
                accountKey: identity.accountKey,
                keyVersion: attachment.key_version,
                listId: attachment.list_id,
            });
            const downloaded = await downloadCollaborationAttachment({
                attachment,
                listKey,
            });
            const url = URL.createObjectURL(downloaded.blob);
            return {
                filename: downloaded.filename,
                mimeType: downloaded.mimeType,
                revoke: () => URL.revokeObjectURL(url),
                url,
            };
        },
        [plannerCollaboration.data.identity]
    );

    const onOpenTaskAttachment = useCallback(
        async attachment => {
            const loaded = await onLoadTaskAttachment(attachment);
            window.open(loaded.url, '_blank', 'noopener,noreferrer');
            if (attachment.encrypted || attachment.local_encrypted) {
                window.setTimeout(loaded.revoke, 60_000);
            }
        },
        [onLoadTaskAttachment]
    );

    const onPasteTaskAttachments = useCallback(
        (taskId, files, editorState) => {
            const uploadEntries = files.map(file => {
                const pending = createPendingAttachment(
                    file,
                    createAttachmentClientId()
                );

                return { file, pending };
            });
            const insertion = insertAttachmentPlaceholders(
                editorState.text,
                editorState.selection,
                uploadEntries.map(entry => entry.pending)
            );

            onBeginAttachmentUploads(
                taskId,
                uploadEntries.map(entry => entry.pending),
                insertion.text
            );
            attachmentUploads.queueUploads(taskId, uploadEntries);

            return insertion;
        },
        [attachmentUploads.queueUploads, onBeginAttachmentUploads]
    );

    const onCancelAttachmentUpload = useCallback(
        clientId => {
            attachmentUploads.cancelUpload(clientId);
        },
        [attachmentUploads.cancelUpload]
    );

    const onDismissFailedAttachmentUpload = useCallback(
        clientId => {
            attachmentUploads.dismissFailedUpload(clientId);
        },
        [attachmentUploads.dismissFailedUpload]
    );

    const onRemoveTaskAttachment = useCallback(
        async (taskId, attachment, attachmentIndex = 0) => {
            if (
                !attachment?.id ||
                ['pending', 'removing'].includes(
                    attachmentRemovalStateById[attachment.id]?.status
                )
            ) {
                return;
            }

            setAttachmentRemovalStateById(currentState => ({
                ...currentState,
                [attachment.id]: { status: 'pending' },
            }));

            try {
                if (attachment.encrypted && !attachment.local_encrypted) {
                    const identity = plannerCollaboration.data.identity;
                    const listKey = await loadCollaborationListKey({
                        accountKey: identity.accountKey,
                        keyVersion: attachment.key_version,
                        listId: attachment.list_id,
                    });
                    await deleteCollaborationAttachment({
                        attachment,
                        listKey,
                    });
                } else {
                    await deleteStoredAttachment(attachment);
                }

                updateTaskWith(taskId, task =>
                    removeReadyTaskAttachment(task, attachment.id)
                );
                attachmentUploads.pushDraftMutation({
                    task_id: taskId,
                    type: 'remove-markdown',
                    url: attachment.url,
                });
                setAttachmentRemovalStateById(currentState => ({
                    ...currentState,
                    [attachment.id]: {
                        attachment,
                        attachment_index: attachmentIndex,
                        status: 'removing',
                        task_id: taskId,
                    },
                }));
                await waitForInteractionMotion();
                setAttachmentRemovalStateById(currentState => {
                    const nextState = { ...currentState };
                    delete nextState[attachment.id];
                    return nextState;
                });
            } catch (error) {
                setAttachmentRemovalStateById(currentState => ({
                    ...currentState,
                    [attachment.id]: {
                        error:
                            error?.message ||
                            'The attachment could not be removed.',
                        status: 'error',
                    },
                }));
            }
        },
        [
            attachmentRemovalStateById,
            attachmentUploads.pushDraftMutation,
            plannerCollaboration.data.identity,
            updateTaskWith,
        ]
    );

    const onCreateList = useCallback(
        (overrides = {}) => {
            const newListId = createEntityId();
            const randomAccentKey = sample(ACCENT_SWATCHES).key;

            setLists(currentLists =>
                currentLists.concat([
                    {
                        id: newListId,
                        accent_key: randomAccentKey,
                        isArchived: false,
                        label: `${sample(COPY.MOTIVATIONAL_DESCRIPTORS)} ${
                            COPY.NEW_LIST_LABEL
                        }`,
                        ...overrides,
                    },
                ])
            );

            setSelectedListId(newListId);
            setSelectedTaskId(null);
            setIsShowingSidebar(true);
            setIsListColumnOpen(true);
            setIsOptionsMenuOpen(false);
            showPrimaryViewImmediately(true);
            beginLabelEdit({
                afterCommit: LABEL_EDIT_AFTER_COMMIT.OPEN_TASK_VIEW,
                entityId: newListId,
                entityType: LABEL_EDIT_ENTITY_TYPES.LIST,
            });

            return newListId;
        },
        [
            beginLabelEdit,
            createEntityId,
            setIsListColumnOpen,
            setIsShowingSidebar,
            setIsOptionsMenuOpen,
            setSelectedListId,
            setSelectedTaskId,
            setLists,
            showPrimaryViewImmediately,
        ]
    );

    const onSelectList = useCallback(
        (listId, { preserveSidebarState = false } = {}) => {
            setSelectedListId(listId);
            const firstTaskInList =
                plannerIndexes.tasksByListId.get(listId)?.[0];
            setSelectedTaskId(firstTaskInList?.id ?? null);

            if (!preserveSidebarState) {
                setIsShowingSidebar(true);
            }
            setIsShowingTrashContents(false);
            setIsShowingListManager(true);
            document.querySelector(`[data-list-id="${listId}"]`)?.focus();
        },
        [
            plannerIndexes.tasksByListId,
            setSelectedListId,
            setSelectedTaskId,
            setIsShowingSidebar,
            setIsShowingTrashContents,
            setIsShowingListManager,
        ]
    );

    const onArchiveList = useCallback(
        listId => {
            if (
                plannerCollaboration.data.isEnabled &&
                !lists.some(
                    list => list.id === listId && list.is_private_copy
                ) &&
                plannerCollaboration.data.roleByListId.get(listId) !==
                    ROLES.OWNER
            ) {
                return;
            }
            const remainingLists = unarchivedLists.filter(
                list => list.id !== listId
            );

            if (remainingLists.length) {
                setLists(currentLists =>
                    currentLists.map(list =>
                        list.id === listId
                            ? { ...list, isArchived: true }
                            : list
                    )
                );

                if (resolvedSelectedListId === listId) {
                    const replacementList = remainingLists[0];
                    const replacementTask = plannerIndexes.tasksByListId.get(
                        replacementList.id
                    )?.[0];
                    setSelectedListId(replacementList.id);
                    setSelectedTaskId(replacementTask?.id ?? null);
                }

                return;
            }

            const replacementListId = createEntityId();
            const replacementList = {
                accent_key: sample(ACCENT_SWATCHES).key,
                id: replacementListId,
                isArchived: false,
                label: '',
            };

            setLists(currentLists =>
                currentLists
                    .map(list =>
                        list.id === listId
                            ? { ...list, isArchived: true }
                            : list
                    )
                    .concat(replacementList)
            );
            setSelectedListId(replacementListId);
            setSelectedTaskId(null);
            setIsShowingSidebar(true);
            setIsListColumnOpen(true);
            setIsOptionsMenuOpen(false);
            showPrimaryViewImmediately(true);
            beginLabelEdit({
                afterCommit: LABEL_EDIT_AFTER_COMMIT.OPEN_TASK_VIEW,
                entityId: replacementListId,
                entityType: LABEL_EDIT_ENTITY_TYPES.LIST,
            });
        },
        [
            beginLabelEdit,
            createEntityId,
            plannerIndexes.tasksByListId,
            resolvedSelectedListId,
            setIsListColumnOpen,
            setIsShowingSidebar,
            setIsOptionsMenuOpen,
            setLists,
            setSelectedListId,
            setSelectedTaskId,
            showPrimaryViewImmediately,
            unarchivedLists,
            plannerCollaboration.data.isEnabled,
            plannerCollaboration.data.roleByListId,
            lists,
        ]
    );

    const onCreateTask = useCallback(
        (overrides = {}) => {
            if (!canMutateList(resolvedSelectedListId)) return null;
            const newTaskId = createEntityId();
            const now = new Date();
            const currentHour = now.getHours();
            const currentMinute = now.getMinutes();

            setTasks(currentTasks =>
                [
                    {
                        attachments: [],
                        icon: ICONS.TASK_DEFAULT,
                        id: newTaskId,
                        list_id: resolvedSelectedListId,
                        isComplete: false,
                        label: `${sample(COPY.MOTIVATIONAL_DESCRIPTORS)} ${
                            COPY.NEW_TASK_LABEL
                        }`,
                        notes: COPY.NEW_TASK_NOTES,
                        scheduled: false,
                        duration_minutes: 30,
                        scheduled_time: `${currentHour}:${currentMinute}`,
                        ...overrides,
                    },
                ].concat(currentTasks)
            );

            setSelectedTaskId(newTaskId);
            setIsOptionsMenuOpen(false);
            showPrimaryViewImmediately(false);
            beginLabelEdit({
                entityId: newTaskId,
                entityType: LABEL_EDIT_ENTITY_TYPES.TASK,
            });

            return newTaskId;
        },
        [
            beginLabelEdit,
            canMutateList,
            createEntityId,
            resolvedSelectedListId,
            setIsOptionsMenuOpen,
            setSelectedTaskId,
            setTasks,
            showPrimaryViewImmediately,
        ]
    );

    const onSelectTask = useCallback(
        taskId => {
            const task = plannerIndexes.taskById.get(taskId);

            if (!task) {
                return;
            }

            setSelectedListId(task.list_id);

            if (isShowingListManager) {
                setIsShowingListManager(false);
            }

            setSelectedTaskId(taskId);
            document.querySelector(`[data-task-id="${taskId}"]`)?.focus();
        },
        [
            isShowingListManager,
            plannerIndexes.taskById,
            setIsShowingListManager,
            setSelectedTaskId,
            setSelectedListId,
        ]
    );

    const selectTaskByRelativeIndex = useCallback(
        relativeIndex => {
            const tasksInList =
                plannerIndexes.unscheduledTasksByListId.get(
                    resolvedSelectedListId
                ) || [];
            const indexOfCurrentTask = tasksInList.findIndex(
                task => task.id === resolvedSelectedTaskId
            );
            const targetIndex =
                (indexOfCurrentTask +
                    getRelativeIndexOffset(relativeIndex, tasksInList.length)) %
                tasksInList.length;
            const taskAtRelativeIndex = tasksInList[targetIndex];

            if (taskAtRelativeIndex) {
                onSelectTask(taskAtRelativeIndex.id);
            }
        },
        [
            onSelectTask,
            plannerIndexes.unscheduledTasksByListId,
            resolvedSelectedListId,
            resolvedSelectedTaskId,
        ]
    );

    const selectTaskByShortcutNumber = useCallback(
        shortcutNumber => {
            const tasksInList =
                plannerIndexes.unscheduledTasksByListId.get(
                    resolvedSelectedListId
                ) || [];
            const task = tasksInList[shortcutNumber - 1];

            if (!task) {
                return false;
            }

            onSelectTask(task.id);
            return true;
        },
        [
            onSelectTask,
            plannerIndexes.unscheduledTasksByListId,
            resolvedSelectedListId,
        ]
    );

    const selectListByRelativeIndex = useCallback(
        relativeIndex => {
            const targetIndex =
                (currentListIndex +
                    getRelativeIndexOffset(
                        relativeIndex,
                        unarchivedLists.length
                    )) %
                unarchivedLists.length;
            const listAtRelativeIndex = unarchivedLists[targetIndex];

            if (listAtRelativeIndex) {
                onSelectList(listAtRelativeIndex.id);
            }
        },
        [currentListIndex, onSelectList, unarchivedLists]
    );

    const onImmediatelySelectTask = useCallback(
        taskId => {
            onSelectTask(taskId);
        },
        [onSelectTask]
    );

    const onTransitionToTask = useCallback(
        taskId => {
            if (routeTransitionTimerRef.current !== null) {
                clearTimeout(routeTransitionTimerRef.current);
            }

            setIsTransitioning(true);
            routeTransitionTimerRef.current = setTimeout(() => {
                onSelectTask(taskId);
                setIsTransitioning(false);
                routeTransitionTimerRef.current = null;
            }, ROUTE_TRANSITION_ANIMATION_DURATION / 2);
        },
        [onSelectTask]
    );

    const onChangeColumnVisibility = useCallback(
        (column, nextIsOpenOrUpdate) => {
            const currentVisibility = columnVisibilityRef.current;
            const currentIsOpen = currentVisibility[column];
            const nextIsOpen =
                typeof nextIsOpenOrUpdate === 'function'
                    ? Boolean(nextIsOpenOrUpdate(currentIsOpen))
                    : Boolean(nextIsOpenOrUpdate);

            if (nextIsOpen === currentIsOpen) {
                return;
            }

            if (
                !nextIsOpen &&
                Object.values(currentVisibility).filter(Boolean).length <= 1
            ) {
                return;
            }

            columnVisibilityRef.current = {
                ...currentVisibility,
                [column]: nextIsOpen,
            };

            switch (column) {
                case PLANNER_COLUMNS.LISTS:
                    setIsListColumnOpen(nextIsOpen);
                    break;
                case PLANNER_COLUMNS.TASK_DETAILS:
                    setIsTaskDetailsOpen(nextIsOpen);
                    break;
                case PLANNER_COLUMNS.TASKS:
                    setIsShowingSidebar(nextIsOpen);
                    break;
                case PLANNER_COLUMNS.TIMELINE:
                    setIsTimelineOpen(nextIsOpen);
                    break;
                default:
                    break;
            }
        },
        [
            setIsListColumnOpen,
            setIsShowingSidebar,
            setIsTaskDetailsOpen,
            setIsTimelineOpen,
        ]
    );
    const onChangeIsSidebarOpen = useCallback(
        nextIsOpen =>
            onChangeColumnVisibility(PLANNER_COLUMNS.TASKS, nextIsOpen),
        [onChangeColumnVisibility]
    );
    const onChangeIsListColumnOpen = useCallback(
        nextIsOpen =>
            onChangeColumnVisibility(PLANNER_COLUMNS.LISTS, nextIsOpen),
        [onChangeColumnVisibility]
    );
    const onChangeIsTaskDetailsOpen = useCallback(
        nextIsOpen =>
            onChangeColumnVisibility(PLANNER_COLUMNS.TASK_DETAILS, nextIsOpen),
        [onChangeColumnVisibility]
    );
    const onChangeIsTimelineOpen = useCallback(
        nextIsOpen =>
            onChangeColumnVisibility(PLANNER_COLUMNS.TIMELINE, nextIsOpen),
        [onChangeColumnVisibility]
    );

    const onChangeIsShowingListManager = useCallback(
        newIsShowingListManager => {
            if (routeTransitionTimerRef.current !== null) {
                clearTimeout(routeTransitionTimerRef.current);
            }

            setIsTransitioning(true);
            setIsListColumnOpen(true);
            routeTransitionTimerRef.current = setTimeout(() => {
                setIsShowingListManager(newIsShowingListManager);

                if (newIsShowingListManager) {
                    setIsShowingSidebar(true);
                }

                setIsShowingTrashContents(false);
                setIsTransitioning(false);
                routeTransitionTimerRef.current = null;
            }, ROUTE_TRANSITION_ANIMATION_DURATION / 2);
        },
        [
            setIsShowingSidebar,
            setIsListColumnOpen,
            setIsShowingListManager,
            setIsShowingTrashContents,
        ]
    );

    const onCompleteLabelEdit = useCallback(
        requestId => {
            const currentSession = labelEditSessionRef.current;

            if (!currentSession || currentSession.requestId !== requestId) {
                return;
            }

            replaceLabelEditSession(null);

            if (
                currentSession.afterCommit ===
                LABEL_EDIT_AFTER_COMMIT.OPEN_TASK_VIEW
            ) {
                onChangeIsShowingListManager(false);
            }
        },
        [onChangeIsShowingListManager, replaceLabelEditSession]
    );

    const onShowTrashContents = useCallback(() => {
        if (!isShowingSidebar) {
            setIsShowingSidebar(true);
        }
        if (!isShowingListManager) {
            setIsShowingListManager(true);
        }
        setIsListColumnOpen(true);
        setIsShowingTrashContents(true);
    }, [
        setIsListColumnOpen,
        isShowingListManager,
        isShowingSidebar,
        setIsShowingListManager,
        setIsShowingSidebar,
        setIsShowingTrashContents,
    ]);

    const onChangeThemeMode = useCallback(
        nextThemeMode => {
            setThemeMode(normalizeThemeMode(nextThemeMode));
        },
        [setThemeMode]
    );

    const onChangeDesktopShortcut = useCallback(
        async (commandId, nextShortcut) => {
            const normalizedShortcut = normalizeDesktopShortcut(
                nextShortcut,
                DEFAULT_DESKTOP_SHORTCUTS[commandId]
            );
            const nextShortcuts = {
                ...desktopShortcuts,
                [commandId]: normalizedShortcut,
            };

            assertUniqueDesktopShortcuts(nextShortcuts);
            await changeDesktopShortcuts(nextShortcuts);

            if (commandId === PLANNER_COMMANDS.SHOW_PLANNER) {
                setDesktopGlobalShortcut(normalizedShortcut);
                return;
            }

            setDesktopCreationShortcuts(currentShortcuts => ({
                ...currentShortcuts,
                [commandId]: normalizedShortcut,
            }));
        },
        [
            desktopShortcuts,
            setDesktopCreationShortcuts,
            setDesktopGlobalShortcut,
        ]
    );

    const onChangeTimelineHoursPerScreen = useCallback(
        nextHoursPerScreen => {
            setTimelineHoursPerScreen(
                normalizeTimelineHoursPerScreen(nextHoursPerScreen)
            );
        },
        [setTimelineHoursPerScreen]
    );

    const onChangeRelativeCardSizingEnabled = useCallback(
        nextRelativeCardSizingEnabled => {
            if (cardSizingTransitionTimerRef.current !== null) {
                clearTimeout(cardSizingTransitionTimerRef.current);
            }

            setIsCardSizingTransitioning(true);
            setRelativeCardSizingEnabled(
                Boolean(nextRelativeCardSizingEnabled)
            );
            cardSizingTransitionTimerRef.current = setTimeout(() => {
                setIsCardSizingTransitioning(false);
                cardSizingTransitionTimerRef.current = null;
            }, INTERACTION_ANIMATION_DURATION);
        },
        [setRelativeCardSizingEnabled]
    );

    const onChangeFocusAssistEnabled = useCallback(
        nextFocusAssistEnabled => {
            setFocusAssistEnabled(Boolean(nextFocusAssistEnabled));
        },
        [setFocusAssistEnabled]
    );

    const onChangeHighlightIncompleteSentencesEnabled = useCallback(
        nextHighlightIncompleteSentencesEnabled => {
            setHighlightIncompleteSentencesEnabled(
                Boolean(nextHighlightIncompleteSentencesEnabled)
            );
        },
        [setHighlightIncompleteSentencesEnabled]
    );

    const onChangeTaskPosition = useCallback(
        (taskId, newIndex) => {
            setTasks(prevTasks => {
                const tasksMinusTarget = prevTasks.filter(
                    task => task.id !== taskId
                );
                const task = prevTasks.find(task => task.id === taskId);
                if (!task || !canMutateList(task.list_id)) return prevTasks;

                return [].concat(
                    tasksMinusTarget.slice(0, newIndex),
                    [task],
                    tasksMinusTarget.slice(newIndex)
                );
            });
        },
        [canMutateList, setTasks]
    );

    const deleteTask = useCallback(
        taskId => {
            if (resolvedSelectedTaskId === taskId) {
                const firstUnarchivedTask = tasks.find(
                    task =>
                        task.id !== taskId &&
                        task.list_id === resolvedSelectedListId &&
                        !task.isComplete
                );

                if (firstUnarchivedTask) {
                    onImmediatelySelectTask(firstUnarchivedTask.id);
                } else {
                    onChangeIsShowingListManager(true);
                }
            }

            onUpdateTask(taskId, {
                isComplete: true,
            });
        },
        [
            onChangeIsShowingListManager,
            onImmediatelySelectTask,
            onUpdateTask,
            resolvedSelectedListId,
            resolvedSelectedTaskId,
            tasks,
        ]
    );

    const moveTaskToTimeline = useCallback(() => {
        if (resolvedSelectedTaskId !== null) {
            onUpdateTask(resolvedSelectedTaskId, {
                scheduled: true,
            });
        }
    }, [onUpdateTask, resolvedSelectedTaskId]);

    const moveTaskToTaskList = useCallback(() => {
        if (resolvedSelectedTaskId !== null) {
            onUpdateTask(resolvedSelectedTaskId, {
                scheduled: false,
            });
        }
    }, [onUpdateTask, resolvedSelectedTaskId]);

    const toggleTaskListVisibility = useCallback(() => {
        if (isShowingSidebar) {
            setIsShowingTrashContents(false);
        }

        onChangeIsSidebarOpen(!isShowingSidebar);
    }, [isShowingSidebar, onChangeIsSidebarOpen]);

    const cycleThemeMode = useCallback(() => {
        setThemeMode(getNextThemeMode(normalizedThemeMode));
    }, [normalizedThemeMode, setThemeMode]);

    const toggleIsEditingCurrentTask = useCallback(() => {
        if (resolvedSelectedTaskId === null) {
            return;
        }

        showPrimaryViewImmediately(false);
        beginLabelEdit({
            entityId: resolvedSelectedTaskId,
            entityType: LABEL_EDIT_ENTITY_TYPES.TASK,
        });
    }, [beginLabelEdit, resolvedSelectedTaskId, showPrimaryViewImmediately]);

    const toggleListColumnVisibility = useCallback(() => {
        onChangeIsListColumnOpen(current => !current);
    }, [onChangeIsListColumnOpen]);

    const onExecuteCommand = useCallback(
        commandId => {
            switch (commandId) {
                case PLANNER_COMMANDS.CREATE_LIST:
                    onCreateList();
                    break;
                case PLANNER_COMMANDS.CREATE_TASK:
                    onCreateTask();
                    break;
                default:
                    break;
            }
        },
        [onCreateList, onCreateTask]
    );

    const createNewTask = useCallback(
        () => onExecuteCommand(PLANNER_COMMANDS.CREATE_TASK),
        [onExecuteCommand]
    );

    const deleteCurrentTask = useCallback(() => {
        if (resolvedSelectedTaskId !== null) {
            deleteTask(resolvedSelectedTaskId);
        }
    }, [deleteTask, resolvedSelectedTaskId]);

    const goBack = useCallback(() => {
        if (isShowingTrashContents) {
            setIsShowingTrashContents(false);
            setIsShowingListManager(false);
            return;
        }

        setIsShowingListManager(current => !current);
    }, [
        isShowingTrashContents,
        setIsShowingListManager,
        setIsShowingTrashContents,
    ]);

    useKeyboardShortcut(
        keyboardShortcutNamespace,
        [1, 2, 3, 4, 5, 6, 7, 8, 9],
        evt => {
            if (selectTaskByShortcutNumber(Number(evt.key))) {
                evt.preventDefault();
            }
        }
    );
    useKeyboardShortcut(
        keyboardShortcutNamespace,
        'cmd + arrowRight',
        withPreventDefault(moveTaskToTimeline)
    );
    useKeyboardShortcut(
        keyboardShortcutNamespace,
        'cmd + arrowLeft',
        withPreventDefault(moveTaskToTaskList)
    );
    useKeyboardShortcut(
        keyboardShortcutNamespace,
        ['arrowRight', 'cmd + shift + arrowRight', 'cmd + shift + ]'],
        withPreventDefault(() => selectListByRelativeIndex(1))
    );
    useKeyboardShortcut(
        keyboardShortcutNamespace,
        ['arrowLeft', 'cmd + shift + arrowLeft', 'cmd + shift + ['],
        withPreventDefault(() => selectListByRelativeIndex(-1))
    );
    useKeyboardShortcut(
        keyboardShortcutNamespace,
        'b',
        withPreventDefault(toggleTaskListVisibility)
    );
    useKeyboardShortcut(
        keyboardShortcutNamespace,
        'd',
        withPreventDefault(cycleThemeMode)
    );
    useKeyboardShortcut(
        keyboardShortcutNamespace,
        'e',
        withPreventDefault(toggleIsEditingCurrentTask)
    );
    useKeyboardShortcut(
        keyboardShortcutNamespace,
        'escape',
        withPreventDefault(goBack)
    );
    useKeyboardShortcut(
        keyboardShortcutNamespace,
        'l',
        withPreventDefault(toggleListColumnVisibility)
    );
    useKeyboardShortcut(
        keyboardShortcutNamespace,
        'n',
        withPreventDefault(createNewTask)
    );
    useKeyboardShortcut(
        keyboardShortcutNamespace,
        't',
        withPreventDefault(deleteCurrentTask)
    );
    useKeyboardShortcut(
        keyboardShortcutNamespace,
        'arrowUp',
        withPreventDefault(() => selectTaskByRelativeIndex(-1))
    );
    useKeyboardShortcut(
        keyboardShortcutNamespace,
        'arrowDown',
        withPreventDefault(() => selectTaskByRelativeIndex(1))
    );

    const appActions = useMemo(
        () => ({
            ...plannerCollaboration.actions,
            onBeginAttachmentUploads,
            onCancelAttachmentUpload,
            deleteTask,
            onArchiveList,
            onCancelLabelEdit,
            onChangeDesktopShortcut,
            onChangeFocusAssistEnabled,
            onChangeHighlightIncompleteSentencesEnabled,
            onChangeIsListColumnOpen,
            onChangeIsShowingListManager,
            onChangeIsOptionsMenuOpen: setIsOptionsMenuOpen,
            onChangeIsSidebarOpen,
            onChangeIsTaskDetailsOpen,
            onChangeIsTimelineOpen,
            onChangeRelativeCardSizingEnabled,
            onChangeTaskPosition,
            onChangeThemeMode,
            onChangeTimelineHoursPerScreen,
            onCompleteLabelEdit,
            onCreateList,
            onCreateTask,
            onDismissFailedAttachmentUpload,
            onExecuteCommand,
            onFulfillLabelEdit,
            onImmediatelySelectTask,
            onLoadTaskAttachment,
            onOpenTaskAttachment,
            onSelectList,
            onShowTrashContents,
            onPasteTaskAttachments,
            onRejectAttachmentUpload,
            onRemoveTaskAttachment,
            onResolveAttachmentUpload,
            onTransitionToTask,
            onUpdateList,
            onUpdateTask,
        }),
        [
            plannerCollaboration.actions,
            onBeginAttachmentUploads,
            onCancelAttachmentUpload,
            deleteTask,
            onArchiveList,
            onCancelLabelEdit,
            onChangeDesktopShortcut,
            onChangeFocusAssistEnabled,
            onChangeHighlightIncompleteSentencesEnabled,
            onChangeIsListColumnOpen,
            onChangeIsShowingListManager,
            setIsOptionsMenuOpen,
            onChangeIsSidebarOpen,
            onChangeIsTaskDetailsOpen,
            onChangeIsTimelineOpen,
            onChangeRelativeCardSizingEnabled,
            onChangeTaskPosition,
            onChangeThemeMode,
            onChangeTimelineHoursPerScreen,
            onCompleteLabelEdit,
            onCreateList,
            onCreateTask,
            onDismissFailedAttachmentUpload,
            onExecuteCommand,
            onFulfillLabelEdit,
            onImmediatelySelectTask,
            onLoadTaskAttachment,
            onOpenTaskAttachment,
            onSelectList,
            onShowTrashContents,
            onPasteTaskAttachments,
            onRejectAttachmentUpload,
            onRemoveTaskAttachment,
            onResolveAttachmentUpload,
            onTransitionToTask,
            onUpdateList,
            onUpdateTask,
        ]
    );

    const appData = useMemo(
        () => ({
            attachmentDraftMutations: attachmentUploads.draftMutations,
            attachmentRemovalStateById,
            attachmentUploadProgressByClientId:
                attachmentUploads.progressByClientId,
            canCollapseColumns: openColumnCount > 1,
            collaboration: plannerCollaboration.data,
            desktopShortcuts,
            effectiveRelativeCardSizingEnabled,
            focusAssistEnabled,
            failedAttachmentUploads: attachmentUploads.failedUploads,
            highlightIncompleteSentencesEnabled,
            isCardSizingTransitioning,
            isDraggingTask,
            isDesktop,
            isOptionsMenuOpen,
            isPlannerVaultLoaded,
            isListColumnOpen,
            isShowingListManager,
            isShowingTrashContents,
            isSidebarOpen,
            isTaskDetailsOpen,
            isTimelineOpen,
            labelEditSession,
            lists,
            plannerIndexes,
            plannerVaultError,
            relativeCardSizingEnabled,
            selectedListId: resolvedSelectedListId,
            selectedTaskId: resolvedSelectedTaskId,
            tasks,
            theme: themeName,
            themeMode: normalizedThemeMode,
            timelineHoursPerScreen: normalizedTimelineHoursPerScreen,
        }),
        [
            attachmentRemovalStateById,
            attachmentUploads.draftMutations,
            attachmentUploads.failedUploads,
            attachmentUploads.progressByClientId,
            openColumnCount,
            plannerCollaboration.data,
            desktopShortcuts,
            effectiveRelativeCardSizingEnabled,
            focusAssistEnabled,
            highlightIncompleteSentencesEnabled,
            isCardSizingTransitioning,
            isDraggingTask,
            isDesktop,
            isOptionsMenuOpen,
            isPlannerVaultLoaded,
            isListColumnOpen,
            isShowingListManager,
            isShowingTrashContents,
            isSidebarOpen,
            isTaskDetailsOpen,
            isTimelineOpen,
            labelEditSession,
            lists,
            normalizedThemeMode,
            normalizedTimelineHoursPerScreen,
            plannerIndexes,
            plannerVaultError,
            relativeCardSizingEnabled,
            resolvedSelectedListId,
            resolvedSelectedTaskId,
            tasks,
            themeName,
        ]
    );

    const columnWidths = buildColumnWidths({
        isListColumnOpen,
        isSidebarOpen,
        isTaskDetailsOpen,
        isTimelineOpen,
    });

    return {
        appActions,
        appData,
        appThemeStyle,
        columnWidths,
        isTransitioning,
        onChangeIsShowingListManager,
        unarchivedLists,
    };
}

export { normalizeListsForHydration };
