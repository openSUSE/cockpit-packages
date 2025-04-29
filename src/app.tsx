import React, { useEffect } from 'react';
import { Page, PageSection, Flex, SearchInput, FlexItem, PageSectionVariants, ToggleGroup, ToggleGroupItem, Stack, ContentVariants, Content } from '@patternfly/react-core';

import { Install } from './install';
import { Remove } from './remove';
import { WithDialogs } from 'dialogs';

import cockpit from 'cockpit';
import { superuser } from 'superuser';
import { InstalledStore } from './state';
import { EmptyStatePanel } from 'cockpit-components-empty-state';
import { ExclamationCircleIcon } from '@patternfly/react-icons';

const _ = cockpit.gettext;

const SearchBox = ({ onChange }: {onChange: (val: string) => void}) => {
    const [searchBufferedVal, setSearchBufferedVal] = React.useState<string>("");

    useEffect(() => {
        const timeout = setTimeout(() => onChange(searchBufferedVal), 500);
        return () => {
            return clearTimeout(timeout);
        };
    }, [searchBufferedVal]);

    return (
        <SearchInput
            className="pkg-management-search"
            placeholder="Find by name"
            value={searchBufferedVal}
            onChange={(_event, value) => { setSearchBufferedVal(value) }}
            onSearch={(_event, value) => { onChange(value) }}
            onClear={() => { onChange(""); setSearchBufferedVal("") }}
        />
    );
};

const AuthenticationError = () => {
    return (
        <Stack>
            <EmptyStatePanel
                title={ _("Authentication error") }
                icon={ ExclamationCircleIcon }
                paragraph={
                    <Content component={ContentVariants.p}>
                        {_("Administrative access is required.")}
                    </Content>
                }
            />
        </Stack>
    );
};

const ApplicationInner: React.FunctionComponent = () => {
    const [method, setMethod] = React.useState<string>("uninstall");
    const [searchVal, setSearchVal] = React.useState<string>("");
    const [authenticated, setAuthenticated] = React.useState(superuser.allowed);

    React.useEffect(() => {
    // cockpit doesn't provide type for addEventListener so it needs to be ignored
    // @ts-expect-error addEventListener method is not added to type definitions yet
        superuser.addEventListener("changed", () => { setAuthenticated(superuser.allowed) });
    }, []);

    if (!authenticated) {
        return <AuthenticationError />;
    }

    return (
        <WithDialogs>
            <Page>
                <PageSection variant={PageSectionVariants.light} type="nav" className="pkg-management-header">
                    <Flex>
                        <SearchBox onChange={setSearchVal} />
                        <FlexItem align={{ default: 'alignRight' }}>
                            <ToggleGroup>
                                <ToggleGroupItem
                                    isSelected={method === "uninstall"}
                                    buttonId="uninstall"
                                    text={_("Uninstall")}
                                    onChange={() => setMethod("uninstall")}
                                />
                                <ToggleGroupItem
                                    isSelected={method === "install"}
                                    buttonId="install"
                                    text={_("Install")}
                                    onChange={() => setMethod("install")}
                                />
                            </ToggleGroup>
                        </FlexItem>
                    </Flex>
                </PageSection>
                {method === "uninstall" ? <Remove searchVal={searchVal} /> : <Install searchVal={searchVal} />}
            </Page>
        </WithDialogs>
    );
};

export const Application = () => {
    return (
        <InstalledStore>
            <ApplicationInner />
        </InstalledStore>
    );
};
