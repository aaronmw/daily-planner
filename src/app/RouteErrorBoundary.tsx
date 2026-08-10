import { isRouteErrorResponse, useRouteError } from 'react-router-dom';

const describeError = (error: unknown): string => {
    if (isRouteErrorResponse(error)) {
        return `${error.status} ${error.statusText}`.trim();
    }
    if (error instanceof Error) return error.message;
    return 'Daily Planner encountered an unexpected error.';
};

export function RouteErrorBoundary() {
    const error = useRouteError();

    return (
        <main className="grid min-h-dvh place-items-center bg-planner-background p-6 text-planner-text font-planner">
            <section className="w-full max-w-xl border-[length:var(--planner-stroke-width)] border-planner-border">
                <h1 className="border-b-[length:var(--planner-stroke-width)] border-planner-border p-4 text-[1.25rem] font-bold">
                    Daily Planner could not open
                </h1>
                <p className="p-4 leading-[1.6]">{describeError(error)}</p>
                <button
                    className="h-[45px] w-full border-t-[length:var(--planner-stroke-width)] border-planner-border px-4 text-left font-semibold transition-colors hover:bg-planner-shaded"
                    onClick={() => window.location.reload()}
                    type="button"
                >
                    Reload Daily Planner
                </button>
            </section>
        </main>
    );
}
