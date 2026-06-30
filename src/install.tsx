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
import { Button, ModalBody } from '@patternfly/react-core';

import { ListingTable } from 'cockpit-components-table.jsx';

import cockpit from 'cockpit';
import { useInstalled } from './state';
import { EmptyStatePanel } from 'cockpit-components-empty-state';
import { getBackend, MissingPackages, Package } from './backend/backend';
import { useDialogs } from 'dialogs';
import PackageDialog from './package_dialog';

const _ = cockpit.gettext;

type ReInstallPkg = Package & { isInstalled: boolean };

const InstallDialogExtras = ({
    loading,
    additional,
}: {
    loading: boolean,
    additional: MissingPackages | null,
}) => {
    if (loading || !additional) {
        return <EmptyStatePanel loading />;
    }

    if (additional.extras.length === 0) {
        return null;
    }

    return (
        <ModalBody>
            <div>
                <p>{_("Additional packages:")}</p>
                <br />
                <ul>{additional.extras.map(id => <li key={id}>{id}</li>)}</ul>
            </div>
        </ModalBody>
    );
};

const InstallDialog = ({ pkg }: { pkg: Package }) => {
    // TODO: loading and error indicatiors
    const Dialogs = useDialogs();
    const [additional, setAddional] = React.useState<MissingPackages | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [installing, setInstalling] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    useEffect(() => {
        (async () => {
            setLoading(true);
            (await getBackend()).getMissingDependencies(pkg).then((pkgs) => {
                setAddional(pkgs);
            }).catch(ex => {
                if (ex.message) {
                    setError(ex.message);
                }

                console.error(ex);
            }).finally(() => setLoading(false));
        })();
    }, []);

    const installPkg = useCallback(async () => {
        if (!loading && additional) {
            setInstalling(true);
            (await getBackend()).installPackages(
                additional
            ).then(() => {
                Dialogs.close();
            }).catch(ex => {
                if (ex.message) {
                    setError(ex.message);
                }

                console.error(ex);
            }).finally(() => setInstalling(false));
        }
    }, [additional]);

    return (
        <PackageDialog
            pkg={pkg}
            onOk={() => installPkg()}
            error={error}
            title={_("Confirm installation")}
            header={_("Installing the following package:")}
            loading={loading || installing}
        >
            <InstallDialogExtras loading={loading} additional={additional} />
        </PackageDialog>
    );
};

export const Install = ({ searchVal }: { searchVal: string }) => {
    const Dialogs = useDialogs();
    const { installed } = useInstalled();
    const [packages, setPackages] = React.useState<Record<string, ReInstallPkg>>({});
    const [pacakgesLoading, setPackagesLoadng] = React.useState(false);

    const searchPackages = async (search: string) => {
        const foundPackages: Record<string, ReInstallPkg> = {};

        setPackagesLoadng(true);
        (await getBackend()).searchPackages(
            search,
            // TODO:
            () => { },
        ).then((pkgs) => {
            for (const pkg of pkgs) {
                // TODO: return the installed information from backend so we don't need to do these copies
                foundPackages[pkg.id] = { ...pkg, isInstalled: !!installed[pkg.id] };
            }
            setPackages(foundPackages);
        }).catch(ex => {
            console.log(ex);
        }).finally(() => setPackagesLoadng(false));
    };

    useEffect(() => {
        if (pacakgesLoading)
            return;

        const search = searchVal.trim();
        if (search.length === 0) {
            setPackages({});
            return;
        }

        searchPackages(searchVal);
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
