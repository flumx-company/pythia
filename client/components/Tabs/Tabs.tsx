import React from 'react';
import classNames from 'classnames';

import '@/components/Tabs/Tabs.pcss';

import { TabsProps } from '@/components/Tabs/Tabs.d';
import NavLink from '@/components/NavLink';

const Tabs: React.SFC<TabsProps> = ({ items }) => {
  const oddEvent = (href: string) => (match: any, location: any) => href === location.pathname;

  return (
    <div className="mb-6">
      <ul styleName="list">
        {items.map(tab => {
          return (
            <li key={tab.title} styleName="tab-item">
              <NavLink
                isActive={oddEvent(tab.href)}
                styleName={classNames('tab-link', {
                  disabled: tab.disabled,
                })}
                activeStyleName="active"
                to={tab.href}
              >
                {tab.title}
              </NavLink>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default Tabs;
