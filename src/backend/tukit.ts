import { Backend, MissingPackages, Package, ProgressCB } from "./backend";
import { PackageKit } from "./packagekit";
import cockpit from "cockpit";

export class Tukit implements Backend {
    packagekit: PackageKit;

    constructor() {
        this.packagekit = new PackageKit();
    }

    getInstalled(cb: ProgressCB): Promise<Package[]> {
        return this.packagekit.getInstalled(cb);
    }

    searchPackages(pkgName: string, cb: ProgressCB): Promise<Package[]> {
        return this.packagekit.searchPackages(pkgName, cb);
    }

    getMissingDependencies(pkg: Package): Promise<MissingPackages> {
        return this.packagekit.getMissingDependencies(pkg);
    }

    async installPackages(pkgs: MissingPackages): Promise<void> {
        const cmd = ["transactional-update", "--non-interactive", "pkg", "install", pkgs.pkg.name];
        await cockpit.spawn(cmd, {
            superuser: "require",
            err: "message",
        });
    }

    async unInstallPackage(pkg: Package): Promise<void> {
        const cmd = ["transactional-update", "--non-interactive", "pkg", "remove", pkg.name];
        await cockpit.spawn(cmd, {
            superuser: "require",
            err: "message",
        });
    }
}
