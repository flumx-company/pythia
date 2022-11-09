import React from 'react';

export default () => (
  <form className="max-w-md	m-auto">
    <div className="my-2">
      <label className="text-xs font-bold text-grey-darker">Select Environment</label>
      <div>
        <select className="border-b block w-full bg-transparent py-2 px-3">
          <option value="">Default</option>
        </select>
      </div>
    </div>

    <div className="my-2">
      <label className="text-xs font-bold text-grey-darker">Name</label>
      <div>
        <input className="border-b block w-full py-2 px-3" type="text" />
      </div>
    </div>

    <div className="my-2">
      <label className="text-xs font-bold text-grey-darker">Description</label>
      <div>
        <textarea className="border-b block w-full py-2 px-3"></textarea>
      </div>
    </div>

    <div className="mt-8 text-right">
      <button className="secondary button">Cancel</button>
      <button className="primary button">Create Collection</button>
    </div>
  </form>
);
