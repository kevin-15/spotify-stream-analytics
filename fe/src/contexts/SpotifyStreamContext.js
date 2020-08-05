import React, { createContext, useReducer, useEffect } from 'react';
import { spotifyStreamReducer } from '../reducers/spotifyStreamReducer';


export const SpotifyStreamContext = createContext();

const SpotifyStreamContextProvider = (props) => {
    const selectedCharts = ['[]', null].includes(localStorage.getItem('selectedCharts')) ? ['perCountry'] : JSON.parse(localStorage.getItem('selectedCharts')) 
    const defaultData = {
        "init": true,
        selectedCharts,
        dataTopTracks: [],
        dataPerCountry: [],
        dataTopCountries: []
    }
    
    const [spotifyStream, dispatch] = useReducer(spotifyStreamReducer, {}, () => {
        return defaultData
    });

    useEffect(() => {
        console.log({spotifyStream})
        localStorage.setItem('selectedCharts', JSON.stringify(spotifyStream.selectedCharts))
      }, [spotifyStream]);

    return (
        <SpotifyStreamContext.Provider value={{ spotifyStream, dispatch }}>
            {props.children}
        </SpotifyStreamContext.Provider>
    );
}

export default SpotifyStreamContextProvider;