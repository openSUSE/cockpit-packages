import React, { useEffect } from "react";

import * as PK from "packagekit.js";

export type InstallPackage = {
    name: string,
    version: string,
    severity: typeof PK.Enum,
    arch: string,
    summary: string,
    id: string
}

export interface InstalledState {
    installed: Record<string, InstallPackage>,
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
    const [installed, setInstalled] = React.useState<Record<string, InstallPackage>>({});
    const [loading, setLoading] = React.useState(true);

    const refreshInstalled = () => {
        setLoading(true);
        const foundPackages: Record<string, InstallPackage> = {};

        PK.cancellableTransaction("GetPackages", [PK.Enum.FILTER_INSTALLED], null/* () => console.log("state change") */, {
            Package: (info: typeof PK.Enum, packageId: string, summary: string) => {
                const fields = packageId.split(";");
                foundPackages[packageId] = { name: fields[0], version: fields[1], severity: info, arch: fields[2], id: packageId, summary };
            },
        }).then(() => {
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
