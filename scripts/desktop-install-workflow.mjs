const runDesktopInstallWorkflow = ({
    wasRunning,
    verifySource,
    stopApp,
    installApp,
    registerApp,
    normalizeKeychain,
    commitInstall,
    rollbackInstall,
    relaunchApp,
}) => {
    verifySource();
    if (wasRunning) stopApp();

    let replacementInstalled = false;
    try {
        installApp();
        replacementInstalled = true;
        registerApp();
        normalizeKeychain();
        commitInstall();
    } catch (error) {
        const recoveryErrors = [];

        if (replacementInstalled) {
            try {
                rollbackInstall();
            } catch (rollbackError) {
                recoveryErrors.push(rollbackError);
            }

            try {
                registerApp();
            } catch (registrationError) {
                recoveryErrors.push(registrationError);
            }
        }

        if (wasRunning) {
            try {
                relaunchApp();
            } catch (relaunchError) {
                recoveryErrors.push(relaunchError);
            }
        }

        if (recoveryErrors.length > 0) {
            throw new AggregateError(
                [error, ...recoveryErrors],
                'Desktop installation failed and recovery was incomplete.'
            );
        }
        throw error;
    }

    if (wasRunning) relaunchApp();
};

export { runDesktopInstallWorkflow };
