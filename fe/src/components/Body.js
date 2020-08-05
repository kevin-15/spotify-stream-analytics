import React, { useContext, useState } from 'react';

import { DateRangePicker, Loader, Container, Grid, Content, Row, Col, FormGroup, TagPicker } from 'rsuite';
import 'rsuite/dist/styles/rsuite-default.css';
import { SpotifyStreamContext } from '../contexts/SpotifyStreamContext';
import { SpotifyStreamPerCountryChart, } from '../components/charts/SpotifyStreamPerCountry'
import { SpotifyStreamTopTracksTable } from './charts/SpotifyStreamTopTracks'
import { SpotifyStreamTopCountriesTable } from './charts/SpotifyStreamTopCountries'
import { getSpotifyStreamPerCountry, getSpotifyStreamTopData } from '../actions/SpotifyActions'
import moment from 'moment'

export const Body = () => {
  const { spotifyStream, dispatch } = useContext(SpotifyStreamContext);
  const [selectedDateRanges, setDateRanges] = useState({
    perCountry: [new Date(moment().subtract('8', 'day').format('YYYY/MM/DD')), new Date(moment().subtract('2', 'day').format('YYYY/MM/DD'))]
  })
  const chartTypes = [
    { value: "perCountry", label: "Per country" },
    { value: "topTracks", label: "Top Tracks" },
    { value: "topCountries", label: "Top Countries" }
  ]


  console.log(selectedDateRanges)
  const {
    allowedMaxDays,
    allowedRange,
    combine
  } = DateRangePicker;


  const handleSelectedDateRange = (ranges) => {
    console.log({ ranges })
    let selectedDateRangesTmp = selectedDateRanges
    selectedDateRangesTmp.perCountry = ranges;
    setDateRanges({ ...selectedDateRangesTmp })
    generateSelectedCharts(spotifyStream.selectedCharts)
  }

  const handleClick = (e) => {
    console.log({ e })
  }

  const handleSelectedCharts = (charts) => {
    console.log({ charts, selectedCharts: spotifyStream.selectedCharts })
    const newChartToBeDisplayed = charts.filter((chart) => !spotifyStream.selectedCharts.includes(chart))
    dispatch({ type: 'UPDATE_CHARTS_TO_DISPLAY', chartsToDisplay: charts })
    console.log({ newChartToBeDisplayed })
    generateSelectedCharts(newChartToBeDisplayed)
  }

  const LoadingPanel = () => {
    return (
      <Loader backdrop size="lg" content="Please wait.." vertical />
    )
  }

  const generateSelectedCharts = (charts) => {
    if (spotifyStream.init) {
      dispatch({ type: 'LOADING' })
    }
    const chartsToBeGenerated = charts;
    console.log({ spotifyStream })
    for (let i = 0; i < chartsToBeGenerated.length; i++) {
      if (chartsToBeGenerated[i] === "perCountry") {
        getSpotifyStreamPerCountry(dispatch, selectedDateRanges.perCountry)
      } else if (chartsToBeGenerated[i] === "topTracks") {
        getSpotifyStreamTopData(dispatch, "topTracks", selectedDateRanges.perCountry)
      } else if (chartsToBeGenerated[i] === "topCountries") {
        getSpotifyStreamTopData(dispatch, "topCountries", selectedDateRanges.perCountry)
      }
    }
  }

  return (

    <div className="body">
      {
        spotifyStream.init ?
          (generateSelectedCharts(spotifyStream.selectedCharts) && <LoadingPanel />) :
          spotifyStream.isLoading ?
            <LoadingPanel /> :
            <div>
              <div className="show-fake-browser navbar-page">
                <Container>
                  <Content>
                    <Grid fluid>
                      <Row className="chartOptions">
                        <Col xs={10}>
                          <Row id="dateRangePicker">
                            <Col xs={8} md={6} className="formLabel">
                              Select dates:
                              </Col>
                            <Col xs={16} md={18} >
                              <DateRangePicker
                                block
                                ranges={[]}
                                value={selectedDateRanges.perCountry}
                                size="md"
                                disabledDate={combine(allowedRange('2018-09-05', moment().subtract('2', 'day').format('YYYY-MM-DD')), allowedMaxDays(7))}
                                onOk={handleSelectedDateRange}
                              />
                            </Col>
                          </Row>
                        </Col>
                        <Col xs={14}>
                          <Row id="chartTypePicker">
                            <Col xs={5} md={4} className="formLabel">
                              Select charts:
                              </Col>
                            <Col xs={19} md={20}>
                              <TagPicker
                                block
                                data={chartTypes}
                                defaultValue={spotifyStream.selectedCharts}
                                size="md"
                                placeholder="Select charts here"
                                onChange={handleSelectedCharts}
                                onGroupTitleClick={handleClick}
                              />
                            </Col>
                          </Row>
                        </Col>
                      </Row>
                      {
                        spotifyStream.selectedCharts.includes('perCountry') ?
                          <Row>
                            <Col xs={24}>
                              <SpotifyStreamPerCountryChart data={spotifyStream} />
                            </Col>
                          </Row> : ""
                      }
                      {
                        spotifyStream.selectedCharts.includes('topTracks') ?
                          <Row>
                            <Col xs={24}>
                              <SpotifyStreamTopTracksTable data={spotifyStream} />
                            </Col>
                          </Row> : ""
                      }
                      {
                        spotifyStream.selectedCharts.includes('topCountries') ?
                          <Row>
                            <Col xs={24}>
                              <SpotifyStreamTopCountriesTable data={spotifyStream} />
                            </Col>
                          </Row> : ""
                      }
                    </Grid>
                  </Content>
                </Container>
              </div>
            </div>
      }
    </div>
  );
}



export default Body;


