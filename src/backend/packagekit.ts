import * as PK from "packagekit.js";
import { Backend, Package } from "./backend";
// import { getPackageManager } from "packagemanager";
import { PackageKitManager } from "_internal/packagekit";

export class PackageKit implements Backend {
    getInstalled(): Promise<Package[]> {
        return new Promise((resolve, reject) => {
            const installed: Package[] = [];
            // XXX: This doesn't work if tukitd is installed / running
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
            }).then(() => {
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
            }).then(() => {
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
