import {AppProvider, UserProvider} from '@realm/react';
import React from 'react';
import RealmWrapper from '../RealmWrapper/RealmWraper';

function AppWrapper(): JSX.Element {
  return (
    // IMPORTANT: ADD YOUR APP ID BELOW
    <RealmWrapper />
  );
}

export default AppWrapper;
