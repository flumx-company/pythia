import * as React from 'react';
import Logo from '@/icons/logo.svg';

export default class extends React.Component<{}, {}> {
  render() {
    return (
      <div
        id="logo"
        className="p-4 text-white uppercase text-center font-semibold flex items-center justify-center"
      >
        <Logo width={30} height={30} />
        <div className="ml-2">Pythia</div>
      </div>
    );
  }
}
