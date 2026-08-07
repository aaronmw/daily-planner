import React from 'react';
import { PrimaryAppColumn } from './AppColumn';
import { ToggleButton } from './atoms/Button';
import FlexBox from './atoms/FlexBox';
import { COPY, ICONS, TIMELINE_FROM, TIMELINE_TO } from './atoms/tokens';
import Transition from './atoms/Transition';
import ListManager from './ListManager';
import OptionsMenu from './OptionsMenu';
import Sidebar from './Sidebar';
import TaskDetails from './TaskDetails';
import TaskList from './TaskList';
import Timeline from './Timeline';
import ToolBar from './ToolBar';
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
        onChangeIsShowingListManager,
        unarchivedLists,
    } = planner;

    const {
        effectiveRelativeCardSizingEnabled,
        isCardSizingTransitioning,
        isShowingListManager,
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
            <Trash appActions={appActions} appData={appData} />
            <FlexBox align="stretch" style={{ height: '100dvh' }}>
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

                <PrimaryAppColumn
                    style={{
                        width: isShowingListManager
                            ? columnWidths.listManager
                            : columnWidths.taskDetails,
                    }}
                >
                    <ToolBar>
                        <ToggleButton
                            isActive={isShowingListManager}
                            title={COPY.TIPS.TOGGLE_LIST_MANAGER}
                            onClick={() =>
                                onChangeIsShowingListManager(
                                    !isShowingListManager
                                )
                            }
                        >
                            {isShowingListManager ? (
                                <FlexBox spacing={0.25}>
                                    {ICONS.TASK_DETAILS}
                                    <span>{COPY.LABEL_FOR_TASK_DETAILS}</span>
                                </FlexBox>
                            ) : (
                                <FlexBox spacing={0.25}>
                                    {ICONS.LIST_MANAGER}
                                    <span>{COPY.LABEL_FOR_LIST_MANAGER}</span>
                                </FlexBox>
                            )}
                        </ToggleButton>
                    </ToolBar>
                    <Transition
                        isTransitioning={isTransitioning}
                        style={{ height: '100%' }}
                    >
                        {isShowingTrashContents ? (
                            <TrashedLists
                                appActions={appActions}
                                appData={appData}
                            />
                        ) : isShowingListManager ? (
                            <ListManager
                                isCreatingList={appData.isCreatingList}
                                lists={unarchivedLists}
                                onChangeIsShowingListManager={
                                    onChangeIsShowingListManager
                                }
                                onCreateList={appActions.onCreateList}
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
                        ) : (
                            <TaskDetails
                                appActions={appActions}
                                appData={appData}
                            />
                        )}
                    </Transition>
                </PrimaryAppColumn>

                <Timeline
                    appActions={appActions}
                    appData={appData}
                    headerActions={
                        <OptionsMenu
                            appActions={appActions}
                            appData={appData}
                        />
                    }
                    selectedTaskId={selectedTaskId}
                    from={TIMELINE_FROM}
                    style={{
                        width: columnWidths.timeline,
                    }}
                    to={TIMELINE_TO}
                />
            </FlexBox>
        </main>
    );
};

export default PlannerLayout;
