import * as React from 'react';
import { Route } from 'react-router-dom';
import Clients from '@/views/Clients';
import Collection from '@/views/Collection/Collection';
import Login from '@/views/Login';

export default class extends React.Component<{}, {}> {
  render() {
    return (
      <div id="main" className="p-4">
        <Route exact={true} path="/clients" component={Clients} />
        <Route path="/clients/:clientId/collections/:discoveryCollectionId" component={Collection} />
        <Route exact={true} path="/login" component={Login} />
      </div>
    );
  }
}
