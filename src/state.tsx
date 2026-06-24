import React, { useEffect } from "react";

import { getBackend, Package } from "./backend/backend";

export interface InstalledState {
    installed: Record<string, Package>,
    loading: boolean,
    /* TODO: error */
    refreshInstalled: () => void,
}

export const InstalledContext = React.createContext({
    installed: {},
    loading: true,
    refreshInstalled: () => { },
});

export const InstalledStore: React.FC<{ children: React.ReactNode }> = props => {
    const [installed, setInstalled] = React.useState<Record<string, Package>>({});
    const [loading, setLoading] = React.useState(true);

    const refreshInstalled = () => {
        setLoading(true);
        const foundPackages: Record<string, Package> = {};
        getBackend().getInstalled()
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

    return <InstalledContext.Provider value={{ installed, refreshInstalled, loading }} {...props} />;
};

export const useInstalled = () => React.useContext(InstalledContext) as InstalledState;
