import * as React from 'react';

export default class extends React.Component<{}, {}> {
  render() {
    return (
      <div id="navbar" className="p-4 flex justify-end">
        <div className="w-12 h-12 bg-grey-light rounded-full cursor-pointer"></div>
      </div>
    );
  }
}
