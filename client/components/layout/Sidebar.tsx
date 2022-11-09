import * as React from 'react';
import { NavLink } from 'react-router-dom';

export default class extends React.Component<{}, {}> {
  render() {
    return (
      <div id="sidebar">
        <ul className="sidebar-nav">
          <li><NavLink className="sidebar-nav-link" activeClassName="bg-black" to="/clients">Clients</NavLink></li>
          <li><NavLink className="sidebar-nav-link" activeClassName="bg-black" to="/settings">Settings</NavLink></li>
        </ul>
      </div>
    );
  }
}
