import { PackageKit } from "./packagekit";

export type Package = {
    id: string,
    name: string,
    version: string,
    summary: string,
    // details: string,
    // arch: string,
}

export interface ProgressState {
    done?: boolean,
    loading?: boolean,
    // Waiting for backend to get access package manager's lock
    locked?: boolean,
}

export type ProgressCB = (cb: ProgressState) => void;

export interface Backend {
    getInstalled(cb: ProgressCB): Promise<Package[]>;
    searchPackages(pkgName: string, cb: ProgressCB): Promise<Package[]>;
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
