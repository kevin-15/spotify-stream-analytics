import React from 'react';
import Body from './components/Body';
import SpotifyStreamContextProvider from './contexts/SpotifyStreamContext';

function App() {
  return (
    <div className="App">
      <SpotifyStreamContextProvider>
        <Body />
      </SpotifyStreamContextProvider>
    </div>
  );
}

export default App;
