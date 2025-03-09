/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { useParams } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import { useSnackbar } from './SnackbarContext.ts'
import {
    Alert,
    Box,
    CircularProgress,
    Divider,
    Grid2 as Grid,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableRow,
    Typography,
} from '@mui/material'
import { Texts } from '../constant.ts'
import { queryStatusApi, QueryStatusInfo, Session } from '../api/webapp/api.ts'
import { ApiResponse } from '../api/base.ts'
import {
    formatCount,
    formatDataSize,
    formatShortDateTime,
    parseAndFormatDataSize,
    parseDataSize,
} from '../utils/utils.ts'

interface IQueryStatus {
    info: QueryStatusInfo | null

    lastRefresh: number | null
}

export const QueryOverview = () => {
    const { showSnackbar } = useSnackbar()
    const { queryId } = useParams()
    const [queryStatus, setQueryStatus] = useState<IQueryStatus>({
        info: null,
        lastRefresh: null,
    })
    const [loading, setLoading] = useState<boolean>(true)
    const [error, setError] = useState<string | null>(null)
    const queryStatusRef = useRef(queryStatus)

    useEffect(() => {
        queryStatusRef.current = queryStatus
    }, [queryStatus])

    useEffect(() => {
        const runLoop = () => {
            const queryEnded = !!queryStatusRef.current.info?.finalQueryInfo
            if (!queryEnded) {
                getQueryStatus()
                setTimeout(runLoop, 3000)
            }
        }
        runLoop()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
        if (error) {
            showSnackbar(error, 'error')
        }
    }, [error, showSnackbar])

    const getQueryStatus = () => {
        setError(null)
        if (queryId) {
            queryStatusApi(queryId).then((apiResponse: ApiResponse<QueryStatusInfo>) => {
                setLoading(false)
                if (apiResponse.status === 200 && apiResponse.data) {
                    const newQueryStatusInfo: QueryStatusInfo = apiResponse.data
                    setQueryStatus((prevQueryStatus) => {
                        return {
                            info: newQueryStatusInfo,

                            lastRefresh: Date.now(),
                        }
                    })
                } else {
                    setError(`${Texts.Error.Communication} ${apiResponse.status}: ${apiResponse.message}`)
                }
            })
        }
    }

    const renderSessionProperties = (session: Session) => {
        return (
            <>
                {Object.entries(session.systemProperties).map(([key, value]) => (
                    <div key={key}>
                        {key}={value}
                    </div>
                ))}
                {Object.entries(session.catalogProperties).map(([key, value]) => (
                    <div key={key}>
                        {key}={value}
                    </div>
                ))}
            </>
        )
    }

    const taskRetriesEnabled = queryStatus.info?.retryPolicy == 'TASK'
    return (
        <>
            {loading && <CircularProgress />}
            {error && <Alert severity="error">{Texts.Error.QueryInformationNotLoaded}</Alert>}

            {!loading && !error && queryStatus.info && (
                <Grid container spacing={3}>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Box sx={{ pt: 2 }}>
                            <Typography variant="h6">Session</Typography>
                            <Divider />
                        </Box>
                        <TableContainer>
                            <Table aria-label="simple table">
                                <TableBody>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 'bold' }}>User</TableCell>
                                        <TableCell>{queryStatus.info.session.user}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Principal</TableCell>
                                        <TableCell>{queryStatus.info.session.principal}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Source</TableCell>
                                        <TableCell>{queryStatus.info.session.source}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Catalog</TableCell>
                                        <TableCell>{queryStatus.info.session.catalog}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Schema</TableCell>
                                        <TableCell>{queryStatus.info.session.schema}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Time zone</TableCell>
                                        <TableCell>{queryStatus.info.session.timeZone}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Client address</TableCell>
                                        <TableCell>{queryStatus.info.session.remoteUserAddress}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Client tags</TableCell>
                                        <TableCell>{queryStatus.info.session.clientTags.join(', ')}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Protocol encoding</TableCell>
                                        <TableCell>
                                            {queryStatus.info.session.queryDataEncoding
                                                ? 'spooled ' + queryStatus.info.session.queryDataEncoding
                                                : 'non-spooled'}
                                        </TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Session properties</TableCell>
                                        <TableCell>{renderSessionProperties(queryStatus.info.session)}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Resource estimates</TableCell>
                                        <TableCell></TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <Box sx={{ pt: 2 }}>
                            <Typography variant="h6">Execution</Typography>
                            <Divider />
                        </Box>
                        <TableContainer>
                            <Table aria-label="simple table">
                                <TableBody>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Resource group</TableCell>
                                        <TableCell>
                                            {queryStatus.info.resourceGroupId
                                                ? queryStatus.info.resourceGroupId.join('.')
                                                : 'n/a'}
                                        </TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Submission time</TableCell>
                                        <TableCell>
                                            {formatShortDateTime(new Date(queryStatus.info.queryStats.createTime))}
                                        </TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Completion time</TableCell>
                                        <TableCell>
                                            {queryStatus.info.queryStats.endTime
                                                ? formatShortDateTime(new Date(queryStatus.info.queryStats.endTime))
                                                : ''}
                                        </TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Elapsed time</TableCell>
                                        <TableCell>{queryStatus.info.queryStats.elapsedTime}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Queued time</TableCell>
                                        <TableCell>{queryStatus.info.queryStats.queuedTime}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Elapsed time</TableCell>
                                        <TableCell>{queryStatus.info.queryStats.elapsedTime}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Planned time</TableCell>
                                        <TableCell>{queryStatus.info.queryStats.planningTime}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Execution time</TableCell>
                                        <TableCell>{queryStatus.info.queryStats.executionTime}</TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <Box sx={{ pt: 2 }}>
                            <Typography variant="h6">Resource utilization</Typography>
                            <Divider />
                        </Box>
                        <TableContainer>
                            <Table aria-label="simple table">
                                <TableBody>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 'bold' }}>CPU time</TableCell>
                                        <TableCell>{queryStatus.info.queryStats.totalCpuTime}</TableCell>
                                        {taskRetriesEnabled && (
                                            <TableCell>{queryStatus.info.queryStats.failedCpuTime}</TableCell>
                                        )}
                                    </TableRow>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Planning CPU time</TableCell>
                                        <TableCell>{queryStatus.info.queryStats.planningCpuTime}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Scheduled time</TableCell>
                                        <TableCell>{queryStatus.info.queryStats.totalScheduledTime}</TableCell>
                                        {taskRetriesEnabled && (
                                            <TableCell>{queryStatus.info.queryStats.failedScheduledTime}</TableCell>
                                        )}
                                    </TableRow>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Input rows</TableCell>
                                        <TableCell>
                                            {formatCount(queryStatus.info.queryStats.processedInputPositions)}
                                        </TableCell>
                                        {taskRetriesEnabled && (
                                            <TableCell>
                                                {queryStatus.info.queryStats.failedProcessedInputPositions}
                                            </TableCell>
                                        )}
                                    </TableRow>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Input data</TableCell>
                                        <TableCell>
                                            {parseAndFormatDataSize(queryStatus.info.queryStats.processedInputDataSize)}
                                        </TableCell>
                                        {taskRetriesEnabled && (
                                            <TableCell>
                                                {queryStatus.info.queryStats.failedProcessedInputDataSize}
                                            </TableCell>
                                        )}
                                    </TableRow>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Physical input rows</TableCell>
                                        <TableCell>
                                            {formatCount(queryStatus.info.queryStats.physicalInputPositions)}
                                        </TableCell>
                                        {taskRetriesEnabled && (
                                            <TableCell>
                                                {queryStatus.info.queryStats.failedPhysicalInputPositions}
                                            </TableCell>
                                        )}
                                    </TableRow>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Physical input data</TableCell>
                                        <TableCell>
                                            {parseAndFormatDataSize(queryStatus.info.queryStats.physicalInputDataSize)}
                                        </TableCell>
                                        {taskRetriesEnabled && (
                                            <TableCell>
                                                {queryStatus.info.queryStats.failedPhysicalInputDataSize}
                                            </TableCell>
                                        )}
                                    </TableRow>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Physical input read time</TableCell>
                                        <TableCell>{queryStatus.info.queryStats.physicalInputReadTime}</TableCell>
                                        {taskRetriesEnabled && (
                                            <TableCell>
                                                {queryStatus.info.queryStats.failedPhysicalInputReadTime}
                                            </TableCell>
                                        )}
                                    </TableRow>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Internal network rows</TableCell>
                                        <TableCell>
                                            {formatCount(queryStatus.info.queryStats.internalNetworkInputPositions)}
                                        </TableCell>
                                        {taskRetriesEnabled && (
                                            <TableCell>
                                                {formatCount(
                                                    queryStatus.info.queryStats.failedInternalNetworkInputPositions
                                                )}
                                            </TableCell>
                                        )}
                                    </TableRow>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Internal network data</TableCell>
                                        <TableCell>
                                            {parseAndFormatDataSize(
                                                queryStatus.info.queryStats.internalNetworkInputDataSize
                                            )}
                                        </TableCell>
                                        {taskRetriesEnabled && (
                                            <TableCell>
                                                {parseAndFormatDataSize(
                                                    queryStatus.info.queryStats.failedInternalNetworkInputDataSize
                                                )}
                                            </TableCell>
                                        )}
                                    </TableRow>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Peak user memory</TableCell>
                                        <TableCell>
                                            {parseAndFormatDataSize(
                                                queryStatus.info.queryStats.peakUserMemoryReservation
                                            )}
                                        </TableCell>
                                    </TableRow>
                                    {queryStatus.info.queryStats.peakRevocableMemoryReservation &&
                                        parseDataSize(queryStatus.info.queryStats.peakRevocableMemoryReservation) >
                                            0 && (
                                            <TableRow>
                                                <TableCell sx={{ fontWeight: 'bold' }}>Peak Revocable Memory</TableCell>
                                                <TableCell>
                                                    {parseAndFormatDataSize(
                                                        queryStatus.info.queryStats.peakRevocableMemoryReservation
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Peak total memory</TableCell>
                                        <TableCell>
                                            {parseAndFormatDataSize(
                                                queryStatus.info.queryStats.peakTotalMemoryReservation
                                            )}
                                        </TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Cumulative user memory</TableCell>
                                        <TableCell>
                                            {formatDataSize(queryStatus.info.queryStats.cumulativeUserMemory / 1000.0) +
                                                '*seconds'}
                                        </TableCell>
                                        {taskRetriesEnabled && (
                                            <TableCell>
                                                {formatDataSize(
                                                    queryStatus.info.queryStats.failedCumulativeUserMemory / 1000.0
                                                ) + '*seconds'}
                                            </TableCell>
                                        )}
                                    </TableRow>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Output rows</TableCell>
                                        <TableCell>
                                            {formatCount(queryStatus.info.queryStats.outputPositions)}
                                        </TableCell>
                                        {taskRetriesEnabled && (
                                            <TableCell>
                                                {formatCount(queryStatus.info.queryStats.failedOutputPositions)}
                                            </TableCell>
                                        )}
                                    </TableRow>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Output data</TableCell>
                                        <TableCell>
                                            {parseAndFormatDataSize(queryStatus.info.queryStats.outputDataSize)}
                                        </TableCell>
                                        {taskRetriesEnabled && (
                                            <TableCell>
                                                {parseAndFormatDataSize(
                                                    queryStatus.info.queryStats.failedOutputDataSize
                                                )}
                                            </TableCell>
                                        )}
                                    </TableRow>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Written rows</TableCell>
                                        <TableCell>
                                            {formatCount(queryStatus.info.queryStats.writtenPositions)}
                                        </TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Logical written data</TableCell>
                                        <TableCell>
                                            {parseAndFormatDataSize(queryStatus.info.queryStats.logicalWrittenDataSize)}
                                        </TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Physical written data</TableCell>
                                        <TableCell>
                                            {parseAndFormatDataSize(
                                                queryStatus.info.queryStats.physicalWrittenDataSize
                                            )}
                                        </TableCell>
                                        {taskRetriesEnabled && (
                                            <TableCell>
                                                {parseAndFormatDataSize(
                                                    queryStatus.info.queryStats.failedPhysicalWrittenDataSize
                                                )}
                                            </TableCell>
                                        )}
                                    </TableRow>
                                    {queryStatus.info.queryStats.spilledDataSize &&
                                        parseDataSize(queryStatus.info.queryStats.spilledDataSize) > 0 && (
                                            <TableRow>
                                                <TableCell sx={{ fontWeight: 'bold' }}>Spilled data</TableCell>
                                                <TableCell>
                                                    {parseAndFormatDataSize(
                                                        queryStatus.info.queryStats.spilledDataSize
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <Box sx={{ pt: 2 }}>
                            <Typography variant="h6">Timeline</Typography>
                            <Divider />
                        </Box>
                        <TableContainer>
                            <Table aria-label="simple table">
                                <TableBody>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Parallelism</TableCell>
                                        <TableCell></TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Scheduled time/s</TableCell>
                                        <TableCell></TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Input rows/s</TableCell>
                                        <TableCell></TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Grid>
                </Grid>
            )}
        </>
    )
}
