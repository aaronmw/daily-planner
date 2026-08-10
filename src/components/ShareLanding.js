'use client';

import React, { useEffect, useState } from 'react';
import App from '../App';

const ShareLanding = ({ listId }) => {
    const [continueInBrowser, setContinueInBrowser] = useState(false);
    const [desktopUrl, setDesktopUrl] = useState('#');

    useEffect(() => {
        const url = new URL(
            `daily-planner://share/${encodeURIComponent(listId)}`
        );
        url.hash = window.location.hash;
        setDesktopUrl(url.toString());
    }, [listId]);

    if (continueInBrowser) return <App />;

    return (
        <main className="planner-share-landing">
            <div className="planner-share-landing-surface">
                <h1>Daily Planner</h1>
                <p>
                    You received an encrypted list invitation. Its key stays in
                    this link and will only be used after you choose where to
                    open it.
                </p>
                <a className="planner-share-landing-primary" href={desktopUrl}>
                    Open Daily Planner
                </a>
                <button
                    type="button"
                    onClick={() => setContinueInBrowser(true)}
                >
                    Continue in browser
                </button>
            </div>
        </main>
    );
};

export default ShareLanding;
