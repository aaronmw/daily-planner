import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { App } from './app/App';
import { RouteErrorBoundary } from './app/RouteErrorBoundary';
import { plannerDatabase } from './platform/persistence/database';
import { prepareHostedOrigin } from './platform/migration/prepareHostedOrigin';
import { isDesktopRuntime } from './platform/runtime/platformAdapter';
import './styles/index.css';

declare global {
    interface Window {
        __DAILY_PLANNER_HOSTED_SHELL__?: {
            fail(message: string): void;
            ready(): void;
        };
    }
}

const rootElement = document.getElementById('root');

if (!rootElement) {
    throw new Error('Daily Planner could not find its root element.');
}

const showMigrationFailure = (error: unknown): void => {
    const message =
        error instanceof Error
            ? error.message
            : 'Encrypted local data could not be migrated.';
    if (window.__DAILY_PLANNER_HOSTED_SHELL__) {
        window.__DAILY_PLANNER_HOSTED_SHELL__.fail(message);
        return;
    }
    createRoot(rootElement).render(
        <main role="alert">
            <h1>Daily Planner could not open safely</h1>
            <p>{message}</p>
            <p>Your existing local data has not been deleted or reset.</p>
        </main>
    );
};

const start = async (): Promise<void> => {
    try {
        const desktop = isDesktopRuntime();
        const invoke = desktop
            ? (await import('@tauri-apps/api/core')).invoke
            : () => Promise.resolve(undefined);
        await prepareHostedOrigin({
            database: plannerDatabase,
            invoke,
            isDesktop: desktop,
            location: new URL(window.location.href),
            storage: localStorage,
        });
        const router = createBrowserRouter(
            [
                {
                    element: <App />,
                    errorElement: <RouteErrorBoundary />,
                    path: '/',
                },
                {
                    element: <App />,
                    errorElement: <RouteErrorBoundary />,
                    path: '/share/:listId',
                },
            ],
            { basename: import.meta.env.BASE_URL }
        );
        createRoot(rootElement).render(
            <StrictMode>
                <RouterProvider router={router} />
            </StrictMode>
        );
        window.__DAILY_PLANNER_HOSTED_SHELL__?.ready();
    } catch (error) {
        showMigrationFailure(error);
    }
};

void start();
