import { PackageKit } from "./packagekit";

export type Package = {
    id: string,
    name: string,
    version: string,
    summary: string,
    // details: string,
    // arch: string,
}

// TODO: introduce "onProgress" callbacks
export interface Backend {
    getInstalled(): Promise<Package[]>;
    searchPackages(pkgName: string): Promise<Package[]>;
    getMissingDependencies(pkgName: string): Promise<string[]>;
    installPackages(pkgs: string[]): Promise<void>;
    unInstallPackages(pkgs: string[]): Promise<void>;
}

let backend: Backend | null = null;
export const getBackend = (): Backend => {
    // TODO: actually check what backend should be used
    if (!backend) {
        backend = new PackageKit();
    }

    return backend;
};
