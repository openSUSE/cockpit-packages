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

import React, { useCallback, useEffect } from 'react';
import { PageSection, PageSectionVariants } from "@patternfly/react-core/dist/esm/components/Page/index.js";
import { Button, Modal, ModalBody, ModalFooter, ModalHeader } from '@patternfly/react-core';

import { ListingTable } from 'cockpit-components-table.jsx';

import cockpit from 'cockpit';
import { useInstalled } from './state';
import { EmptyStatePanel } from 'cockpit-components-empty-state';
import { getBackend, Package } from './backend/backend';
import { useDialogs } from 'dialogs';

const _ = cockpit.gettext;

type ReInstallPkg = Package & { isInstalled: boolean };

const InstallDialog = ({ pkg }: { pkg: Package }) => {
    // TODO: loading and error indicatiors
    const Dialogs = useDialogs();
    const [additional, setAddional] = React.useState<string[] | null>(null);

    useEffect(() => {
        getBackend().getMissingDependencies(pkg.name).then((pkgs) => {
            setAddional(pkgs);
        });
    }, []);

    const installPkg = useCallback(async () => {
        console.log("installing", pkg);
        if (additional) {
            await getBackend().installPackages(additional);
        }
        Dialogs.close();
    }, [additional]);

    return (
        <Modal
            title={_("Confirm uninstallation")}
            isOpen
            onClose={() => Dialogs.close()}
            className='pf-v6-c-modal-box pf-m-align-top pf-m-md'
        >
            <ModalHeader>
                <>
                    <p>{_("Installing the following package:")}</p>
                    <p>{pkg.name}</p>
                </>
            </ModalHeader>
            {additional &&
            <ModalBody>
                <div>
                    {_("Additional packages:")}
                    <ul>{additional.map(id => <li key={id}>{id}</li>)}</ul>
                </div>
            </ModalBody>}
            <ModalFooter>
                <Button
                    variant="primary"
                    onClick={() => installPkg()}
                >
                    {_("Install")}
                </Button>
                <Button
                    variant="secondary"
                    onClick={() => Dialogs.close()}
                >
                    {_("Cancel")}
                </Button>
            </ModalFooter>
        </Modal>
    );
};

export const Install = ({ searchVal }: { searchVal: string }) => {
    const Dialogs = useDialogs();
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
        }

        const foundPackages: Record<string, ReInstallPkg> = {};

        setPackagesLoadng(true);
        getBackend().searchPackages(
            search
        ).then((pkgs) => {
            for (const pkg of pkgs) {
                // TODO: return the installed information from backend so we don't need to do these copies
                foundPackages[pkg.id] = { ...pkg, isInstalled: !!installed[pkg.id] };
            }
            setPackages(foundPackages);
        }).catch(ex => {
            console.log(ex);
        }).finally(() => setPackagesLoadng(false));
    }, [searchVal, setPackages]);

    if (pacakgesLoading) {
        return <EmptyStatePanel loading />;
    }

    return (
        <PageSection variant={PageSectionVariants.default} className="install-pkg">
            <ListingTable
                aria-label={_("Found packages")}
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
                                title: (
                                    <Button onClick={() => {
                                        Dialogs.show(<InstallDialog pkg={pkg} />);
                                    }}
                                    >
                                        {pkg.isInstalled ? _("Reinstall") : _("Install")}
                                    </Button>
                                )
                            },
                        ]
                    };
                })}
            />
        </PageSection>
    );
};
