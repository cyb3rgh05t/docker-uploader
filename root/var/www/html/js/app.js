/**
 * Main application JavaScript for the Uploader Dashboard
 */

// Store global data
const uploaderApp = {
  activePage: 1,
  pageSize: 10,
  completedTodayCount: 0,
  completedTodaySize: 0,
  // Store env settings loaded from the API
  envSettings: {},
  // Interval IDs for periodic updates
  intervals: {
    inProgress: null,
    completed: null,
    stats: null,
  },
};

$(document).ready(function () {
  // Initial setup
  initializeApp();

  // Load current theme from localStorage or use default
  const savedTheme = getUserSetting("theme", "orange");
  setTheme(savedTheme);

  // Setup event listeners
  setupEventListeners();

  // Start periodic updates
  startPeriodicUpdates();

  // Create mock chart for upload history visualization
  setTimeout(() => {
    createMockUploadChart("upload-history-chart", "week");
  }, 500);
});

/**
 * Initialize the application
 */
function initializeApp() {
  // Load environment settings
  loadEnvSettings();

  // Initial data fetching
  handleInProgressJobs();
  handleCompletedJobList();
  checkStatus();
  updateRealTimeStats();
}

/**
 * Set up all event listeners
 */
function setupEventListeners() {
  // Sidebar toggle
  $("#sidebar-toggle").on("click", function () {
    $("#sidebar").addClass("active");
    $("#overlay").addClass("active");
  });

  $("#sidebar-close, #overlay").on("click", function () {
    $("#sidebar").removeClass("active");
    $("#overlay").removeClass("active");
  });

  // Theme selection
  $(".theme-option").on("click", function () {
    const theme = $(this).data("theme");
    setTheme(theme);
    saveUserSetting("theme", theme);
  });

  // Sidebar accordion toggles
  $(".sidebar-section-header").on("click", function () {
    const targetId = $(this).data("target");
    const $content = $("#" + targetId);
    const $icon = $(this).find("i:last-child");

    if ($content.hasClass("active")) {
      $content.removeClass("active");
      $icon.removeClass("fa-chevron-up").addClass("fa-chevron-down");
      $(this).attr("aria-expanded", "false");
    } else {
      $content.addClass("active");
      $icon.removeClass("fa-chevron-down").addClass("fa-chevron-up");
      $(this).attr("aria-expanded", "true");
    }
  });

  // Form submissions
  $(".settings-form").on("submit", function (e) {
    e.preventDefault();

    // Get form ID to determine which settings to update
    const formId = $(this).attr("id");

    // Serialize form data
    const formData = new FormData(this);
    const settings = {};

    // Convert FormData to a simple object
    for (const [key, value] of formData.entries()) {
      settings[key] = value;
    }

    // Update environment file with new settings
    updateEnvSettings(formId, settings);
  });

  // Play/Pause button
  $("#control > span").on("click", function () {
    const action = $(this).find("i").hasClass("fa-play") ? "pause" : "continue";

    $.ajax({
      type: "POST",
      url: "srv/api/system/status.php",
      data: {
        action: action,
      },
      success: function (data) {
        alignPauseControl(data.status);
      },
    });
  });

  // Clear history button
  $("#clnHist").on("click", function () {
    $.ajax({
      type: "POST",
      url: "srv/api/system/clean_history.php",
      success: function () {
        handleCompletedJobList();
        showStatusMessage("Upload history cleared successfully");
      },
      error: function () {
        showStatusMessage("Failed to clear upload history", true);
      },
    });
  });

  // Toggle time format
  $("#prettyEndTime").on("click", function () {
    handleCompletedJobList();
  });

  // Page size selection
  $("#pageSize > li.page-item").on("click", function () {
    $("#pageSize > li.page-item.active").removeClass("active");
    $(this).addClass("active");
    uploaderApp.pageSize = parseInt($(this).find("a").text());
    saveUserSetting("pageSize", uploaderApp.pageSize);
    handleCompletedJobList();
  });

  // Chart time range selector
  $("#chart-timerange").on("change", function () {
    const timeRange = $(this).val();
    createMockUploadChart("upload-history-chart", timeRange);
    saveUserSetting("chartTimeRange", timeRange);
  });
}

/**
 * Set the theme for the application
 * @param {string} theme - Theme name
 */
function setTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  $(".theme-option").removeClass("active");
  $(`.theme-option[data-theme="${theme}"]`).addClass("active");

  // Update chart colors when theme changes
  updateChartThemeColors();
}

/**
 * Start all periodic update intervals
 */
function startPeriodicUpdates() {
  // Clear any existing intervals
  stopPeriodicUpdates();

  // Set new intervals
  uploaderApp.intervals.inProgress = setInterval(handleInProgressJobs, 1000);
  uploaderApp.intervals.stats = setInterval(updateRealTimeStats, 2000);
  uploaderApp.intervals.status = setInterval(checkStatus, 30000);
}

/**
 * Stop all periodic update intervals
 */
function stopPeriodicUpdates() {
  Object.values(uploaderApp.intervals).forEach((interval) => {
    if (interval) clearInterval(interval);
  });
}

/**
 * Handle in-progress uploads display
 */
function handleInProgressJobs() {
  $.getJSON("srv/api/jobs/inprogress.php", function (json) {
    const $tableBody = $("#uploadsTable > tbody");
    let totalUploadRate = 0;

    $tableBody.empty();

    if (!json.jobs || json.jobs.length === 0) {
      $tableBody.append(
        '<tr><td colspan="6" class="text-center">No uploads in progress</td></tr>'
      );
      $("#download_rate").text("0.00");
      return;
    }

    // Process and display each job
    $.each(json.jobs, function (index, data) {
      // Parse upload speed
      if (data.upload_speed) {
        const rateMatches = data.upload_speed.match(/([0-9+\.]+)([MKG])/);
        if (rateMatches) {
          let rate = Number(rateMatches[1]);
          // Convert to MB/s for consistent measurement
          if (rateMatches[2] === "K") {
            rate = rate / 1024;
          } else if (rateMatches[2] === "G") {
            rate = rate * 1024;
          }
          totalUploadRate += rate;
        }
      }

      // Calculate progress bar class based on percentage
      let progressClass = "bg-secondary";
      const progress = parseFloat(data.upload_percentage);

      if (progress < 30) {
        progressClass = "bg-danger";
      } else if (progress < 70) {
        progressClass = "bg-warning";
      } else {
        progressClass = "bg-success";
      }

      // Create table row with responsive data attributes
      $tableBody.append(`
          <tr>
            <td data-title="Filename" class="truncate">${data.file_name}</td>
            <td data-title="Folder" class="d-none d-lg-table-cell">${data.drive}</td>
            <td data-title="Key" class="d-none d-lg-table-cell">${data.gdsa}</td>
            <td data-title="Progress">
              <div class="progress">
                <div class="progress-bar ${progressClass}" role="progressbar"
                     style="width: ${data.upload_percentage};" 
                     aria-valuenow="${progress}" 
                     aria-valuemin="0" 
                     aria-valuemax="100">
                  ${data.upload_percentage}
                </div>
              </div>
            </td>
            <td data-title="Filesize" class="d-none d-lg-table-cell">${data.file_size}</td>
            <td data-title="Time Left" class="text-end">${data.upload_remainingtime} (with ${data.upload_speed})</td>
          </tr>
        `);
    });

    // Update the upload rate display
    totalUploadRate = totalUploadRate.toFixed(2);
    $("#download_rate").text(totalUploadRate);

    // Color-code the upload rate based on speed
    if (totalUploadRate < 5) {
      $("#download_rate")
        .removeClass("bg-success bg-warning")
        .addClass("bg-danger");
    } else if (totalUploadRate < 10) {
      $("#download_rate")
        .removeClass("bg-success bg-danger")
        .addClass("bg-warning");
    } else {
      $("#download_rate")
        .removeClass("bg-warning bg-danger")
        .addClass("bg-success");
    }
  });
}

/**
 * Handle completed uploads display with pagination
 */
function handleCompletedJobList() {
  const $completedTableBody = $("#completedTable > tbody");

  // Get previously saved page size or use default
  const savedPageSize = getUserSetting("pageSize", 10);

  // Find and activate the correct page size button
  $("#pageSize > li.page-item").removeClass("active");
  $(`#pageSize > li.page-item:contains("${savedPageSize}")`).addClass("active");

  // Initialize pagination
  $("#page").pagination({
    dataSource: "srv/api/jobs/completed.php",
    locator: "jobs",
    ulClassName: "pagination pagination-sm",
    totalNumberLocator: function (response) {
      return response.total_count;
    },
    pageSize: savedPageSize,
    beforePaging: function (pageNumber) {
      // Save current page
      uploaderApp.activePage = pageNumber;

      // Only enable auto-refresh for the first page
      if (pageNumber === 1) {
        if (!uploaderApp.intervals.completed) {
          uploaderApp.intervals.completed = setInterval(
            handleCompletedJobList,
            5000
          );
        }
      } else {
        clearInterval(uploaderApp.intervals.completed);
        uploaderApp.intervals.completed = null;
      }
    },
    afterPaging: function () {
      // After page changes, fetch complete upload stats for today
      fetchCompletedTodayStats();
    },
    callback: function (data, pagination) {
      // Add Bootstrap classes to pagination links
      $("#page").find("ul").children("li").addClass("page-item");
      $("#page").find("ul").children("li").children("a").addClass("page-link");

      $completedTableBody.empty();

      if (!data || data.length === 0) {
        $completedTableBody.append(
          '<tr><td colspan="6" class="text-center">No completed uploads</td></tr>'
        );
        $("#clnHist").hide();
        return;
      }

      $("#clnHist").show();

      // Process and display each completed job
      $.each(data, function (index, job) {
        const endTime = $("#prettyEndTime").is(":checked")
          ? job.time_end_clean
          : job.time_end;
        const rowClass = job.successful === true ? "" : "table-danger";

        $completedTableBody.append(`
            <tr class="${rowClass}">
              <td data-title="Filename" class="truncate">${job.file_name}</td>
              <td data-title="Folder">${job.drive}</td>
              <td data-title="Key">${job.gdsa}</td>
              <td data-title="Filesize">${job.file_size}</td>
              <td data-title="Time spent">${job.time_elapsed || "n/a"}</td>
              <td data-title="Uploaded">${endTime}</td>
            </tr>
          `);
      });

      // Fetch all completed uploads for today
      fetchCompletedTodayStats();
    },
  });
}

/**
 * Fetch statistics for all uploads completed today
 */
function fetchCompletedTodayStats() {
  $.getJSON("srv/api/jobs/completed_today_stats.php", function (data) {
    if (data && data.count !== undefined) {
      uploaderApp.completedTodayCount = data.count;
      uploaderApp.completedTodaySize = data.total_size || 0;

      // Update the stats display
      $("#completed-count").text(data.count);
      $("#completed-total").text(`Total: ${formatFileSize(data.total_size)}`);
    }
  }).fail(function () {
    // If the API doesn't exist yet, fall back to counting visible rows
    // This is a temporary solution until the API endpoint is implemented
    calculateCompletedTodayStats();
  });
}

/**
 * Calculate statistics for today's completed uploads from visible table rows
 * This is a fallback method used until the API endpoint is implemented
 */
function calculateCompletedTodayStats() {
  let completedToday = 0;
  let totalSize = 0;

  // Process visible completed uploads
  $("#completedTable tbody tr")
    .not(':contains("No completed")')
    .each(function () {
      const uploadedText = $(this).find("td:eq(5)").text();
      const sizeText = $(this).find("td:eq(3)").text();

      // Check if this upload happened today
      if (
        uploadedText.includes("ago") ||
        uploadedText.includes(new Date().toLocaleDateString())
      ) {
        completedToday++;

        // Parse the file size
        const size = parseFileSize(sizeText);
        totalSize += size;
      }
    });

  // Update the stats
  $("#completed-count").text(completedToday);
  $("#completed-total").text(`Total: ${formatFileSize(totalSize)}`);

  // Save to app state
  uploaderApp.completedTodayCount = completedToday;
  uploaderApp.completedTodaySize = totalSize;
}

/**
 * Check the uploader service status
 */
function checkStatus() {
  $.getJSON("srv/api/system/status.php", function (json) {
    if (json === undefined || json.status === "UNKNOWN") {
      console.log("Unable to check status");
      return;
    }

    alignPauseControl(json.status);
  });
}

/**
 * Update the pause/play control based on service status
 * @param {string} status - Service status (STARTED or STOPPED)
 */
function alignPauseControl(status) {
  const $control = $("#control > span");
  const $icon = $control.find("i");

  if (status === "STARTED") {
    $icon.removeClass("fa-pause").addClass("fa-play");
    $control.removeClass("bg-danger").addClass("bg-success");
    $control.attr("aria-label", "Pause uploads");
  } else if (status === "STOPPED") {
    $icon.removeClass("fa-play").addClass("fa-pause");
    $control.removeClass("bg-success").addClass("bg-danger");
    $control.attr("aria-label", "Resume uploads");
  }
}

/**
 * Update real-time statistics displayed in the dashboard
 */
function updateRealTimeStats() {
  // Get current upload rate
  const currentRate = $("#download_rate").text() || "0.00";
  $("#current-rate").text(`${currentRate} MB/s`);

  // Get active uploads count
  const activeUploads =
    $("#uploadsTable tbody tr").not(':contains("No uploads")').length || 0;
  $("#active-count").text(activeUploads);

  // Calculate queue count - temporarily same as active transfers until queue API is available
  $("#queue-count").text(activeUploads);

  // Calculate total file sizes in the queue
  let queueTotalBytes = 0;

  $("#uploadsTable tbody tr")
    .not(':contains("No uploads")')
    .each(function () {
      const sizeText = $(this).find("td:eq(4)").text();
      if (sizeText) {
        queueTotalBytes += parseFileSize(sizeText);
      }
    });

  if (queueTotalBytes > 0) {
    $("#queue-total").text(`Total: ${formatFileSize(queueTotalBytes)}`);
  } else {
    $("#queue-total").text("Total: 0 B");
  }

  // Set the current max active transfers
  const maxTransfers = $("#transfers").val() || "2";
  $("#active-max").text(`Max: ${maxTransfers}`);

  // Set the bandwidth limit
  const bandwidthLimit = $("#bandwidth_limit").val() || "30";
  $("#rate-limit").text(`Limit per Transfer: ${bandwidthLimit} MB/s`);
}

/**
 * Load environment settings from the server
 */
function loadEnvSettings() {
  $.getJSON("srv/api/system/env_settings.php")
    .done(function (data) {
      if (data && typeof data === "object") {
        uploaderApp.envSettings = data;

        // Populate form fields with loaded settings
        Object.entries(data).forEach(([key, value]) => {
          const $field = $(`[name="${key}"]`);
          if ($field.length) {
            if ($field.is("select")) {
              $field.val(value.toString());
            } else {
              $field.val(value);
            }
          }
        });
      }
    })
    .fail(function () {
      console.warn("Failed to load environment settings");
    });
}

/**
 * Update environment settings
 * @param {string} formId - Form ID that was submitted
 * @param {Object} settings - Settings to update
 */
function updateEnvSettings(formId, settings) {
  // API endpoint doesn't exist yet, so we'll simulate a successful update
  // In a production environment, this would be a real API call

  // For now, just update our local copy of settings
  Object.assign(uploaderApp.envSettings, settings);

  // Update UI based on form ID
  switch (formId) {
    case "transfer-form":
      // Update transfer settings UI
      $("#active-max").text(`Max: ${settings.transfers || "2"}`);
      $("#rate-limit").text(
        `Limit per Transfer: ${settings.bandwidth_limit || "30"} MB/s`
      );
      break;

    case "system-form":
      // Update system settings UI
      break;

    case "notification-form":
      // Update notification settings UI
      break;

    case "security-form":
      // Update security settings UI
      break;
  }

  // Show success message
  showStatusMessage("Settings updated successfully!");

  // In a real implementation, this would be the API call:
  /*
    $.ajax({
      url: 'srv/api/system/update_env.php',
      type: 'POST',
      data: JSON.stringify(settings),
      contentType: 'application/json',
      success: function(response) {
        if (response.success) {
          showStatusMessage('Settings updated successfully!');
          
          // Update local settings
          Object.assign(uploaderApp.envSettings, settings);
          
          // Update UI elements
          updateUIFromSettings();
        } else {
          showStatusMessage('Failed to update settings: ' + (response.message || 'Unknown error'), true);
        }
      },
      error: function() {
        showStatusMessage('Failed to communicate with the server', true);
      }
    });
    */
}
