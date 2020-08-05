import { getData } from '../api/SpotifyAPI'
import moment from 'moment'
import Config from '../config'

export const getSpotifyStreamPerCountry = async (dispatch, dates) => {
    dispatch({ type: 'PER_COUNTRY_CHART_LOADING' })
    await generateNeededDates(dates, "perCountry").then(
        data => {
            return data
        }
    ).then(
        async data => {
            const datesToBeDisplayed = data.datesToBeDisplayed
            const neededDates = data.filteredNeededDates
            const isNeededDatePresentInLocalStorage = data.isNeededDatePresentInLocalStorage;
            let apiResult = []
            if (neededDates) {
                await getData("perCountry", neededDates).then(
                    result => {
                        apiResult = result;
                    },
                    error => {
                        console.log(error)
                        apiResult = []
                    }
                )
            } else {
                console.log('All dates are present in local storage. Skipping the API call')
            }
            return ({
                datesToBeDisplayed,
                neededDates,
                isNeededDatePresentInLocalStorage,
                apiResult
            })
        }
    ).then(
        async data => {
            return {
                data: await sortSpotifyStreamPerCountry(data),
                datesToBeDisplayedLength: data.datesToBeDisplayed.length - 1
            }
        }
    ).then(
        async result => {
            return await buildSpotifyStreamPerCountryChart(result)
        }, error => {
            dispatch({ type: 'PER_COUNTRY_CHART_ERROR', error: error })
        }
    ).then(
        result => {
            dispatch({ type: 'PER_COUNTRY_CHART_LOADED', data: result })
        },
        error => {
            if (error === "No Data") {
                dispatch({ type: 'PER_COUNTRY_CHART_NO_DATA', error: "Per Country Chart : No available data for the selected date range" })
            } else {
                dispatch({ type: 'PER_COUNTRY_CHART_ERROR', error: error })
            }
        }
    )
}

export const getSpotifyStreamTopData = async (dispatch, type, dates) => {
    console.log({ type })
    if (type === "topTracks") {
        dispatch({ type: 'TOP_TRACKS_CHART_LOADING' })
    }
    if (type === "topCountries") {
        dispatch({ type: 'TOP_COUNTRIES_CHART_LOADING' })
    }

    await generateNeededDates(dates, type).then(
        data => {
            console.log({ generateNeededDates: data })
            return data
        }
    ).then(
        async data => {
            const datesToBeDisplayed = data.datesToBeDisplayed
            const neededDates = data.filteredNeededDates
            const isNeededDatePresentInLocalStorage = data.isNeededDatePresentInLocalStorage;
            let apiResult = []
            if (neededDates) {
                await getData(type, neededDates).then(
                    result => {
                        apiResult = result;
                    },
                    error => {
                        console.log(error)
                        if (type === "topTracks") {
                            dispatch({ type: 'TOP_TRACKS_CHART_ERROR', error: "API Error, trying to get data from local staorage." })
                        }
                        if (type === "topCountries") {
                            dispatch({ type: 'TOP_COUNTRIES_CHART_ERROR', error: "API Error, trying to get data from local staorage." })
                        }
                    }
                )

            } else {
                console.log('All dates are present in local storage. Skipping the API call')
            }
            return ({
                datesToBeDisplayed,
                neededDates,
                isNeededDatePresentInLocalStorage,
                apiResult
            })
        }
    ).then(
        async data => {
            await sortSpotifyStreamData(type, data).then(
                result => {
                    if (result.length > 0) {
                        if (type === "topTracks") {
                            dispatch({ type: 'TOP_TRACKS_DATA_LOADED', data: result })
                        }
                        if (type === "topCountries") {
                            dispatch({ type: 'TOP_COUNTRIES_DATA_LOADED', data: result })
                        }
                    } else {
                        if (type === "topTracks") {
                            dispatch({ type: 'TOP_TRACKS_CHART_NO_DATA', error: "Top Tracks Table : No available data for the selected date range" })
                        }
                        if (type === "topCountries") {
                            dispatch({ type: 'TOP_COUNTRIES_CHART_NO_DATA', error: "Top Countries Table : No available data for the selected date range" })
                        }
                    }

                }, error => {
                    if (type === "topTracks") {
                        dispatch({ type: 'TOP_TRACKS_CHART_ERROR', error: "API Data Error" })
                    }
                    if (type === "topCountries") {
                        dispatch({ type: 'TOP_COUNTRIES_CHART_ERROR', error: "API Data Error" })
                    }
                }
            )
        }
    )
}

const sortSpotifyStreamData = (type, data) => {
    return new Promise(async (resolve, reject) => {
        const tmp = {}
        if (data.apiResult.length > 0) {
            for (let i = 0; i < data.apiResult.length; i++) {
                const streamDate = data.apiResult[i].stream_date;
                if (!Object.keys(tmp).includes(streamDate)) {
                    tmp[streamDate] = []
                }
                tmp[streamDate].push(data.apiResult[i])
                if (i === data.apiResult.length - 1) {
                    await saveStreamsDataToLocalStorage(type, resolve, reject, data.datesToBeDisplayed, data.isNeededDatePresentInLocalStorage, tmp)
                }
            }
        } else {
            await saveStreamsDataToLocalStorage(type, resolve, reject, data.datesToBeDisplayed, data.isNeededDatePresentInLocalStorage, {})
        }
    })
}

const saveStreamsDataToLocalStorage = (type, resolve, reject, datesToBeDisplayed, isNeededDatePresentInLocalStorage, tmp) => {
    let data = []
    let prefix = ""
    if (type === "topTracks") {
        prefix = "dataTopTracks_";
    }
    if (type === "topCountries") {
        prefix = "dataTopCountries_";
    }
    const datesToBeSaved = Object.keys(tmp)
    for (let i = 0; i < datesToBeDisplayed.length; i++) {
        if (datesToBeSaved.includes(datesToBeDisplayed[i])) {
            // try {
            //     localStorage.setItem('dataTopTracks_' + datesToBeDisplayed[i], JSON.stringify(tmp[datesToBeDisplayed[i]]))
            // } catch (e) {
            //     console.log(`ERROR: Local Storage is full ${e}`)
            // }

            data.push(...tmp[datesToBeDisplayed[i]])
        } else {
            if (isNeededDatePresentInLocalStorage && localStorage.getItem(prefix + datesToBeDisplayed[i]) !== null) {
                data.push(...JSON.parse(localStorage.getItem(prefix + datesToBeDisplayed[i])))
            }
        }

        if (i === datesToBeDisplayed.length - 1) {
            resolve(data)
        }
    }
}

const sortSpotifyStreamPerCountry = (data) => {
    return new Promise(async (resolve, reject) => {
        const tmp = {}
        if (data.apiResult.length > 0) {
            for (let i = 0; i < data.apiResult.length; i++) {
                const streamDate = data.apiResult[i].stream_date;
                if (!Object.keys(tmp).includes(streamDate)) {
                    tmp[streamDate] = []
                }
                tmp[streamDate].push(data.apiResult[i])
                if (i === data.apiResult.length - 1) {
                    saveStreamsPerCountryToLocalStorage(resolve, reject, data.datesToBeDisplayed, data.isNeededDatePresentInLocalStorage, tmp)
                }
            }
        } else {
            saveStreamsPerCountryToLocalStorage(resolve, reject, data.datesToBeDisplayed, data.isNeededDatePresentInLocalStorage, {})
        }
    })
}

const saveStreamsPerCountryToLocalStorage = (resolve, reject, datesToBeDisplayed, isNeededDatePresentInLocalStorage, tmp) => {
    let data = []
    const datesToBeSaved = Object.keys(tmp)
    for (let i = 0; i < datesToBeDisplayed.length; i++) {
        if (datesToBeSaved.includes(datesToBeDisplayed[i])) {
            try {
                localStorage.setItem('dataPerCountry_' + datesToBeDisplayed[i], JSON.stringify(tmp[datesToBeDisplayed[i]]))
            } catch (e) {
                console.log(`ERROR: Local Storage is full ${e}`)
            }

            data.push(...tmp[datesToBeDisplayed[i]])
        } else {
            if (isNeededDatePresentInLocalStorage && localStorage.getItem('dataPerCountry_' + datesToBeDisplayed[i]) !== null) {
                data.push(...JSON.parse(localStorage.getItem('dataPerCountry_' + datesToBeDisplayed[i])))
            }
        }

        if (i === datesToBeDisplayed.length - 1) {
            resolve(data)
        }
    }
}

const generateNeededDates = (dates, type) => {
    return new Promise((resolve) => {
        let from, to;
        let localStoragePrefix;
        if (type === "perCountry") {
            localStoragePrefix = "dataPerCountry_"
        } else if (type === "topTracks") {
            localStoragePrefix = "dataTopTracks_"
        } else if (type === "topCountries") {
            localStoragePrefix = "dataTopCountries_"
        }

        if (dates === 'default') {
            from = moment().subtract('6', 'day').format('YYYY/MM/DD');
            to = moment().format('YYYY/MM/DD');
        } else {
            from = moment(new Date(dates[0])).format('YYYY/MM/DD');
            to = moment(new Date(dates[1])).format('YYYY/MM/DD');
        }

        let range = []
        range.push(from)

        let neededDates = []
        let isNeededDatePresentInLocalStorage = false;
        while ((range[range.length - 1] !== to)) {
            range.push(moment(new Date(range[range.length - 1])).add('1', 'day').format('YYYY/MM/DD'))
        }

        for (let i = 0; i < range.length; i++) {
            if (localStorage.getItem(localStoragePrefix + range[i]) === null) {
                neededDates.push(range[i])
            } else {
                isNeededDatePresentInLocalStorage = true
            }

            if (i === range.length - 1) {
                const filteredNeededDates = neededDates.length > 0 ? '"' + neededDates.join('","') + '"' : false;
                resolve({
                    datesToBeDisplayed: range,
                    isNeededDatePresentInLocalStorage,
                    filteredNeededDates
                })
            }
        }
    })
}

const easeOutBounce = (pos) => {
    if ((pos) < (1 / 2.75)) {
        return (7.5625 * pos * pos);
    }
    if (pos < (2 / 2.75)) {
        return (7.5625 * (pos -= (1.5 / 2.75)) * pos + 0.75);
    }
    if (pos < (2.5 / 2.75)) {
        return (7.5625 * (pos -= (2.25 / 2.75)) * pos + 0.9375);
    }
    return (7.5625 * (pos -= (2.625 / 2.75)) * pos + 0.984375);
};

Math.easeOutBounce = easeOutBounce;

const buildSpotifyStreamPerCountryChart = (data) => {
    const streamData = data.data
    const datesToBeDisplayedLength = data.datesToBeDisplayedLength
    return new Promise((resolve, reject) => {
        console.log({ streamData: streamData.length })
        if (streamData.length > 0) {
            let highCharts = {
                chart: {
                    type: 'column',
                    height: 450,
                    spacingLeft: 0,
                    spacingRight: 30,
                    events: {
                        load: function (e) {
                            this.xAxis[0].setExtremes(0, datesToBeDisplayedLength);
                            let chart = this,
                                renderer = chart.renderer,
                                pattern = renderer.createElement('pattern').add(renderer.defs).attr({
                                    width: 1,
                                    height: 1,
                                    id: 'back-arrow'
                                });

                            renderer.image(Config.chartBackButtonSVG, 10, 0, 45, 30).add(pattern);
                            pattern = renderer.createElement('pattern').add(renderer.defs).attr({
                                width: 1,
                                height: 1,
                                id: 'coloured-back-arrow'
                            });

                            renderer.rect(0, 0, 70, 32)
                                .attr({
                                    fill: '#a4edba'
                                })
                                .add(pattern);
                            renderer.image(Config.chartBackButtonSVG, 10, 0, 45, 30).add(pattern);
                        },
                        drillup: function (e) {
                            console.log('drillup')
                            this.xAxis[0].update({
                                type: 'category',
                                tickPixelInterval: 50,
                                min: 0,
                                max: 6,
                                scrollbar: {
                                    enabled: false,
                                    scrollbarStrokeWidth: 0,
                                    scrollbarRifles: {
                                        'stroke-width': 0
                                    },
                                    height: 0
                                }
                            });
                            this.setTitle({
                                text: "Spotify Aggregated Streams"
                            }, {
                                text: "Click the columns to view values per country"
                            });
                            this.yAxis[0].setTitle({
                                text: "Number of Streams / Skips / Saves"
                            });
                            this.xAxis[0].setExtremes(0, datesToBeDisplayedLength);
                        },
                        drilldown: function (e) {
                            let max = 0
                            let title, subtitle, yTitle;
                            if (e.points) {
                                max = 6
                                title = "Data per Country"
                                subtitle = moment(new Date(e.seriesOptions.id.split('_')[1])).format('MMMM DD, YYYY')
                                yTitle = "Number of Streams / Skips / Saves"
                            } else {
                                max = 19
                                title = e.seriesOptions.name + " per Country"
                                subtitle = moment(new Date(e.seriesOptions.id.split('_')[1])).format('MMMM DD, YYYY')
                                yTitle = "Number of " + e.seriesOptions.name
                            }

                            this.xAxis[0].update({
                                min: 0,
                                max: max,
                                scrollbar: {
                                    enabled: true,
                                    scrollbarStrokeWidth: 1,
                                    scrollbarRifles: {
                                        'stroke-width': 1
                                    },
                                    height: 10
                                }
                            });
                            this.setTitle({
                                text: title
                            }, {
                                text: subtitle
                            });
                            this.yAxis[0].setTitle({
                                text: yTitle
                            });
                        }
                    }
                },
                title: {
                    text: 'Spotify Aggregated Streams'
                },
                subtitle: {
                    text: 'Click the columns to view values per country'
                },
                xAxis: {
                    type: 'category',
                    min: 0,
                    max: 6,
                    endOnTick: true,
                    tickPixelInterval: 50
                },
                yAxis: {
                    title: {
                        text: 'Number of Streams / Skips / Saves'
                    }
                },
                navigator: {
                    enabled: false,
                    margin: 0
                },
                rangeSelector: {
                    enabled: false,
                    selected: 1,
                    margin: 0
                },
                plotOptions: {
                    column: {
                        animation: {
                            duration: 200,
                            easing: 'easeOutBounce'
                        },
                        borderWidth: 0,
                        dataLabels: {
                            overflow: 'none',
                            crop: false,
                            enabled: true,
                            defer: false,
                            formatter: function () {
                                return this.y.toLocaleString()
                            }
                        },
                        grouping: true
                    }
                },

                credits: {
                    enabled: false
                },

                tooltip: {
                    useHTML: true,
                    headerFormat: '<span style="font-size:11px">{series.name}</span><br>',
                    pointFormatter: function () {
                        return `<span style="color:${this.color}">${this.name}</span>: <b>${this.y.toLocaleString()}</b>`
                    }
                },

                series: [],
                drilldown: {
                    drillUpButton: {
                        relativeTo: 'spacingBox',
                        position: {
                            y: 10,
                            x: -10,
                            width: 50,
                            height: 20
                        },
                        theme: {
                            fill: 'url(#back-arrow)',
                            'stroke-width': .5,
                            stroke: 'silver',
                            r: 0,
                            states: {
                                hover: {
                                    fill: 'url(#coloured-back-arrow)'
                                }
                            }
                        }

                    },
                    series: []
                }
            }

            let series = {
                streams: {
                    name: "Streams",
                    drillUpButton: {
                        text: "< Back"
                    },
                    data: {},
                    drilldown: {}
                },
                skips: {
                    name: "Skips",
                    drillUpButton: {
                        text: "< Back"
                    },
                    data: {},
                    drilldown: {}
                },
                saves: {
                    name: "Saves",
                    drillUpButton: {
                        text: "< Back"
                    },
                    data: {},
                    drilldown: {}
                }
            }

            let allStreamDates = []

            try {
                for (let i = 0; i < streamData.length; i++) {
                    const streamDate = streamData[i].stream_date;
                    const streamsCount = streamData[i].streams;
                    const skipsCount = streamData[i].skips;
                    const savesCount = streamData[i].saves;
                    const country = streamData[i].country
                    let streamsDdId = "stream_" + streamDate
                    let skipsDdId = "skip_" + streamDate
                    let savesDdId = "save_" + streamDate


                    if (!allStreamDates.includes(streamDate)) {
                        allStreamDates.push(streamDate)

                        series.streams.data[streamDate] = {
                            name: streamDate,
                            y: streamsCount,
                            drilldown: streamsDdId
                        }

                        series.skips.data[streamDate] = {
                            name: streamDate,
                            y: skipsCount,
                            drilldown: skipsDdId
                        }

                        series.saves.data[streamDate] = {
                            name: streamDate,
                            y: savesCount,
                            drilldown: savesDdId
                        }

                        series.streams.drilldown[streamDate] = {
                            name: "Streams",
                            id: streamsDdId,
                            data: [
                                [
                                    country,
                                    streamsCount
                                ]
                            ]
                        }

                        series.skips.drilldown[streamDate] = {
                            name: "Skips",
                            id: skipsDdId,
                            data: [
                                [
                                    country,
                                    skipsCount
                                ]
                            ]
                        }

                        series.saves.drilldown[streamDate] = {
                            name: "Saves",
                            id: savesDdId,
                            data: [
                                [
                                    country,
                                    savesCount
                                ]
                            ]
                        }
                    } else {
                        series.streams.data[streamDate].y += streamsCount
                        series.skips.data[streamDate].y += skipsCount
                        series.saves.data[streamDate].y += savesCount

                        series.streams.drilldown[streamDate].data.push([country, streamsCount])
                        series.skips.drilldown[streamDate].data.push([country, skipsCount])
                        series.saves.drilldown[streamDate].data.push([country, savesCount])

                    }

                    if (i === streamData.length - 1) {
                        const streamTypes = ['streams', 'skips', 'saves']
                        console.log(series)
                        for (let j = 0; j < streamTypes.length; j++) {
                            const streamDates = Object.keys(series[streamTypes[j]].data)
                            const drillDownDates = Object.keys(series[streamTypes[j]].drilldown)
                            let seriesTmp = {
                                animation: { duration: 1500, easing: easeOutBounce },
                                name: streamTypes[j].toUpperCase(),
                                data: []
                            }
                            for (let k = 0; k < streamDates.length; k++) {
                                const seriesTmpVals = series[streamTypes[j]].data[streamDates[k]]
                                seriesTmp.data.push(seriesTmpVals)
                                if (k === streamDates.length - 1) {
                                    highCharts.series.push(seriesTmp)
                                }
                            }

                            for (let l = 0; l < drillDownDates.length; l++) {
                                highCharts.drilldown.series.push(series[streamTypes[j]].drilldown[drillDownDates[l]])
                                if (l === drillDownDates.length - 1) {
                                    resolve(highCharts)
                                }
                            }
                        }
                    }
                }
            }
            catch (error) {
                console.log(error)
                reject("Something went wrong")
            }
        } else {
            reject("No Data")
        }
    })
}
