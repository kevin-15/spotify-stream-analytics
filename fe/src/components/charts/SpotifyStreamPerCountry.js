import React from 'react';
import Highcharts from 'highcharts/highstock'
import HighchartsReact from 'highcharts-react-official'
import drilldown from 'highcharts/modules/drilldown.js';
import 'rsuite/dist/styles/rsuite-default.css';
import { Message, Loader } from 'rsuite';

export const SpotifyStreamPerCountryChart = ({ data }) => {

    Highcharts.setOptions({
        lang: {
            drillUpText: ''
        }
    })
    drilldown(Highcharts)
    const LoadingPanel = () => {
        return (
            <Loader size="md" content="Generating Chart.." />
        )
    }

    return (
        <div id="highchartDataPerCountry" >
            {
                data.isPerCountryError ? <Message type="warning" description={data.error} /> :
                    (data.isPerCountryLoading ? <LoadingPanel /> :
                        <HighchartsReact
                            highcharts={Highcharts}
                            options={data.dataPerCountry}
                            allowChartUpdate={true}
                        />
                    )
            }
        </div>

    )

}