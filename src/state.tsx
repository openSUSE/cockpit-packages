import React, { useEffect } from "react";

import { getBackend, Package, ProgressState } from "./backend/backend";

export interface InstalledState {
    installed: Record<string, Package>,
    loading: boolean,
    backendState: ProgressState,
    /* TODO: error */
    refreshInstalled: () => void,
}

export const InstalledContext = React.createContext({
    installed: {},
    loading: true,
    backendState: {},
    refreshInstalled: () => { },
});

export const InstalledStore: React.FC<{ children: React.ReactNode }> = props => {
    const [installed, setInstalled] = React.useState<Record<string, Package>>({});
    const [loading, setLoading] = React.useState(true);
    const [backendState, setBackendState] = React.useState({});

    const refreshInstalled = () => {
        setLoading(true);
        const foundPackages: Record<string, Package> = {};
        getBackend().getInstalled((state) => setBackendState(state))
                        .then((packages) => {
                            for (const pkg of packages) {
                                foundPackages[pkg.id] = pkg;
                            }
                            setInstalled(foundPackages);
                        }).catch(ex => {
                            console.log(ex);
                        }).finally(() => setLoading(false));
    };

    useEffect(() => {
        refreshInstalled();
    }, []);

    return <InstalledContext.Provider value={{ installed, refreshInstalled, loading, backendState }} {...props} />;
};

export const useInstalled = () => React.useContext(InstalledContext) as InstalledState;
