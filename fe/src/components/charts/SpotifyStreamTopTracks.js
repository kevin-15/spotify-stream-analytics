import React, { useState, useEffect } from 'react';
import 'rsuite/dist/styles/rsuite-default.css';
import { Message, Loader, Table, Icon, IconButton, List, Grid, Row, Col } from 'rsuite';
const { Column, HeaderCell, Cell } = Table;
const columns = [
    { key: 'isrc', label: "ISRC", flexGrow: 0 },
    { key: 'index', label: "Rank", flexGrow: 1 },
    { key: 'tracktitle', label: "Track", flexGrow: 2 },
    // { key: 'albumtitle', label: "Album" },
    { key: 'artist', label: "Artist(s)", flexGrow: 1 },
    { key: 'streamTotal', label: "Streams", flexGrow: 1 },
    { key: 'saveTotal', label: "Saves", flexGrow: 1 },
    { key: 'skipTotal', label: "Skips", flexGrow: 1 }
]
const rowKey = 'isrc';

const ExpandCell = ({ rowData, dataKey, expandedRowKeys, onChange, ...props }) => (
    <Cell {...props}>
        <IconButton
            size="md"
            id="expand-icon"
            appearance="subtle"
            onClick={() => {
                onChange(rowData);
            }}
            icon={
                <Icon
                    icon={
                        expandedRowKeys.some(key => key === rowData[rowKey])
                            ? 'minus-square-o'
                            : 'plus-square-o'
                    }
                />
            }
        />
    </Cell>
);

export const SpotifyStreamTopTracksTable = ({ data }) => {

    const [tableData, setTableData] = useState([])
    const [tableLoading, setTableLoading] = useState(false)
    const [sortColumn, setSortColumn] = useState('streamTotal')
    const [sortType, setSortType] = useState('asc')
    const [tableDataRenderedFlag, setTableDataRenderedFlag] = useState(false)
    const [expandedRowKeys, setexpandedRowKeys] = useState([])

    const LoadingPanel = () => {
        return (
            <Loader size="md" content="Generating Top Tracks table.." />
        )
    }

    useEffect(() => {
        sortData(sortColumn, sortType)
    }, [data.dataTopTracks]);


    const sortData = (col, type) => {
        const sorted = data.dataTopTracks.sort(function (a, b) {
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



    const handleExpanded = (rowData, dataKey) => {

        let open = false;
        const nextExpandedRowKeys = [];

        expandedRowKeys.forEach(key => {
            if (key === rowData[rowKey]) {
                open = true;
            } else {
                nextExpandedRowKeys.push(key);
            }
        });

        if (!open) {
            nextExpandedRowKeys.push(rowData[rowKey]);
        }
        setexpandedRowKeys(nextExpandedRowKeys)
    }

    if (data.dataTopTracks.length > 0 && !tableDataRenderedFlag) {
        setTableData(data.dataTopTracks)
        setTableDataRenderedFlag(true)
    }

    return (
        <div id="highchartDataPerCountry" >
            {
                data.isTopTracksError ? <Message type="warning" description={data.topTracksError} /> :
                    (data.isTopTracksLoading ? <LoadingPanel /> :
                        <Grid fluid>
                            <Row>
                                <Col xs={24} className="chartNameContainer">
                                    <p className="chartName">Top Tracks</p>
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
                                        rowKey={rowKey}
                                        expandedRowKeys={expandedRowKeys}
                                        onSortColumn={handleSortColumn}
                                        loading={tableLoading}
                                        renderRowExpanded={rowData => {
                                            return (
                                                <div style={{ paddingLeft: '6rem', position: 'absolute', top: '0.25rem', backgroundColor: '#eee', width: '88%' }}>
                                                    <div
                                                        style={{
                                                            height: '6rem',
                                                            float: 'left',
                                                            marginRight: 10,
                                                            background: '#eee'
                                                        }}
                                                    >
                                                        <img alt="" src={rowData.track_art} style={{ width: '95px' }} />
                                                    </div>
                                                    <List>
                                                        <List.Item>
                                                            <Icon icon='barcode' size="lg" className='expandItemIcons' /><b>{rowData.isrc}</b>
                                                        </List.Item>
                                                        <List.Item>
                                                            <Icon icon='spotify' size="lg" className='expandItemIcons' /><b>{rowData.albumtitle}</b>
                                                        </List.Item>
                                                    </List>
                                                </div>
                                            );
                                        }}
                                    >
                                        {
                                            columns.map((column, i) => {
                                                const sortable = ['isrc', 'index', 'tracktitle', 'artist'].includes(column.key) ? false : true
                                                const cellData = column.key
                                                const flexGrow = column.flexGrow
                                                const headerName = cellData === 'isrc' ? '#' : column.label

                                                let customCell = <Cell dataKey={cellData} />
                                                if (cellData === 'isrc') {
                                                    customCell = <ExpandCell
                                                        dataKey={cellData}
                                                        expandedRowKeys={expandedRowKeys}
                                                        onChange={handleExpanded}
                                                    />
                                                }

                                                if (['tracktitle', 'artist'].includes(cellData)) {
                                                    customCell = <Cell dataKey={cellData}>
                                                        {rowData => (
                                                            <span>{rowData[cellData].replace(/\\'/g, "'")}</span>
                                                        )}
                                                    </Cell>
                                                }

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