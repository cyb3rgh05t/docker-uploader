<?php
include_once('../../../settings.php');
include_once('../../entities/ApiResponse.php');
include_once('../../entities/UploadJobStatus.php');
include_once('../../utility.php');

function processJsonFiles()
{
    $response = new ApiResponse();
    $response->jobs = [];

    try {
        // Check if database file exists
        if (!file_exists(DATABASE)) {
            error_log("Database file does not exist: " . DATABASE);
            $response->error = "Database file not found";
            return json_encode($response);
        }

        // Check if database is readable
        if (!is_readable(DATABASE)) {
            error_log("Database file is not readable: " . DATABASE);
            $response->error = "Database file not readable";
            return json_encode($response);
        }

        $db = new SQLite3(DATABASE, SQLITE3_OPEN_READONLY);

        // Check if uploads table exists
        $tableCheck = $db->querySingle("SELECT name FROM sqlite_master WHERE type='table' AND name='uploads'");
        if (!$tableCheck) {
            error_log("Table 'uploads' does not exist in database");
            $response->error = "Table 'uploads' not found";
            $response->total_count = 0;
            $db->close();
            return json_encode($response);
        }

        $results = $db->query("SELECT drive, filedir, filebase, filesize, gdsa, logfile FROM uploads");

        if (!$results) {
            error_log("Query failed: " . $db->lastErrorMsg());
            $response->error = "Query failed: " . $db->lastErrorMsg();
            $response->total_count = 0;
            $db->close();
            return json_encode($response);
        }

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
                error_log("Error processing job: " . $e->getMessage());
            }
        }

        $response->total_count = isset($response->jobs) ? count($response->jobs) : 0;

        $db->close();
        unset($db);
    } catch (Exception $e) {
        error_log("Error in processJsonFiles: " . $e->getMessage());
        $response->error = "Error: " . $e->getMessage();
        $response->total_count = 0;
    }

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
