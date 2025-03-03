/*
 * This file is part of Cockpit.
 *
 * Copyright (C) 2017 Red Hat, Inc.
 *
 * Cockpit is free software; you can redistribute it and/or modify it
 * under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation; either version 2.1 of the License, or
 * (at your option) any later version.
 *
 * Cockpit is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with Cockpit; If not, see <http://www.gnu.org/licenses/>.
 */

import React, { useEffect } from 'react';
import { PageSection, PageSectionVariants } from "@patternfly/react-core/dist/esm/components/Page/index.js";
import { Button } from '@patternfly/react-core';

import { ListingTable } from 'cockpit-components-table.jsx';
import { install_dialog } from "cockpit-components-install-dialog.jsx";

import cockpit from 'cockpit';
import * as PK from "packagekit.js";
import { InstallPackage, useInstalled } from './state';
import { EmptyStatePanel } from 'cockpit-components-empty-state';

const _ = cockpit.gettext;

type ReInstallPkg = InstallPackage & { isInstalled: boolean };

export const Install = ({ searchVal }: { searchVal: string }) => {
    const { installed } = useInstalled();
    const [packages, setPackages] = React.useState<Record<string, ReInstallPkg>>({});
    const [pacakgesLoading, setPackagesLoadng] = React.useState(false);

    useEffect(() => {
        if (pacakgesLoading)
            return;

        const search = searchVal.trim();
        if (search.length === 0) {
            setPackages({});
            return;
        };

        const foundPackages: Record<string, ReInstallPkg> = {};

        setPackagesLoadng(true);
        PK.cancellableTransaction("SearchNames", [0, [search]], null/* () => console.log("state change") */, {
            Package: (info: typeof PK.Enum, packageId: string, summary: string) => {
                const fields = packageId.split(";");
                foundPackages[packageId] = {
                    name: fields[0],
                    version: fields[1],
                    severity: info,
                    arch: fields[2],
                    summary,
                    id: packageId,
                    isInstalled: !!installed[packageId]
                };
                // console.log(info); console.log(packageId); console.log(summary);
            },
        })
            .then(() => {
                setPackages(foundPackages);
            })
            .catch(ex => {
                console.log(ex);
            }).finally(() => setPackagesLoadng(false));
    }, [searchVal, setPackages]);

    if (pacakgesLoading) {
        return <EmptyStatePanel loading />;
    }

    return (
        <PageSection variant={PageSectionVariants.light} className="install-pkg">
            <ListingTable aria-label={_("Found packages")}
                gridBreakPoint='grid-lg'
                columns={[
                    { title: _("Name") },
                    { title: _("Version") },
                    { title: _("Details") },
                ]}
                rows={Object.keys(packages).map(key => {
                    const pkg = packages[key];
                    return {
                        columns: [
                            { title: pkg.name },
                            { title: pkg.version },
                            { title: pkg.summary.split("\n")[0] },
                            {
                                title: <Button onClick={async () => {
                                    await install_dialog(pkg.name)
                                }}>
                                    {pkg.isInstalled ? _("Reinstall") : _("Install")}
                                </Button>
                            },
                        ]
                    }
                })}
            />
        </PageSection>
    );
};
