import React, { SFC } from 'react';

const PageTitle: SFC = props => (
  <h2 className="page-title">{props.children}</h2>
);

export default PageTitle;
