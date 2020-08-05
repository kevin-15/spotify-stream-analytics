const env = "prod"
const protocol = window.location.protocol + '//';
const serverPort = protocol === 'https://' ? 8443 : 8080;
const server = env === "dev" ? "http://localhost:" + serverPort : protocol + window.location.hostname + ':' + serverPort;

const Config = {
    env,
    server,
    chartBackButtonSVG: server + "/public/back-arrow.svg",
    perCountryApi: server + "/api/spotify/get-stream/per-country",
    topTrackskApi: server + "/api/spotify/get-stream/top-tracks",
    topCountriesApi: server + "/api/spotify/get-stream/top-countries"
}

export default Config;