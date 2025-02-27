import React, { useEffect } from 'react';
import { Tooltip, Page, PageSection, Flex, SearchInput, FlexItem, PageSectionVariants, ToggleGroup, ToggleGroupItem } from '@patternfly/react-core';

import { Install } from './install';
import { Remove } from './remove';
import { WithDialogs } from 'dialogs';

import cockpit from 'cockpit';
import { InstalledStore } from './state';

const _ = cockpit.gettext;

const ApplicationInner: React.FunctionComponent = () => {
  const [method, setMethod] = React.useState<string>("uninstall");
  const [searchVal, setSearchVal] = React.useState<string>("");
  const [searchBufferedVal, setSearchBufferedVal] = React.useState<string>("");

  // Reset search term whenever method is changed
  useEffect(() => {
    setSearchVal('');
  }, [method, setSearchVal]);

  useEffect(() => {
      // TODO: display search progress indicator
      const timeout = setTimeout(() => setSearchVal(searchBufferedVal), 500);
      return () => {
          return clearTimeout(timeout);
      }
  });

  return (
    <WithDialogs>
      <Page>
          <PageSection variant={PageSectionVariants.light} type="nav" className="pkg-management-header">
              <Flex>
                  <SearchInput
                      className="pkg-management-search"
                      placeholder="Find by name"
                      value={searchVal}
                      onChange={(_event, value) => { setSearchBufferedVal(value)}}
                      onSearch={(_event, value) => { setSearchVal(value)}}
                      onClear={() => setSearchVal('')}
                  />
                  <FlexItem align={{ default: 'alignRight' }}>
                      {<ToggleGroup>
                          <ToggleGroupItem isSelected={method == "uninstall"}
                                                                                    buttonId="uninstall"
                                                                                    text={_("Uninstall")}
                                                                                    onChange={() => setMethod("uninstall")} />
                          <ToggleGroupItem isSelected={method == "install"}
                                                                                      buttonId="install"
                                                                                      text={_("Install")}
                                                                                      onChange={() => setMethod("install")} />
                        </ToggleGroup>}
                  </FlexItem>
              </Flex>
          </PageSection>
          {method == "uninstall" ? <Remove searchVal={searchVal}/> : <Install searchVal={searchVal}/>}
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
}
