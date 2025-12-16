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
            error_log("Database file not found: " . DATABASE);
            $response->total_count = 0;
            return json_encode($response);
        }

        // Check if database is readable
        if (!is_readable(DATABASE)) {
            error_log("Database file not readable: " . DATABASE);
            $response->total_count = 0;
            return json_encode($response);
        }

        $db = new SQLite3(DATABASE, SQLITE3_OPEN_READONLY);

        // Check if completed_uploads table exists
        $tableCheck = $db->querySingle("SELECT name FROM sqlite_master WHERE type='table' AND name='completed_uploads'");
        if (!$tableCheck) {
            error_log("Table 'completed_uploads' not found in database");
            $db->close();
            $response->total_count = 0;
            return json_encode($response);
        }

        $pagination_query = "";
        $count_result = $db->query("SELECT count(*) as COUNT FROM completed_uploads");

        if (!$count_result) {
            error_log("Count query failed: " . $db->lastErrorMsg());
            $db->close();
            $response->total_count = 0;
            return json_encode($response);
        }

        //Check GET parameter..
        $countRow = $count_result->fetchArray();
        $total_records = $countRow ? $countRow['COUNT'] : 0;
        $response->total_count = $total_records; // Save total completed job count to let frontend calculate pagination

        if (
            isset($_GET["pageNumber"]) && isset($_GET["pageSize"])
            && is_numeric($_GET["pageNumber"]) && is_numeric($_GET["pageSize"]) && $total_records >= 5
        ) {
            $current_page = intval($_GET["pageNumber"]);
            $page_size = intval($_GET["pageSize"]);
            $total_pages = ceil($total_records / $page_size);
            // Validate parameters and default them if necessary
            if ($current_page > $total_pages) {
                $current_page = $total_pages;
            }
            if ($current_page < 1) {
                $current_page = 1;
            }
            if ($page_size > 50 || $page_size < 1) {
                $page_size = 10;
            }

            // Slice the data
            $offset = ($current_page - 1) * $page_size;
            $pagination_query .= " LIMIT $page_size OFFSET $offset ";
        }

        $results = $db->query("SELECT drive, filedir, filebase, filesize, gdsa, starttime, endtime, status
           FROM completed_uploads ORDER BY endtime DESC " . $pagination_query);

        if (!$results) {
            error_log("Query failed: " . $db->lastErrorMsg());
            $db->close();
            return json_encode($response);
        }

        while ($row = $results->fetchArray()) {
            try {
                $jobStatus = new UploadJobStatus();
                $jobStatus->job_last_update_timestamp = $row['endtime'];
                $jobStatus->job_name = $row['filebase'];
                $jobStatus->drive = $row['drive'];
                $jobStatus->gdsa = $row['gdsa'];
                $jobStatus->file_directory = $row['filedir'];
                $jobStatus->file_name = $row['filebase'];
                $jobStatus->file_size = $row['filesize'];

                $jobStatus->time_end = date('d.m.y H:i:s', $row['endtime']);
                $jobStatus->time_end_clean = secs_to_str(time() - $row['endtime']) . ' ago';
                $jobStatus->time_start = $row['starttime'];
                $jobStatus->time_elapsed = secs_to_str($row['endtime'] - $row['starttime']);
                $jobStatus->successful = $row['status'] === 1;
                $response->jobs[] = $jobStatus;
            } catch (Exception $e) {
                error_log("Error processing job row: " . $e->getMessage());
            }
        }

        $db?->close();
        unset($db);
    } catch (Exception $e) {
        error_log("Error in processJsonFiles: " . $e->getMessage());
        $response->total_count = 0;
    }

    return json_encode($response);
}

/** actual logic */
header('Content-Type: application/json; charset=utf-8');
echo processJsonFiles();
