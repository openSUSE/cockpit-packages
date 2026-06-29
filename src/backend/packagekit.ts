import * as PK from "packagekit.js";
import { Backend, MissingPackages, Package, ProgressCB, ProgressState } from "./backend";
// import { getPackageManager } from "packagemanager";
import { PackageKitManager } from "_internal/packagekit";
import { TransactionError } from "packagekit";

// PackageKit error sometimes caused when zypper is used by another program.
// Often happens when cockpit-tukit calls zypper, which takes the zypper lock.
const PK_ERROR_ENUM_FAILED_INITIALIZATION = 22;

class PackageKitState {
    cb: ProgressCB;
    state: ProgressState;

    constructor(cb: ProgressCB) {
        this.cb = cb;
        this.state = { loading: true };
    }

    sendUpdate() {
        this.cb(this.state);
    }

    setLocked() {
        if (!this.state.locked) {
            this.state.locked = true;
            this.sendUpdate();
        }
    }

    setUnlocked() {
        if (this.state.locked) {
            this.state.locked = false;
            this.sendUpdate();
        }
    }

    done() {
        this.state = { done: true };
        this.sendUpdate();
    }
}

const sleep = (ms: number) => {
    return new Promise(resolve => setTimeout(resolve, ms));
};

const tryWaitZyppLock = async (state: PackageKitState, cb: () => Promise<void>) => {
    const maxCount = 5;
    for (let count = 1; count <= maxCount; count++) {
        try {
            await cb();
            state.setUnlocked();
            return Promise.resolve();
        } catch (e) {
            const ex = e as Error;
            if (ex instanceof TransactionError) {
                // XXX: might be worth it to check if the error details contain "zypper"
                if (count < maxCount && ex.code === PK_ERROR_ENUM_FAILED_INITIALIZATION) {
                    state.setLocked();
                    await sleep(10 * 1000);
                } else {
                    return Promise.reject(ex);
                }
            }
        }
    }

    Promise.reject(new Error("Unkown error happened while waiting for zypper lock"));
};

export class PackageKit implements Backend {
    getInstalled(cb: ProgressCB): Promise<Package[]> {
        const state = new PackageKitState(cb);
        return new Promise((resolve, reject) => {
            const installed: Package[] = [];
            tryWaitZyppLock(state, () =>
                PK.cancellableTransaction("GetPackages", [PK.Enum.FILTER_INSTALLED], null, {
                    Package: (info: typeof PK.Enum, packageId: string, summary: string) => {
                        const fields = packageId.split(";");
                        installed.push({
                            summary,
                            id: packageId,
                            name: fields[0],
                            version: fields[1],
                        });
                    },
                })
            ).then(() => {
                state.done();
                resolve(installed);
            }).catch(ex => {
                console.log(ex);
                reject(ex);
            });
        });
    }

    searchPackages(pkgName: string, cb: ProgressCB): Promise<Package[]> {
        return new Promise((resolve, reject) => {
            const found: Package[] = [];
            const state = new PackageKitState(cb);
            tryWaitZyppLock(state, () =>
                PK.cancellableTransaction("SearchNames", [0, [pkgName]], null, {
                    Package: (info: typeof PK.Enum, packageId: string, summary: string) => {
                        const fields = packageId.split(";");
                        found.push({
                            summary,
                            id: packageId,
                            name: fields[0],
                            version: fields[1],
                        });
                    },
                })
            ).then(() => {
                state.done();
                resolve(found);
            }).catch(ex => {
                console.log(ex);
                reject(ex);
            });
        });
    }

    async getMissingDependencies(pkg: Package): Promise<MissingPackages> {
        const pkManager = new PackageKitManager();
        const missing = await pkManager.check_missing_packages([pkg.name]);

        return {
            pkg,
            ids: missing.missing_ids,
            extras: missing.extra_names,
        };
    }

    async installPackages(pkgs: MissingPackages): Promise<void> {
        await PK.cancellableTransaction("InstallPackages", [0, pkgs.ids]);
    }

    async unInstallPackage(pkg: Package): Promise<void> {
        await PK.cancellableTransaction("RemovePackages", [0, [pkg.id], true, false]);
    }
}
