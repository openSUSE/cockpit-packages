import React from 'react';
import { Alert, Button, Modal, ModalBody, ModalFooter, ModalHeader } from '@patternfly/react-core';

import cockpit from 'cockpit';
import { useDialogs } from "dialogs.jsx";
import { Package } from './backend/backend';

const _ = cockpit.gettext;

const PackageDialog = ({
    pkg,
    title,
    header,
    error,
    loading,
    onOk,
    children,
}: {
    pkg: Package;
    title: string,
    header: string,
    loading: boolean,
    error: string | null,
    onOk: () => void;
    children?: React.ReactNode,
}) => {
    const Dialogs = useDialogs();

    return (
        <Modal
            title={title}
            isOpen
            onClose={() => Dialogs.close()}
            className='pf-v6-c-modal-box pf-m-align-top pf-m-md'
        >
            <ModalHeader>
                {
                    error
                        ? <Alert variant="danger" isInline title={error} />
                        : (
                            <>
                                <p>{header}</p>
                                <p>{pkg.name}</p>
                            </>
                        )
                }
            </ModalHeader>
            {children &&
                <ModalBody>
                    {children}
                </ModalBody>}
            <ModalFooter>
                <Button
                    variant="primary"
                    onClick={() => onOk()}
                    isLoading={loading}
                    isDisabled={!!error || loading}
                >
                    {_("OK")}
                </Button>
                <Button
                    variant="secondary"
                    onClick={() => Dialogs.close()}
                    isDisabled={loading}
                >
                    {_("Cancel")}
                </Button>
            </ModalFooter>
        </Modal>
    );
};

export default PackageDialog;
