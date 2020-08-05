import React, { useState, useEffect } from 'react';
import 'rsuite/dist/styles/rsuite-default.css';
import { Message, Loader, Table, Icon, Grid, Row, Col } from 'rsuite';
const { Column, HeaderCell, Cell } = Table;
const columns = [
    { key: 'index', label: "Rank", flexGrow: 1 },
    { key: 'country', label: "Country", flexGrow: 2 },
    { key: 'streamTotal', label: "Streams", flexGrow: 1 },
    { key: 'saveTotal', label: "Saves", flexGrow: 1 },
    { key: 'skipTotal', label: "Skips", flexGrow: 1 }
]

export const SpotifyStreamTopCountriesTable = ({ data }) => {

    const [tableData, setTableData] = useState([])
    const [tableLoading, setTableLoading] = useState(false)
    const [sortColumn, setSortColumn] = useState('streamTotal')
    const [sortType, setSortType] = useState('asc')
    const [tableDataRenderedFlag, setTableDataRenderedFlag] = useState(false)

    const LoadingPanel = () => {
        return (
            <Loader size="md" content="Generating Top Countries table.." />
        )
    }

    useEffect(() => {
        sortData(sortColumn, sortType)
    }, [data.dataTopCountries]);


    const sortData = (col, type) => {
        const sorted = data.dataTopCountries.sort(function (a, b) {
            let keyA = a[col],
                keyB = b[col];
            if (typeof keyA === 'string') {
                keyA = keyA.charCodeAt();
            }
            if (typeof keyB === 'string') {
                keyB = keyB.charCodeAt();
            }
            if (type === 'desc') {
                if (keyA < keyB) return -1;
                if (keyA > keyB) return 1;
            }
            if (type === 'asc') {
                if (keyA > keyB) return -1;
                if (keyA < keyB) return 1;
            }
            return 0;
        });
        setTableData(sorted)
    }

    const handleSortColumn = (sortColumn, sortType) => {
        setSortType(sortType)
        setSortColumn(sortColumn)
        sortData(sortColumn, sortType)
        setTableLoading(true)

        setTimeout(() => {
            setTableLoading(false)
        }, 500);
    }

    if (data.dataTopCountries.length > 0 && !tableDataRenderedFlag) {
        setTableData(data.dataTopCountries)
        setTableDataRenderedFlag(true)
    }

    return (
        <div id="highchartDataPerCountry" >
            {
                data.isTopCountriesError ? <Message type="warning" description={data.topCountriesError} /> :
                    (data.isTopCountriesLoading ? <LoadingPanel /> :
                        <Grid fluid>
                            <Row>
                                <Col xs={24} className="chartNameContainer">
                                    <p className="chartName">Top Countries</p>
                                </Col>
                            </Row>
                            <Row>
                                <Col xs={24}>
                                    <Table
                                        virtualized
                                        bordered={true}
                                        height={450}
                                        data={tableData}
                                        sortColumn={sortColumn}
                                        sortType={sortType}
                                        onSortColumn={handleSortColumn}
                                        loading={tableLoading}
                                    >
                                        {
                                            columns.map((column, i) => {
                                                const sortable = ['index', 'country'].includes(column.key) ? false : true
                                                const cellData = column.key
                                                const flexGrow = column.flexGrow
                                                const headerName = column.label

                                                let customCell = <Cell dataKey={cellData} />

                                                if (cellData.includes('Total')) {
                                                    customCell = <Cell dataKey={cellData}>
                                                        {rowData => (
                                                            <span id="countsColumn">{rowData[cellData].toLocaleString()}</span>
                                                        )}
                                                    </Cell>
                                                }

                                                if (cellData === 'index') {
                                                    customCell = <Cell dataKey={cellData}>
                                                        {(rowData, rowIndex) => {
                                                            let rank = rowIndex + 1
                                                            if (sortType === 'desc') {
                                                                rank = tableData.length - rowIndex
                                                            }
                                                            let rankIcon = ''
                                                            if ([1, 2, 3].includes(rank)) {
                                                                rankIcon = <Icon icon='trophy' size="lg" id={`rank-${rank}`} />
                                                            }
                                                            return <span id="rankColumn">{rankIcon} {getNumberWithOrdinal(rank)}</span>
                                                        }}
                                                    </Cell>
                                                }

                                                let rankTypeHeader = ''
                                                if (sortColumn === 'streamTotal') {
                                                    rankTypeHeader = 'Rank - Stream count'
                                                } else if (sortColumn === 'skipTotal') {
                                                    rankTypeHeader = 'Rank - Skip count'
                                                } else if (sortColumn === 'saveTotal') {
                                                    rankTypeHeader = 'Rank - Save count'
                                                } else {
                                                    rankTypeHeader = '#'
                                                }

                                                return (
                                                    <Column align="center" flexGrow={flexGrow} key={i} sortable={sortable}>
                                                        <HeaderCell><span id="columnHeader">{cellData === 'index' ? rankTypeHeader : headerName}</span></HeaderCell>
                                                        {customCell}
                                                    </Column>
                                                )
                                            })
                                        }
                                    </Table>
                                </Col>
                            </Row>
                        </Grid>
                    )
            }
        </div>
    )
}

function getNumberWithOrdinal(n) {
    var s = ["th", "st", "nd", "rd"],
        v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
}