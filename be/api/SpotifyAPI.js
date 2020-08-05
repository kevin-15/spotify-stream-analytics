const zlib = require('zlib');
const request = require('request');


const getAuthToken = () => {
    return new Promise((resolve, reject) => {
        const options = {
            method: 'post',
            url: process.env.SPOTIFY_AUTH_ENDPOINT,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' + Buffer.from(process.env.CLIENT_ID + ':' + process.env.CLIENT_SECRET).toString('base64')
            }
        }
        request(options, (error, response, body) => {
            if (response) {
                if (response.statusCode == 200) {
                    resolve(JSON.parse(body).access_token)
                }
            } else {
                console.log(`ERROR: failed while calling the authentication API ${error}`)
                reject("Authentication failed")
            }
        })
    })
}

const getTrackDetails = (token, id) => {
    return new Promise((resolve, reject) => {
        const options = {
            method: 'get',
            url: process.env.SPOTIFY_TRACK_ENDPOINT + id,
            headers: {
                'Authorization': 'Bearer ' + token,
            }
        }
        request(options, (error, response, body) => {

            if (response) {
                if (response.statusCode == 200) {
                    resolve(JSON.parse(body))
                }
            } else {
                console.log(`ERROR: failed while calling the Track API ${error}`)
                reject("Track failed")
            }
        })
    })
}

const stream = (token, date) => {
    return new Promise((resolve, reject) => {
        let streamData = "";
        let options = {
            method: 'GET',
            url: process.env.SPOTIFY_STREAM_ENDPOINT + date,
            headers: {
                'Authorization': 'Bearer ' + token,
                'Accept-Encoding': 'application/gzip, deflate',
                'Accept': '*/*'
            },
            encoding: null,
            gzip: true
        }
        const response = request(
            options,
            function (error, response, body) {
                if (error) {
                    console.error(error, options);
                    reject([])
                }
            }
        ).pipe(zlib.createGunzip())
            .on('data', function (data) {
                streamData += Buffer.from(data, 'base64').toString().split("\n")
            })
            .on('error', function (err) {
                console.log("Stream error", err)
                reject("Stream error")
            })
            .on('end', function (data) {
                const splittedStreamData = streamData.slice(0, -1).split("},{")
                let arr = [];
                for (let i = 0; i < splittedStreamData.length; i++) {
                    let prefix = "", suffix = "}";
                    if (i != 0) {
                        prefix = "{"
                        suffix = "}"
                    }
                    if (i == splittedStreamData.length - 1) {
                        suffix = ""
                    }

                    const temp = prefix + splittedStreamData[i] + suffix
                    try {
                        arr.push(JSON.parse(temp))
                    } catch (e) {
                        console.log("Problem on entry no ", i - 1, " ===>", splittedStreamData[i - 1])
                        console.log("Problem on entry no ", i, " ===>", temp)
                    }
                    if (i == splittedStreamData.length - 1) {
                        resolve(arr)
                    }
                }
            })
    })
}



module.exports = {
    getAuthToken,
    getTrackDetails,
    stream
}