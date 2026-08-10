import { useEffect } from 'react';
import { acquireDesktopIntegration } from '../platform/desktopIntegration';

export default function useDesktopIntegration(shortcuts, onCommand) {
    useEffect(
        () => acquireDesktopIntegration(shortcuts, onCommand),
        [onCommand, shortcuts]
    );
}
