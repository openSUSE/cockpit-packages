import * as PK from "packagekit.js";
import { Backend, Package } from "./backend";
// import { getPackageManager } from "packagemanager";
import { PackageKitManager } from "_internal/packagekit";
import { TransactionError } from "packagekit";

// PackageKit error sometimes caused when zypper is used by another program.
// Often happens when cockpit-tukit calls zypper, which takes the zypper lock.
const PK_ERROR_ENUM_FAILED_INITIALIZATION = 22;

const sleep = (ms: number) => {
    return new Promise(resolve => setTimeout(resolve, ms));
};

const tryWaitZyppLock = async (cb: () => Promise<void>) => {
    const maxCount = 5;
    for (let count = 1; count <= maxCount; count++) {
        try {
            await cb();
            return Promise.resolve();
        } catch (e) {
            const ex = e as Error;
            if (ex instanceof TransactionError) {
                // XXX: might be worth it to check if the error details contain "zypper"
                if (count < maxCount && ex.code === PK_ERROR_ENUM_FAILED_INITIALIZATION) {
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
    getInstalled(): Promise<Package[]> {
        return new Promise((resolve, reject) => {
            const installed: Package[] = [];
            tryWaitZyppLock(() =>
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
                resolve(installed);
            }).catch(ex => {
                console.log(ex);
                reject(ex);
            });
        });
    }

    searchPackages(pkgName: string): Promise<Package[]> {
        return new Promise((resolve, reject) => {
            const found: Package[] = [];
            tryWaitZyppLock(() =>
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
                resolve(found);
            }).catch(ex => {
                console.log(ex);
                reject(ex);
            });
        });
    }

    async getMissingDependencies(pkgName: string): Promise<string[]> {
        const pkManager = new PackageKitManager();
        const missing = await pkManager.check_missing_packages([pkgName]);
        // TODO: proper type for this
        // return missing.missing_names;
        return missing.missing_ids;
    }

    async installPackages(pkgs: string[]): Promise<void> {
        await PK.cancellableTransaction("InstallPackages", [0, pkgs]);
    }

    async unInstallPackages(pkgs: string[]): Promise<void> {
        await PK.cancellableTransaction("RemovePackages", [0, pkgs, true, false]);
    }
}
