import Config from '../config'
const axios = require('axios')


export const getData = (type, dates) => {
    let endpoint = ""
    if(type === "perCountry"){
        endpoint = Config.perCountryApi
    }
    if(type === "topTracks"){
        endpoint = Config.topTrackskApi
    }
    if(type === "topCountries"){
        endpoint = Config.topCountriesApi
    }
    return new Promise(async (resolve, reject) => {
        const url = {
            url: `${endpoint}?dates=${dates}`,
            method: 'get'
        };
        axios(url)
            .then(
                response => resolve(response.data)
            )
            .catch(
                error => {
                    console.log(error)
                    reject([])
                }
            );
    })
}

