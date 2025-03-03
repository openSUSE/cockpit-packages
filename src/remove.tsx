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
import { Alert, Button, Modal } from '@patternfly/react-core';

import { ListingTable } from 'cockpit-components-table.jsx';
import { EmptyStatePanel } from "cockpit-components-empty-state";

import cockpit from 'cockpit';
import * as PK from "packagekit.js";
import { useDialogs } from "dialogs.jsx";
import { useInstalled } from './state';

const _ = cockpit.gettext;

export type InstallPackage = {
    name: string,
    version: string,
    severity: typeof PK.Enum,
    arch: string,
    summary: string,
    id: string,
}

const RemoveDialog = ({ pkg, onUnInstalled }: { pkg: InstallPackage, onUnInstalled: () => void }) => {
    const Dialogs = useDialogs();
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    const uninstallPkg = () => {
        setLoading(true);

        PK.cancellableTransaction("RemovePackages", [0, [pkg.id], true, false], null/* (pevent: unknown) => console.log(pevent) */, {
            Package: (info: typeof PK.Enum, packageId: string, summary: string) => {
            },
        })
            .then(() => {
                onUnInstalled();
                Dialogs.close();
            })
            .catch(ex => {
                if (ex.message) {
                    setError(ex.message);
                    setLoading(false);
                }

                console.error(ex);
            });
    }

    return (
        <Modal
            title={_("Confirm uninstallation")}
            isOpen
            onClose={() => Dialogs.close()}
            className='pf-v5-c-modal-box pf-m-align-top pf-m-md'
            footer={
                <>
                    <Button
                        variant="primary"
                        onClick={() => uninstallPkg()}
                        isLoading={loading}
                        isDisabled={!!error}
                    >
                        {_("Ok")}
                    </Button>
                    <Button
                        variant="secondary"
                        onClick={() => Dialogs.close()}
                        isDisabled={loading}
                    >
                        {_("Cancel")}
                    </Button>
                </>
            }
        >
            {error
                ? <Alert variant="danger" isInline title={error} />
                :
                <>
                    <p>{_("Uninstalling the following package:")}</p>
                    <p>{pkg.name}</p>
                </>
            }
        </Modal>
    );
}

export const Remove = ({ searchVal }: { searchVal: string }) => {
    const Dialogs = useDialogs();
    const {installed, loading, refreshInstalled} = useInstalled();
    const [filteredPackages, setFilteredPackages] = React.useState<Record<string, InstallPackage>>({});

    useEffect(() => {
        if (loading)
            return;
        // TODO: only trigger search every 100 ms (or so) in order to make the
        //       input feel more responsive
        const search = searchVal.trim().toLocaleLowerCase();
        if (search.length === 0) {
            setFilteredPackages(installed);
            return;
        };

        // TODO: set state that blocks searching while search is already on
        const foundPackages: Record<string, InstallPackage> = {};
        for (const key of Object.keys(installed)) {
            if (key.toLocaleLowerCase().includes(search)) {
                foundPackages[key] = installed[key];
            }
        }
        setFilteredPackages(foundPackages);
    }, [searchVal, setFilteredPackages, loading]);

    if (loading) {
        return <EmptyStatePanel loading />;
    }

    return (
        <PageSection variant={PageSectionVariants.light} className="uninstall-pkg">
            <ListingTable aria-label={_("Installed packages")}
                gridBreakPoint='grid-lg'
                columns={[
                    { title: _("Name") },
                    { title: _("Version") },
                    { title: _("Details") },
                ]}
                rows={Object.keys(filteredPackages).map(key => {
                    const pkg = filteredPackages[key];
                    return {
                        columns: [
                            { title: pkg.name },
                            { title: pkg.version },
                            { title: pkg.summary.split("\n")[0] },
                            {
                                title: <Button onClick={() => Dialogs.show(
                                    <RemoveDialog
                                        pkg={pkg}
                                        onUnInstalled={() => refreshInstalled()}
                                    />
                                )}>
                                    {_("Uninstall")}
                                </Button>
                            },
                        ]
                    }
                })}
            />
        </PageSection>
    );
};
