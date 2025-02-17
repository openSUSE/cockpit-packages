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
import { Button, Modal } from '@patternfly/react-core';

import { ListingTable } from 'cockpit-components-table.jsx';

import cockpit from 'cockpit';
import * as PK from "packagekit.js";
import { useDialogs } from "dialogs.jsx";

import { show_modal_dialog } from "cockpit-components-dialog.jsx";


const _ = cockpit.gettext;

/**
 * function mimicing the behavior of Cockpit's `install_dialog function
 */
const removeDialog = () => {
    const body = {
        id: "dialog",
        title: "body title",
        body: (
            <div className="scroll">
                <p>body body</p>
            </div>
        ),
        static_error: null
    };

    const footer = {
        actions: [
            {
                caption: _("Remove"),
                style: "primary",
                clicked: () => console.log("footer clicked!"),
                disabled: false
            }
        ],
        idle_message: null,
        dialog_done: f => { /* if (!f && cancel) cancel(); done(f) */ console.log(f) }
    };

    show_modal_dialog(body, footer);
}

const MyDialog = () => {
    const Dialogs = useDialogs();
    return (
        <Modal title="My dialog"
            isOpen
            onClose={Dialogs.close}
            className='pf-v5-c-modal-box pf-m-align-top pf-m-md'
            >
            <p>Hello!</p>
        </Modal>);
}

export type InstallPackage = {
    name: string,
    version: string,
    severity: typeof PK.Enum,
    arch: string,
    summary: string,
    selected: boolean,
}

export const Remove = ({ searchVal }: { searchVal: string }) => {
    const Dialogs = useDialogs();
    const [allPackages, setAllPackages] = React.useState<Record<string, InstallPackage>>({});
    const [filteredPackages, setFilteredPackages] = React.useState<Record<string, InstallPackage>>({});

    useEffect(() => {
        // TODO: only trigger search every 100 ms (or so) in order to make the
        //       input feel more responsive
        console.log(searchVal);
        const search = searchVal.trim().toLocaleLowerCase();
        if (search.length === 0) {
            setFilteredPackages(allPackages);
            return;
        };

        // TODO: set state that blocks searching while search is already on
        const foundPackages: Record<string, InstallPackage> = {};
        for (const key of Object.keys(allPackages)) {
            if (key.toLocaleLowerCase().includes(search)) {
                foundPackages[key] = allPackages[key];
            }
        }
        setFilteredPackages(foundPackages);
    }, [searchVal, setFilteredPackages]);

    const uninstallPkg = (pkg: string) => {

        PK.cancellableTransaction("RemovePackages", [0, [pkg], true, false], (pevent: unknown) => console.log(pevent), {
            Package: (info: typeof PK.Enum, packageId: string, summary: string) => {
                console.log("package");
                console.log(info); console.log(packageId); console.log(summary);
            },
        })
            .then(transactionPath => {
                console.log(transactionPath);
                console.log("We are finished!!");
                /*      setAllPackages(foundPackages);
                     setFilteredPackages(foundPackages); */

                // TODO: refetch installed pacakges
            })
            .catch(ex => {
                console.log(ex);
            });
    }

    React.useEffect(() => {

        const foundPackages: Record<string, InstallPackage> = {};

        PK.cancellableTransaction("GetPackages", [PK.Enum.FILTER_INSTALLED], () => console.log("state change"), {
            Package: (info: typeof PK.Enum, packageId: string, summary: string) => {
                const fields = packageId.split(";");
                foundPackages[packageId] = { name: fields[0], version: fields[1], severity: info, arch: fields[2], selected: false, summary };
                // console.log(info); console.log(packageId); console.log(summary);
            },
        })
            .then(transactionPath => {
                console.log(transactionPath);
                console.log("We are finished!!");
                setAllPackages(foundPackages);
                setFilteredPackages(foundPackages);
            })
            .catch(ex => {
                console.log(ex);
            });

    }, []);

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
                              title: <Button onClick={() => /* uninstallPkg(key) */ /* removeDialog() */Dialogs.show(<MyDialog />)}>
                                  Uninstall
                              </Button>
                          },
                      ]
                  }
              })}
          />
      </PageSection>
    );
};
