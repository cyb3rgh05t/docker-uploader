<?php
include_once('../../../settings.php');
include_once('../../entities/ApiResponse.php');
include_once('../../entities/UploadJobStatus.php');
include_once('../../utility.php');

function processJsonFiles()
{
    $response = new ApiResponse();
    $response->jobs = [];
    $db = new SQLite3(DATABASE, SQLITE3_OPEN_READONLY);
    $results = $db->query("SELECT drive, filedir, filebase, filesize, gdsa, logfile FROM uploads");
    while ($row = $results->fetchArray()) {
        try {
            $jobStatus = new UploadJobStatus();
            $jobStatus->job_name = $row['filebase'];
            $jobStatus->drive = $row['drive'];
            $jobStatus->gdsa = $row['gdsa'];
            $jobStatus->file_directory = $row['filedir'];
            $jobStatus->file_name = $row['filebase'];
            $jobStatus->file_size = $row['filesize'];

            //Parse rclone logfile
            if ($row['logfile'] != null) {
                mapLogFileInformation($row['logfile'], $jobStatus);
                $response->jobs[] = $jobStatus;
            }
        } catch (Exception $e) {
            //TODO: Error handling
        }
    }

    $response->total_count = isset($response->jobs) ? count($response->jobs) : 0;

    $db?->close();
    unset($db);
    return json_encode($response);
}

function mapLogFileInformation($logfile, UploadJobStatus $jobStatus): UploadJobStatus
{
    $logBlock = readLastLines($logfile, 6, true);
    preg_match('/([0-9\%]+)\s\/\d+\.\d+\w{1,2}\,\s(\d+.\d+\w+\/s)\,\s([0-9dhms]+)/', $logBlock, $matches);
    if ($matches) {
        $jobStatus->upload_percentage = $matches[1];
        $jobStatus->upload_speed = $matches[2];
        $jobStatus->upload_remainingtime = $matches[3];
    } else {
        //Did not find any matches. It's likely to be a complete new upload
        $jobStatus->upload_percentage = '0%';
    }
    return $jobStatus;
}

/** actual logic */
header('Content-Type: application/json; charset=utf-8');
echo processJsonFiles();
