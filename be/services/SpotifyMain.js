const MOMENT = require('moment')
const SPOTIFY_API = require('../api/SpotifyAPI')
const SQL = require('../sql/SQL')
const FS = require('fs').promises;


const saveStream = async (token, date, initTrackArts) => {
    return new Promise(async (resolve, reject) => {
        console.log("INFO: getting stream for", date)
        const streamDate = date ? date : moment().subtract('8', 'hours').format('YYYY/MM/DD');
        let trackArts = initTrackArts;
        let failedTrackArts = []
        let deleted = false;
        let successInsertions = 0;
        let failedInsertions = 0;
        await SPOTIFY_API.stream(token, streamDate).then(
            async result => {
                console.log("INFO: getting stream for", date, "success")

                console.log(`INFO: Items ${result.length}`)
                for (let i = 0; i < result.length; i++) {
                    const isrc = result[i].trackv2.isrc
                    const tracktitle = (result[i].trackv2.name).replace(/'/g, "\\'")
                    const track_href = result[i].trackv2.href
                    const albumtitle = (result[i].album.name).replace(/'/g, "\\'")
                    const album_href = result[i].album.href
                    const artist = (result[i].artists.names).replace(/'/g, "\\'")
                    const artist_href = result[i].artists.hrefs
                    const stream_date = result[i].date
                    const licensor = result[i].licensor
                    const label = result[i].label
                    const stream = result[i].streams.total
                    const skip = result[i].skips.total
                    const save = result[i].saves.total
                    const streams = result[i].streams.country
                    const skips = result[i].skips.country
                    const saves = result[i].saves.country
                    const trackId = track_href.split(':')[2]

                    let item = {
                        isrc,
                        tracktitle,
                        track_href,
                        track_art: "",
                        albumtitle,
                        album_href,
                        artist,
                        artist_href,
                        stream_date,
                        licensor,
                        label,
                        stream: 0,
                        skip: 0,
                        save: 0
                    }

                    await clearRawTable(deleted)
                        .then(
                            async result => {
                                deleted = true
                                if (trackArts.hasOwnProperty(trackId)) {
                                    item.track_art = trackArts[trackId]
                                } else {
                                    console.log(`INFO: track art data for ${trackId} not found. Invoking track API`)
                                    await SPOTIFY_API.getTrackDetails(token, trackId).then(
                                        async trackDetails => {
                                            const newTrackId = trackDetails.album.images[trackDetails.album.images.length - 2].url;
                                            trackArts[trackId] = newTrackId
                                            item.track_art = newTrackId
                                        },
                                        error => {
                                            console.log(`INFO: API call failed ${error}`)
                                            item.track_art = "NULL"
                                            failedTrackArts.push(trackId)
                                        }
                                    )
                                }
                                return;
                            }, error => {
                                console.log(`ERROR: Deletion error ${error}`)
                                return;
                            }
                        ).then(
                            async data => {
                                return await getDataPerCountry(streams, 'stream', {}, item)
                            }
                        ).then(
                            async data => {
                                return { ...(await getDataPerCountry(skips, 'skip', data, item)) }
                            }
                        ).then(
                            async data => {
                                return { ...(await getDataPerCountry(saves, 'save', data, item)) }
                            }
                        ).then(
                            data => {
                                let items = []
                                const itemKeys = Object.keys(data)
                                for (let j = 0; j < itemKeys.length; j++) {
                                    const item = data[itemKeys[j]]
                                    items.push([
                                        item.isrc,
                                        item.tracktitle,
                                        item.track_href,
                                        item.track_art,
                                        item.albumtitle,
                                        item.album_href,
                                        item.artist,
                                        item.artist_href,
                                        item.country,
                                        item.stream_date,
                                        item.licensor,
                                        item.label,
                                        item.stream,
                                        item.skip,
                                        item.save
                                    ])
                                    if (j === itemKeys.length - 1) {
                                        return items
                                    }
                                }
                            }
                        ).then(
                            async data => {
                                const dataSQL = `INSERT INTO ${process.env.SPOTIFY_STREAM_DATA_TB} (isrc, tracktitle, track_href, track_art, albumtitle, album_href, artist, artist_href, country, stream_date, licensor, label, stream, skip, save ) VALUES ? `;
                                await SQL.insertMultiple(dataSQL, data).then(
                                    result => {
                                        successInsertions += 1;
                                    }, error => {
                                        failedInsertions += 1;
                                    }
                                )
                            }
                        ).catch(
                            error => {
                                console.log(`INFO: Something went wrong ${error}`)
                                reject({ code: 404, message: "Error while in Stream Data" })
                            }
                        )

                    if (i == result.length - 1) {
                        console.log(`INFO: Inserted ${successInsertions} tracks, Failed ${failedInsertions} tracks`)
                        const result = {
                            message: `Streams for ${streamDate} was successfully saved`,
                            newTrackArts: trackArts,
                            failedTrackArts
                        }
                        resolve(result)
                    }
                }
            },
            error => {
                console.log(`ERROR: ${error}`)
                reject({ code: 404, message: "Error while streaming" })
            }
        ).catch(
            error => {
                console.log(`ERROR: ${error}`)
                reject({ code: 404, message: "Error while streaming" })
            }
        )
    })
}

const saveTrackArtsToFile = (data) => {
    console.log("INFO: saving track arts to file")
    return new Promise((resolve, reject) => {
        FS.writeFile('public/track_arts.json', JSON.stringify(data), function (err, result) {
            if (err) {
                console.log(`ERROR: writing track_arts failed ${err}`)
                reject(err)
            } else {
                console.log(`INFO: writing track_arts success ${Object.keys(data).length}`)
                resolve("writing track_arts success")
            }
        });
    })
}

const getTrackFilesFromFile = () => {
    return new Promise(async (resolve) => {
        const data = await FS.readFile("public/track_arts.json", "utf8");
        resolve(JSON.parse(data))
    })
}

const clearRawTable = (deleted) => {
    return new Promise(async (resolve, reject) => {
        if (!deleted) {
            const deleteQuery = `DELETE FROM ${process.env.SPOTIFY_STREAM_DATA_TB}`
            await SQL.query(deleteQuery).then(
                success => {
                    console.log(`INFO: Cleared ${process.env.SPOTIFY_STREAM_DATA_TB}`)
                    resolve(success)
                }, error => {
                    console.log(`ERROR: Unable to execute Query ${deleteQuery}`)
                    reject(error)
                }
            )
        }
        resolve("Done")
    })
}

const retryFailedTrackArts = async (token, currentTrackArts, failedTrackArts) => {
    console.log("INFO: Failed to save art tracks found, retrying to save")
    const chunkedArray = arrayChunker(failedTrackArts, 50)
    let trackArtsToBeSavedToFile = { ...currentTrackArts }
    for (let i = 0; i < chunkedArray.length; i++) {
        const trackIds = `?ids=${chunkedArray[i]}`
        await SPOTIFY_API.getTrackDetails(token, trackIds).then(
            async trackDetails => {
                console.log("INFO: Invoking spotify API for tracks success")
                await updateFailedTrackArts(trackDetails, trackArtsToBeSavedToFile).then(
                    data => {
                        trackArtsToBeSavedToFile = { ...data }
                    }
                )
            },
            error => {
                console.log(`INFO: Invoking spotify API for tracks failed ${error}`)
            }
        )
        if (i === chunkedArray.length - 1) {
            await saveTrackArtsToFile(trackArtsToBeSavedToFile)
        }
    }
}

const updateFailedTrackArts = (tracks, trackArtsToBeSavedToFileTmp) => {
    console.log(`INFO: Updating art tracks in ${process.env.SPOTIFY_STREAM_DATA_TB}`)
    return new Promise(async (resolve, reject) => {
        let tracksDetails = tracks.tracks
        let trackArtsToBeSavedToFile = trackArtsToBeSavedToFileTmp;
        let updateFailedTrackArtsQuery = `UPDATE ${process.env.SPOTIFY_STREAM_DATA_TB} SET track_art (CASE `
        for (let i = 0; i < tracksDetails.length; i++) {
            const trackId = tracksDetails[i].id;
            const trackArt = tracksDetails[i].album.images[1].url;
            const trackIsrc = tracksDetails[i].external_ids.isrc
            trackArtsToBeSavedToFile[trackId] = trackArt;
            updateFailedTrackArtsQuery += `WHEN isrc = '${trackIsrc}' THEN '${trackArt}' `

            if (i === tracksDetails.length - 1) {
                updateFailedTrackArtsQuery += ` END ) WHERE track_art = "NULL"`

                await await SQL.query(updateFailedTrackArtsQuery)
                    .then(
                        success => {
                            console.log(`INFO: Updating art tracks in ${process.env.SPOTIFY_STREAM_DATA_TB} success`)
                            resolve(trackArtsToBeSavedToFile)
                        }, failed => {
                            console.log(`INFO: Updating art tracks in ${process.env.SPOTIFY_STREAM_DATA_TB} failed`, updateFailedTrackArtsQuery, failed)
                            resolve(trackArtsToBeSavedToFile)
                        }
                    )
            }
        }
    })
}

const arrayChunker = (arr, chunkSize) => {
    console.log("INFO: chunking array")
    let R = [];
    for (let i = 0, len = arr.length; i < len; i += chunkSize)
        R.push(arr.slice(i, i + chunkSize));
    return R;
}

const getDataPerCountry = (data, type, allData, itemTmp) => {
    return new Promise(resolve => {
        let items = { ...allData }
        let item = { ...itemTmp }

        const dataPerCountry = Object.keys(data);
        if (dataPerCountry.length > 0) {
            for (let i = 0; i < dataPerCountry.length; i++) {
                const identifier = item.isrc + "_" + dataPerCountry[i]
                item.country = dataPerCountry[i]
                if (!items.hasOwnProperty(identifier)) {
                    items[identifier] = { ...item }
                }

                items[identifier][type] += data[dataPerCountry[i]].total

                if (i == dataPerCountry.length - 1) {
                    resolve(items)
                }
            }
        }
        resolve(items)
    })
}

const deleteOldThenInsertNewStreamData = (date) => {
    return new Promise(async (resolve, reject) => {
        const delTracksQuery = `DELETE FROM ${process.env.SPOTIFY_STREAM_TRACKS_TB} WHERE stream_date = '${date}'`
        const delCountriesQuery = `DELETE FROM ${process.env.SPOTIFY_STREAM_COUNTRIES_TB} WHERE stream_date = '${date}'`
        const saveTracksQuery = `INSERT INTO ${process.env.SPOTIFY_STREAM_TRACKS_TB} (isrc, tracktitle, track_art, albumtitle, artist, stream_date, streamTotal, skipTotal, saveTotal) SELECT isrc, tracktitle, track_art, albumtitle, artist, DATE_FORMAT(stream_date, "%Y/%m/%d") stream_date, sum(stream) streamTotal, sum(skip) skipTotal, sum(save) saveTotal FROM ${process.env.SPOTIFY_STREAM_DATA_TB} WHERE stream_date  = '${date}' GROUP BY isrc`
        const saveCountriesQuery = `INSERT INTO ${process.env.SPOTIFY_STREAM_COUNTRIES_TB} (country, streamTotal, skipTotal, saveTotal, stream_date) SELECT c.country, SUM(stream) streamTotal, SUM(skip) skipTotal, SUM(save) saveTotal, DATE_FORMAT(t.stream_date, "%Y/%m/%d") stream_date FROM ${process.env.SPOTIFY_STREAM_DATA_TB} t LEFT JOIN ${process.env.COUNTRY_TB} c ON t.country = c.countrycode WHERE t.stream_date = '${date}' GROUP BY t.country`
        const delFailedStreamsQuery = `DELETE FROM ${process.env.SPOTIFY_STREAM_FAILED_TB} WHERE stream_date = '${date}'`
        await SQL.query(delTracksQuery)
            .then(
                async success => {
                    console.log("INFO: Old Tracks data deleted")
                    return await SQL.query(delCountriesQuery);
                },
                error => {
                    console.log(`ERROR: ${error}`)
                    reject("Unable to delete Tracks data")
                }
            ).then(
                async success => {
                    console.log("INFO: Old Countries data deleted")
                    return await SQL.query(saveTracksQuery);
                },
                error => {
                    console.log(`ERROR: ${error}`)
                    reject("Unable to delete Countries data")
                }
            ).then(
                async success => {
                    console.log("INFO: New Tracks data inserted")
                    return await SQL.query(saveCountriesQuery);
                },
                error => {
                    console.log(`ERROR: ${error} ${saveTracksQuery}`)
                    reject("Unable to insert tracks data")
                }
            ).then(
                async success => {
                    console.log("INFO: New Countries data inserted")
                    return await SQL.query(delFailedStreamsQuery);
                },
                error => {
                    console.log(`ERROR: ${error} ${saveCountriesQuery}`)
                    reject("Unable to insert countries data")
                }
            ).then(
                async success => {
                    console.log(`INFO: ${date} deleted in ${process.env.SPOTIFY_STREAM_FAILED_TB}`)
                    resolve("Aggregated streams data saved")
                },
                error => {
                    console.log(`ERROR: ${error} ${delFailedStreamsQuery}`)
                    reject(`Unable to delete ${date} in ${process.env.SPOTIFY_STREAM_FAILED_TB}`)
                }
            )
    })
}

const saveFailedStreams = async (date) => {
    const saveFailedStreamsQuery = `INSERT INTO ${process.env.SPOTIFY_STREAM_FAILED_TB} (stream_date) VALUES ('${date}')`
    await SQL.query(saveFailedStreamsQuery)
}

const saveStreams = async (req, res) => {

    let from, to;
    let dates = [];
    if (req.query.from && req.query.to) {
        console.log("INFO: attempting to save streams for:", req.query)
        from = req.query.from;
        to = req.query.to;

        dates.push(from)
        while ((dates[dates.length - 1] != MOMENT(new Date(to)).format('YYYY/MM/DD'))) {
            dates.push(MOMENT(new Date(from)).add('1', 'day').format('YYYY/MM/DD'))
            from = MOMENT(new Date(from)).add('1', 'day').format('YYYY/MM/DD')
        }

    } else {
        const dateToday = MOMENT().subtract('2', 'day').format('YYYY/MM/DD')
        console.log("INFO: attempting to save streams for:", dateToday)
        dates.push(dateToday)
    }

    let initialTrackArts = await getTrackFilesFromFile()
    const initialTrackArtsLength = Object.keys(initialTrackArts).length;
    console.log(`INFO: initialTrackArtsLength ${initialTrackArtsLength}`)

    await SPOTIFY_API.getAuthToken().then(
        async token => {
            let startTime = new Date().getTime() / 1000;
            let apiToken = token;
            console.log("INFO: Authorization success")
            for (let j = 0; j < dates.length; j++) {
                const date = dates[j];
                const currentTime = new Date().getTime() / 1000;
                const runningTime = currentTime - startTime;
                
                if(runningTime > 3300){
                    console.log(`INFO: Token is expiring, generating a new one`)
                    startTime = new Date().getTime() / 1000;
                    await SPOTIFY_API.getAuthToken().then(
                        data => {
                            console.log(`INFO: new Token is ${data}`)
                            apiToken = data;
                        },
                        error => {
                            console.log(`ERROR: Unable to get new Token ${error}`)
                        }
                    )
                }

                await saveStream(apiToken, date, initialTrackArts).then(
                    async data => {
                        console.log(`INFO: ${data.message}`)
                        initialTrackArts = data.newTrackArts

                        await deleteOldThenInsertNewStreamData(date).then(
                            success => {
                                console.log(`INFO: ${success}`)
                            }, error => {
                                console.log(`ERROR: ${error}`)
                                saveFailedStreams(date)
                            }
                        )

                        if (j == dates.length - 1) {
                            res.status(200).send(`INFO: Stream results for ${dates.join(", ")} was successfully saved`)
                            if (data.failedTrackArts.length > 0) {
                                retryFailedTrackArts(apiToken, data.newTrackArts, data.failedTrackArts)
                            } else {
                                if (Object.keys(data.newTrackArts).length != initialTrackArtsLength) {
                                    saveTrackArtsToFile(data.newTrackArts)
                                }
                            }
                        }
                    },
                    async error => {
                        if (j == dates.length - 1) {
                            res.status(error.code).send(error.message)
                        }
                        saveFailedStreams(date)
                    }
                )
            }
        }, error => {
            console.log("Authorization error")
            res.status(403).send("Authorization error")
        }
    ).catch(
        error => {
            // res.status(404).send(error)
            console.log(`ERROR: Something went wrong ${error}`)
        }
    )
}

const getStreams = async (req, res, type) => {
    if (req.query.dates) {
        const dates = req.query.dates
        console.log(`API: Dates requested ${dates}`)
        let getStreamsQuery = "";

        if (type === "per-country") {
            getStreamsQuery = `SELECT DATE_FORMAT(stream_date, "%Y/%m/%d") stream_date, SUM(streamTotal) streams, SUM(skipTotal) skips, SUM(saveTotal) saves, country FROM ${process.env.SPOTIFY_STREAM_COUNTRIES_TB} WHERE stream_date IN (${dates}) GROUP BY stream_date, country ORDER BY stream_date, country`
        } else if (type === "top-tracks") {
            getStreamsQuery = `SELECT isrc, tracktitle, track_art, albumtitle, artist, DATE_FORMAT(stream_date, "%Y/%m/%d") stream_date, sum(streamTotal) streamTotal, sum(skipTotal) skipTotal, sum(saveTotal) saveTotal FROM ${process.env.SPOTIFY_STREAM_TRACKS_TB} WHERE stream_date in (${dates}) GROUP BY isrc ORDER BY streamTotal DESC`
        } else {
            getStreamsQuery = `SELECT country, SUM(streamTotal) streamTotal, SUM(skipTotal) skipTotal, SUM(saveTotal) saveTotal, DATE_FORMAT(stream_date, "%Y/%m/%d") stream_date FROM ${process.env.SPOTIFY_STREAM_COUNTRIES_TB} WHERE stream_date IN (${dates}) GROUP BY country ORDER BY streamTotal DESC`
        }

        // console.log(getStreamsQuery)


        await SQL.query(getStreamsQuery).then(
            result => {
                res.status(200).send(result)
            }, error => {
                console.log(`ERROR: Getting the streams ${error}`)
                res.status(404).send("Getting the streams error")
            }
        )
    } else {
        res.status(404).send("Invalid parameters")
    }
}

module.exports = {
    saveStreams,
    getStreams
}