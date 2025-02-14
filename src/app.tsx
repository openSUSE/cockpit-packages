import React from 'react';
import { Tabs, Tab, TabTitleText, Checkbox, Tooltip } from '@patternfly/react-core';

import { Install } from './install';
import { Remove } from './remove';
import { WithDialogs } from 'dialogs';

export const Application: React.FunctionComponent = () => {
  const [activeTabKey, setActiveTabKey] = React.useState<string | number>(0);
  const [isBox, setIsBox] = React.useState<boolean>(false);
  // Toggle currently active tab
  const handleTabClick = (
    event: React.MouseEvent<any> | React.KeyboardEvent | MouseEvent,
    tabIndex: string | number
  ) => {
    setActiveTabKey(tabIndex);
  };

  const toggleBox = (checked: boolean) => {
    setIsBox(checked);
  };

  const tooltip = (
    <Tooltip content="Aria-disabled tabs are like disabled tabs, but focusable. Allows for tooltip support." />
  );
  return (
    <WithDialogs>
      <div>
        <Tabs
          activeKey={activeTabKey}
          onSelect={handleTabClick}
          isBox={isBox}
          aria-label="Tabs in the default example"
          role="region"
        >
          <Tab eventKey={0} title={<TabTitleText>Uninstall</TabTitleText>} aria-label="Default tab">
            <Remove />
          </Tab>
          <Tab eventKey={1} title={<TabTitleText>Install</TabTitleText>}>
            <Install />
          </Tab>
        </Tabs>
      </div>
    </WithDialogs>
  );
};
