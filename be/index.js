const CLUSTER = require('cluster')

if (CLUSTER.isMaster) {
    const cpuCount = require('os').cpus().length;

    for (let i = 0; i < cpuCount; i += 1) {
        CLUSTER.fork();
    }

    CLUSTER.on('exit', function (worker) {
        console.log('CLUSTER: Worker %d died :(', worker.id);
        CLUSTER.fork();
    });
} else {
    require('dotenv').config({ path: './.env' });
    const EXPRESS = require("express");
    const BODY_PARSER = require("body-parser");
    const APP = EXPRESS()
    const FS = require('fs')
    const HTTPS = require('https')
    const HTTP = require('http')
    const PATH = require('path')
    const HTTPS_PORT = process.env.HTTPS_PORT || 8443;
    const HTTP_PORT = process.env.HTTP_PORT || 8080;

    APP.use(BODY_PARSER.json());
    APP.use(BODY_PARSER.urlencoded({ limit: '50mb', extended: true }));
    APP.use('/public', EXPRESS.static('public'))
    const HOSTNAME = process.env.ENV === 'prod' ? "" : process.env.TEST_HOST_NAME
    console.log(HOSTNAME)
    // console.log(`INFO: Worker ${CLUSTER.worker.id} running on port ${PORT}`)
    // APP.listen(PORT);

    const httpsOptions = {
        cert: FS.readFileSync(PATH.join(__dirname, 'ssl', 'cert.pem')),
        key: FS.readFileSync(PATH.join(__dirname, 'ssl', 'privkey.pem'))
    }

    HTTP.createServer(APP).listen(HTTP_PORT, HOSTNAME, function () {
        console.log(`INFO: Worker ${CLUSTER.worker.id} running on port ${HTTP_PORT}`)
    })

    HTTPS.createServer(httpsOptions, APP).listen(HTTPS_PORT, HOSTNAME, function () {
        console.log(`INFO: Worker ${CLUSTER.worker.id} running on port ${HTTPS_PORT}`)
    })
    
    // forwarder from http to https
    // APP.use((req, res, next) => {
    //     console.log(`https://${req.headers.host}${req.url}`)
    //     if (req.protocol === 'http') {
    //         console.log('http detected')
    //         res.redirect(301, `https://${(req.headers.host).replace('8080', '8443')}${req.url}`);
    //     }
    //     next();
    // });

    const cors = require('cors')
    const SQL = require('./sql/SQL')

    const SPOTIFY = require('./services/SpotifyMain')
    const corsOptions = {
        origin: "*",
        optionsSuccessStatus: 200
    }
    let connectionStatus = false;

    APP.get("/", cors(corsOptions), (req, res) => {
        res.status(200).send("Server is up")
    });

    APP.get("/test", cors(corsOptions), (req, res) => {
        res.status(200).send("Server is up")
    });

    APP.get("/api/spotify/save-stream", cors(corsOptions), (req, res) => {
        SPOTIFY.saveStreams(req, res);
    });

    APP.get("/api/spotify/get-stream/per-country", cors(corsOptions), (req, res) => {
        console.log("API: /api/spotify/get-stream/per-country")
        SPOTIFY.getStreams(req, res, "per-country");
    });

    APP.get("/api/spotify/get-stream/top-tracks", cors(corsOptions), (req, res) => {
        console.log("API: /api/spotify/get-stream/top-tracks")
        SPOTIFY.getStreams(req, res, "top-tracks");
    });

    APP.get("/api/spotify/get-stream/top-countries", cors(corsOptions), (req, res) => {
        console.log("API: /api/spotify/get-stream/top-countries")
        SPOTIFY.getStreams(req, res, "top-countries");
    });

    APP.get("/test", cors(corsOptions), (req, res) => {
        res.status(200).send("Server is up")
    });


    const connector = setInterval(async () => {
        if (!connectionStatus) {
            await SQL.connect().then(
                connected => {
                    console.log(`INFO: Worker ${CLUSTER.worker.id} ${connected}`)
                    connectionStatus = true;
                    clearInterval(connector)
                },
                disconnected => {
                    console.log(`INFO: Worker ${CLUSTER.worker.id} ${disconnected}`)
                }
            )
        } else {
            clearInterval(connector)
        }
    }, 2000)
}

