import { PackageKit } from "./packagekit";
import cockpit from "cockpit";
import { Tukit } from "./tukit";

export type Package = {
    id: string,
    name: string,
    version: string,
    summary: string,
    // details: string,
    // arch: string,
}

export type MissingPackages = {
    // Original package that's used to search for deps
    pkg: Package,
    ids: string[],
    extras: string[],
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
    getMissingDependencies(pkg: Package): Promise<MissingPackages>;
    installPackages(pkgs: MissingPackages): Promise<void>;
    unInstallPackage(pkg: Package): Promise<void>;
}

const isTransactional = async () => {
    try {
        const fstype = await cockpit.spawn(["findmnt", "-no", "FSTYPE", "/"]);
        if (fstype.trim() === "btrfs") {
            const mount_options = await cockpit.spawn([
                "findmnt",
                "-no",
                "OPTIONS",
                "/",
            ]);
            if (mount_options.split(",").includes("ro")) {
                try {
                    await cockpit.spawn(["test", "-f", "/usr/sbin/transactional-update"]);
                    return true;
                } catch (error) {
                    console.log(error);
                    return false;
                }
            }
        }
        return false;
    } catch (error) {
        console.error(error);
        return false;
    }
};

let backend: Backend | null = null;
export const getBackend = async (): Promise<Backend> => {
    // TODO: actually check what backend should be used
    if (!backend) {
        if (await isTransactional()) {
            backend = new Tukit();
        } else {
            backend = new PackageKit();
        }
    }

    return backend;
};
