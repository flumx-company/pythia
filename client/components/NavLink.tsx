import React from 'react';
import { NavLink, NavLinkProps } from 'react-router-dom';

interface ExtendedNavLinkProps extends NavLinkProps {
  activeStyleName?: string;
}

export default ({ ...props }: ExtendedNavLinkProps) => (
  <NavLink {...props}>{props.children}</NavLink>
);
