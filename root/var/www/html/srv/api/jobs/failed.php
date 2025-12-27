<?php
include_once('../../../settings.php');
include_once('../../entities/ApiResponse.php');
include_once('../../entities/UploadJobStatus.php');
include_once('../../utility.php');

function getFailedUploads()
{
    $response = new ApiResponse();
    $response->jobs = [];

    try {
        $db = new SQLite3(DATABASE, SQLITE3_OPEN_READONLY);
        $db->busyTimeout(5000); // Wait up to 5 seconds if database is locked

        $pagination_query = "";
        $count_result = $db->query("SELECT count(*) as COUNT FROM completed_uploads WHERE status = 0");
        $total_records = $count_result->fetchArray()['COUNT'];
        $response->total_count = $total_records;

        // Handle pagination
        if (
            isset($_GET["pageNumber"]) && isset($_GET["pageSize"])
            && is_numeric($_GET["pageNumber"]) && is_numeric($_GET["pageSize"]) && $total_records >= 5
        ) {
            $current_page = intval($_GET["pageNumber"]);
            $page_size = intval($_GET["pageSize"]);
            $total_pages = ceil($total_records / $page_size);

            if ($current_page > $total_pages) {
                $current_page = $total_pages;
            }
            if ($current_page < 1) {
                $current_page = 1;
            }
            if ($page_size > 50 || $page_size < 1) {
                $page_size = 10;
            }

            $offset = ($current_page - 1) * $page_size;
            $pagination_query .= " LIMIT $page_size OFFSET $offset ";
        }

        $results = $db->query("SELECT drive, filedir, filebase, filesize, gdsa, starttime, endtime, status, error
                               FROM completed_uploads 
                               WHERE status = 0 
                               ORDER BY endtime DESC " . $pagination_query);

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
                $jobStatus->successful = false; // Always false for failed uploads
                $jobStatus->error_message = $row['error']; // Include error message
                $response->jobs[] = $jobStatus;
            } catch (Exception $e) {
                //TODO: Error handling.. logfile?
            }
        }

        $db?->close();
        unset($db);
        return json_encode($response);
    } catch (Exception $e) {
        error_log("Database error in failed.php: " . $e->getMessage());
        $response->total_count = 0;
        return json_encode($response);
    }
}

/** actual logic */
header('Content-Type: application/json; charset=utf-8');
echo getFailedUploads();
