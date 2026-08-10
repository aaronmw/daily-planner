import React from 'react';
import CollaborationAccountDialog from './CollaborationAccountDialog';
import CollaborationConflictResolver from './CollaborationConflictResolver';
import { PrimaryAppColumn } from './AppColumn';
import CollapsibleColumn from './CollapsibleColumn';
import FlexBox from './atoms/FlexBox';
import { COPY, TIMELINE_FROM, TIMELINE_TO } from './atoms/tokens';
import Transition from './atoms/Transition';
import ListManager from './ListManager';
import OptionsMenu from './OptionsMenu';
import ShareAccessDialog from './ShareAccessDialog';
import Sidebar from './Sidebar';
import TaskDetails from './TaskDetails';
import TaskList from './TaskList';
import Timeline from './Timeline';
import Trash from './Trash';
import TrashedLists from './TrashedLists';
import TrashedTasks from './TrashedTasks';

const PlannerLayout = ({ planner }) => {
    const {
        appActions,
        appData,
        appThemeStyle,
        columnWidths,
        isTransitioning,
        unarchivedLists,
    } = planner;

    const {
        effectiveRelativeCardSizingEnabled,
        isCardSizingTransitioning,
        isShowingTrashContents,
        selectedTaskId,
        theme,
    } = appData;

    return (
        <main
            data-theme={theme.toLowerCase()}
            data-relative-card-sizing={effectiveRelativeCardSizingEnabled}
            data-card-sizing-transition={isCardSizingTransitioning}
            className="planner-root min-h-dvh bg-planner-background text-planner-text font-planner"
            style={appThemeStyle}
        >
            <CollaborationAccountDialog
                appActions={appActions}
                appData={appData}
            />
            <CollaborationConflictResolver
                conflicts={appData.collaboration?.conflicts || []}
                onDiscardConflict={appActions.onDiscardConflict}
                onResolveFieldConflict={appActions.onResolveFieldConflict}
                onSaveConflictAsPrivateCopy={
                    appActions.onSaveConflictAsPrivateCopy
                }
            />
            <Trash appActions={appActions} appData={appData} />
            <FlexBox
                align="stretch"
                className="planner-column-layout"
                style={{ height: '100dvh' }}
            >
                <CollapsibleColumn
                    canCollapse={appData.canCollapseColumns}
                    className="planner-timeline-column"
                    collapseLabel={COPY.LABEL_FOR_COLLAPSE_TIMELINE}
                    expandLabel={COPY.LABEL_FOR_EXPAND_TIMELINE}
                    expandedMinWidth="22vw"
                    isOpen={appData.isTimelineOpen}
                    onChangeIsOpen={appActions.onChangeIsTimelineOpen}
                    style={{
                        width: columnWidths.timeline,
                    }}
                >
                    {toggleButton => (
                        <Timeline
                            appActions={appActions}
                            appData={appData}
                            headerActions={toggleButton}
                            selectedTaskId={selectedTaskId}
                            from={TIMELINE_FROM}
                            to={TIMELINE_TO}
                        />
                    )}
                </CollapsibleColumn>

                <CollapsibleColumn
                    canCollapse={appData.canCollapseColumns}
                    className="planner-list-column"
                    collapseLabel={COPY.LABEL_FOR_COLLAPSE_LIST_COLUMN}
                    expandLabel={COPY.LABEL_FOR_EXPAND_LIST_COLUMN}
                    expandedMinWidth="28vw"
                    isOpen={appData.isListColumnOpen}
                    onChangeIsOpen={appActions.onChangeIsListColumnOpen}
                    style={{
                        width: columnWidths.listManager,
                    }}
                >
                    {toggleButton => (
                        <PrimaryAppColumn
                            headerActions={toggleButton}
                            label={COPY.LABEL_FOR_LIST_MANAGER}
                        >
                            {isShowingTrashContents ? (
                                <TrashedLists
                                    appActions={appActions}
                                    appData={appData}
                                />
                            ) : (
                                <ListManager
                                    collaboration={appData.collaboration || {}}
                                    labelEditSession={appData.labelEditSession}
                                    lists={unarchivedLists}
                                    onCancelLabelEdit={
                                        appActions.onCancelLabelEdit
                                    }
                                    onCompleteLabelEdit={
                                        appActions.onCompleteLabelEdit
                                    }
                                    onCreateList={appActions.onCreateList}
                                    onFulfillLabelEdit={
                                        appActions.onFulfillLabelEdit
                                    }
                                    onSelectList={appActions.onSelectList}
                                    onUpdateList={appActions.onUpdateList}
                                    onUpdateTask={appActions.onUpdateTask}
                                    selectedListId={appData.selectedListId}
                                    tasksByListId={
                                        appData.plannerIndexes.tasksByListId
                                    }
                                    themeByListId={
                                        appData.plannerIndexes.themeByListId
                                    }
                                />
                            )}
                        </PrimaryAppColumn>
                    )}
                </CollapsibleColumn>

                <Sidebar
                    appActions={appActions}
                    appData={appData}
                    style={{
                        width: columnWidths.sidebar,
                    }}
                >
                    {isShowingTrashContents ? (
                        <TrashedTasks
                            appActions={appActions}
                            appData={appData}
                        />
                    ) : (
                        <TaskList appActions={appActions} appData={appData} />
                    )}
                </Sidebar>

                <CollapsibleColumn
                    canCollapse={appData.canCollapseColumns}
                    className="planner-task-details-column"
                    collapseLabel={COPY.LABEL_FOR_COLLAPSE_TASK_DETAILS}
                    expandLabel={COPY.LABEL_FOR_EXPAND_TASK_DETAILS}
                    expandedMinWidth="28vw"
                    isOpen={appData.isTaskDetailsOpen}
                    onChangeIsOpen={appActions.onChangeIsTaskDetailsOpen}
                    style={{ width: columnWidths.taskDetails }}
                >
                    {toggleButton => (
                        <PrimaryAppColumn
                            headerActions={
                                <>
                                    <ShareAccessDialog
                                        appActions={appActions}
                                        appData={appData}
                                    />
                                    <OptionsMenu
                                        appActions={appActions}
                                        appData={appData}
                                    />
                                    {toggleButton}
                                </>
                            }
                            label={COPY.LABEL_FOR_TASK_DETAILS}
                        >
                            <Transition
                                isTransitioning={isTransitioning}
                                style={{ height: '100%' }}
                            >
                                <TaskDetails
                                    appActions={appActions}
                                    appData={appData}
                                />
                            </Transition>
                        </PrimaryAppColumn>
                    )}
                </CollapsibleColumn>
            </FlexBox>
        </main>
    );
};

export default PlannerLayout;
