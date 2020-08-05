
export const spotifyStreamReducer = (state = {}, action) => {
    switch (action.type) {
        case 'LOADING':
            console.log('LOADING')
            return Object.assign({}, state, {
                init: false,
                isLoading: true
            })
            
        case 'UPDATE_CHARTS_TO_DISPLAY':
            console.log('UPDATE_CHARTS_TO_DISPLAY')
            return Object.assign({}, state, {
                selectedCharts: action.chartsToDisplay
            })
        // Per Country
        case 'PER_COUNTRY_CHART_LOADING':
            console.log('PER_COUNTRY_CHART_LOADING')
            return Object.assign({}, state, {
                init: false,
                isLoading: false,
                isPerCountryError: false,
                isPerCountryLoading: true
            })
        case 'PER_COUNTRY_CHART_LOADED':
            console.log('PER_COUNTRY_CHART_LOADED')
            return Object.assign({}, state, {
                init: false,
                isLoading: false,
                isPerCountryError: false,
                dataPerCountry: action.data,
                isPerCountryLoading: false
            })
        case 'PER_COUNTRY_CHART_ERROR':
            console.log('PER_COUNTRY_CHART_ERROR')
            return Object.assign({}, state, {
                init: false,
                isLoading: false,
                isPerCountryError: true,
                error: action.error,
                isPerCountryLoading: false
            })
        case 'PER_COUNTRY_CHART_NO_DATA':
            console.log('PER_COUNTRY_CHART_NO_DATA')
            return Object.assign({}, state, {
                init: false,
                isLoading: false,
                isPerCountryError: true,
                error: action.error,
                isPerCountryLoading: false
            })
        // Top Tracks
        case 'TOP_TRACKS_CHART_LOADING':
            console.log('TOP_TRACKS_CHART_LOADING')
            return Object.assign({}, state, {
                init: false,
                isLoading: false,
                isTopTracksError: false,
                dataTopTracks: [],
                isTopTracksLoading: true
            })
        case 'TOP_TRACKS_DATA_LOADED':
            console.log('TOP_TRACKS_DATA_LOADED')
            return Object.assign({}, state, {
                init: false,
                isLoading: false,
                isTopTracksError: false,
                dataTopTracks: action.data,
                isTopTracksLoading: false
            })
        case 'TOP_TRACKS_CHART_ERROR':
            console.log('TOP_TRACKS_CHART_ERROR')
            return Object.assign({}, state, {
                init: false,
                isLoading: false,
                isTopTracksError: true,
                topTracksError: action.error,
                dataTopTracks: [],
                isTopTracksLoading: false
            })
        case 'TOP_TRACKS_CHART_NO_DATA':
            console.log('TOP_TRACKS_CHART_NO_DATA')
            return Object.assign({}, state, {
                init: false,
                isLoading: false,
                isTopTracksError: true,
                dataTopTracks: [],
                topTracksError: action.error,
                isTopTracksLoading: false
            })
        // Top Countries
        case 'TOP_COUNTRIES_CHART_LOADING':
            console.log('TOP_COUNTRIES_CHART_LOADING')
            return Object.assign({}, state, {
                init: false,
                isLoading: false,
                isTopCountriesError: false,
                dataTopCountries: [],
                isTopCountriesLoading: true
            })
        case 'TOP_COUNTRIES_DATA_LOADED':
            console.log('TOP_COUNTRIES_DATA_LOADED')
            return Object.assign({}, state, {
                init: false,
                isLoading: false,
                isTopCountriesError: false,
                dataTopCountries: action.data,
                isTopCountriesLoading: false
            })
        case 'TOP_COUNTRIES_CHART_ERROR':
            console.log('TOP_COUNTRIES_CHART_ERROR')
            return Object.assign({}, state, {
                init: false,
                isLoading: false,
                isTopCountriesError: true,
                topCountriesError: action.error,
                dataTopCountries: [],
                isTopCountriesLoading: false
            })
        case 'TOP_COUNTRIES_CHART_NO_DATA':
            console.log('TOP_COUNTRIES_CHART_NO_DATA')
            return Object.assign({}, state, {
                init: false,
                isLoading: false,
                isTopCountriesError: true,
                dataTopCountries: [],
                topCountriesError: action.error,
                isTopCountriesLoading: false
            })
        default:
            return state;
    }
} 