import React from 'react';
import { hot } from 'react-hot-loader';
import Corner from '@/components/layout/Corner';
import Navbar from '@/components/layout/Navbar';
import Sidebar from '@/components/layout/Sidebar';
import Main from '@/components/layout/Main';

const App = () => (
  <div>
    <div id="app">
      <Corner />
      <Navbar />
      <Sidebar />
      <Main />
    </div>
    <div id="modals"></div>
  </div>
);

export default hot(module)(App);
