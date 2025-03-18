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

// Update the document ready function to hide the upload history chart
$(document).ready(function () {
  // Hide the upload history card as it's not needed
  $(".card:has(#upload-history-chart)").hide();

  // Initialize the app
  initializeApp();

  // Load current theme from localStorage or use default
  const savedTheme = getUserSetting("theme", "orange");
  setTheme(savedTheme);

  // Setup event listeners
  setupEventListeners();

  // Start periodic updates
  startPeriodicUpdates();

  // Toggle prettyEndTime checkbox to use relative time by default
  if ($("#prettyEndTime").is(":checked")) {
    $("#prettyEndTime").prop("checked", false);
  }
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

  // Form submissions - with improved handling
  setupFormSubmissions();

  // Fix notification form issues
  fixNotificationForm();

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

  // Setup pause control
  setupPauseControl();

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
 * Special handling for form submissions
 */
function setupFormSubmissions() {
  // Form submissions
  $(".settings-form").on("submit", function (e) {
    e.preventDefault();

    // Get form ID to determine which settings to update
    const formId = $(this).attr("id");

    // Skip notification form as it has special handling
    if (formId === "notification-form") {
      return;
    }

    // Serialize form data
    const formData = {};
    const formArray = $(this).serializeArray();

    // Convert form data to a simple object
    formArray.forEach((item) => {
      // Convert form field names to uppercase as the backend expects them that way
      formData[item.name.toUpperCase()] = item.value;
    });

    // Update environment file with new settings
    updateEnvSettings(formId, formData);
  });
}

/**
 * Special handling for notification form to prevent conflicts
 */
function fixNotificationForm() {
  // Prevent ServerName from affecting Notification URL
  $("#notification_servername").on("change", function () {
    // This empty handler prevents any automatic updates that might happen
    console.log("ServerName changed to:", $(this).val());
  });

  // Ensure both fields get submitted separately
  $("#notification-form").on("submit", function (e) {
    e.preventDefault();

    const serverName = $("#notification_servername").val();
    const notificationUrl = $("#notification_url").val();

    console.log("Submitting notification form with separate values:", {
      serverName: serverName,
      notificationUrl: notificationUrl,
    });

    const formData = {
      NOTIFICATION_SERVERNAME: serverName,
      NOTIFICATION_URL: notificationUrl,
      NOTIFICATION_LEVEL: $("#notification_level").val(),
    };

    updateEnvSettings("notification-form", formData);
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
  if (typeof updateChartThemeColors === "function") {
    updateChartThemeColors();
  }
}

/**
 * Save a user setting to localStorage
 * @param {string} key - Setting key
 * @param {any} value - Setting value
 */
function saveUserSetting(key, value) {
  try {
    localStorage.setItem(`uploader_${key}`, JSON.stringify(value));
  } catch (e) {
    console.warn("Failed to save setting to localStorage:", e);
  }
}

/**
 * Get a user setting from localStorage
 * @param {string} key - Setting key
 * @param {any} defaultValue - Default value if setting not found
 * @returns {any} The setting value or default
 */
function getUserSetting(key, defaultValue) {
  try {
    const value = localStorage.getItem(`uploader_${key}`);
    return value !== null ? JSON.parse(value) : defaultValue;
  } catch (e) {
    console.warn("Failed to get setting from localStorage:", e);
    return defaultValue;
  }
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

// Update handleCompletedJobList to use relative date by default
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
      // Note: We've flipped the display format - now we show relative time by default
      $.each(data, function (index, job) {
        // Use time_end_clean (relative time) by default, only switch if prettyEndTime is checked
        const endTime = $("#prettyEndTime").is(":checked")
          ? job.time_end
          : job.time_end_clean;
        const rowClass = job.successful === true ? "" : "table-danger";

        $completedTableBody.append(`
                <tr class="${rowClass}">
                  <td data-title="Filename" class="truncate">${
                    job.file_name
                  }</td>
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

// Enhanced status check function
function checkStatus() {
  console.log("Checking uploader status");

  $.getJSON("srv/api/system/status.php")
    .done(function (json) {
      console.log("Status response:", json);

      if (json === undefined || json.status === "UNKNOWN") {
        console.warn("Unable to check status");
        return;
      }

      alignPauseControl(json.status);
    })
    .fail(function (jqXHR, textStatus, errorThrown) {
      console.error("Failed to check status:", textStatus, errorThrown);
    });
}

/**
 * Update the pause/play control based on service status
 * @param {string} status - Service status (STARTED or STOPPED)
 */
// Play/Pause button handler
function setupPauseControl() {
  $("#control > span").on("click", function () {
    console.log("Pause/play button clicked");

    // Determine action based on current state
    const $icon = $(this).find("i");
    const action = $icon.hasClass("fa-play") ? "pause" : "continue";

    // Visual feedback while processing
    const $button = $(this);
    $button.css("opacity", "0.5").css("pointer-events", "none");

    console.log("Sending action:", action);

    // Send request to API
    $.ajax({
      type: "POST",
      url: "srv/api/system/status.php",
      data: { action: action },
      dataType: "json",
      success: function (data) {
        console.log("Status update response:", data);
        if (data && data.status) {
          alignPauseControl(data.status);
        } else {
          console.error("Invalid response from status API");
        }
      },
      error: function (xhr, status, error) {
        console.error("Failed to update status:", error);
        console.log("Response:", xhr.responseText);
        showStatusMessage(
          "Failed to update status. Check console for details.",
          true
        );
      },
      complete: function () {
        // Reset button appearance
        $button.css("opacity", "1").css("pointer-events", "auto");
      },
    });
  });
}

// Update the UI based on the current status
function alignPauseControl(status) {
  console.log("Aligning pause control to status:", status);

  const $control = $("#control > span");
  const $icon = $control.find("i");

  if (status === "STARTED") {
    $icon.removeClass("fa-pause").addClass("fa-play");
    $control.removeClass("bg-danger").addClass("bg-success");
    $control.attr("aria-label", "Pause uploads");
    //showStatusMessage("Uploader is running");
  } else if (status === "STOPPED") {
    $icon.removeClass("fa-play").addClass("fa-pause");
    $control.removeClass("bg-success").addClass("bg-danger");
    $control.attr("aria-label", "Resume uploads");
    showStatusMessage("Uploader is paused");
  }
}

// Update the updateRealTimeStats function
function updateRealTimeStats() {
  // Get current upload rate
  const currentRate = $("#download_rate").text() || "0.00";
  $("#current-rate").text(`${currentRate} MB/s`);

  // Get active uploads count
  const activeUploads =
    $("#uploadsTable tbody tr").not(':contains("No uploads")').length || 0;
  $("#active-count").text(activeUploads);

  // Update queue stats separately - don't use active uploads count
  updateQueueStats();

  // Set the current max active transfers
  const maxTransfers =
    uploaderApp.envSettings.TRANSFERS || $("#transfers").val() || "2";
  $("#active-max").text(`Max: ${maxTransfers}`);

  // Set the bandwidth limit
  const bandwidthLimit =
    uploaderApp.envSettings.BANDWIDTH_LIMIT ||
    $("#bandwidth_limit").val() ||
    "30";
  $("#rate-limit").text(`Limit per Transfer: ${bandwidthLimit}`);
}

/**
 * Load environment settings from the server
 */
function loadEnvSettings() {
  // First try the new API endpoint
  $.getJSON("srv/api/settings/update.php")
    .done(function (data) {
      if (data && data.success && data.settings) {
        uploaderApp.envSettings = data.settings;

        // Populate form fields with loaded settings
        populateFormFields(data.settings);

        // Update UI elements that depend on settings
        updateUIFromSettings(data.settings);
      } else {
        console.warn(
          "New settings API returned invalid data, falling back to legacy endpoint"
        );
        loadEnvSettingsLegacy();
      }
    })
    .fail(function () {
      console.warn(
        "New settings API not available, falling back to legacy endpoint"
      );
      loadEnvSettingsLegacy();
    });
}

/**
 * Legacy method to load environment settings
 * This will be used if the new API is not available
 */
function loadEnvSettingsLegacy() {
  $.getJSON("srv/api/system/env_settings.php")
    .done(function (data) {
      if (data && typeof data === "object") {
        uploaderApp.envSettings = data;

        // Populate form fields with loaded settings
        populateFormFields(data);

        // Update UI elements that depend on settings
        updateUIFromSettings(data);
      } else {
        console.warn("Failed to load environment settings from legacy API");
      }
    })
    .fail(function () {
      console.warn("Failed to load environment settings from any API");

      // Use default values for essential settings
      const defaultSettings = {
        TRANSFERS: 2,
        BANDWIDTH_LIMIT: "30M",
        FOLDER_DEPTH: 1,
        MIN_AGE_UPLOAD: 1,
      };

      uploaderApp.envSettings = defaultSettings;
      populateFormFields(defaultSettings);
      updateUIFromSettings(defaultSettings);
    });
}

/**
 * Populate form fields with settings
 * @param {Object} settings - Settings object
 */
function populateFormFields(settings) {
  Object.entries(settings).forEach(([key, value]) => {
    // Try to find the form field (case insensitive)
    const $field = $(`[name="${key}"], [name="${key.toLowerCase()}"]`);

    if ($field.length) {
      if ($field.is("select")) {
        $field.val(value.toString());
      } else if ($field.is(":checkbox")) {
        $field.prop("checked", value === true || value === "true");
      } else {
        $field.val(value);
      }
    }
  });
}

/**
 * Update UI elements based on loaded settings
 * @param {Object} settings - Settings object
 */
function updateUIFromSettings(settings) {
  // Update max transfers display
  if (settings.TRANSFERS || settings.transfers) {
    const transfers = settings.TRANSFERS || settings.transfers;
    $("#active-max").text(`Max: ${transfers}`);
  }

  // Update bandwidth limit display
  if (settings.BANDWIDTH_LIMIT || settings.bandwidth_limit) {
    const bwLimit = settings.BANDWIDTH_LIMIT || settings.bandwidth_limit;
    // Remove quotes if present
    const cleanBwLimit = bwLimit.replace(/"/g, "");
    $("#rate-limit").text(`Limit per Transfer: ${cleanBwLimit}`);
  }
}

/**
 * Update environment settings
 * @param {string} formId - Form ID that was submitted
 * @param {Object} settings - Settings to update
 */
function updateEnvSettings(formId, settings) {
  console.log("Updating settings:", settings);

  // Create a loading indicator
  const $form = $(`#${formId}`);
  const $submitBtn = $form.find('button[type="submit"]');
  const originalText = $submitBtn.text();
  $submitBtn.prop("disabled", true).text("Saving...");

  // Special handling for BANDWIDTH_LIMIT
  if (
    settings.BANDWIDTH_LIMIT !== undefined &&
    settings.BANDWIDTH_LIMIT !== "null" &&
    settings.BANDWIDTH_LIMIT !== "" &&
    !/[KMG]$/i.test(settings.BANDWIDTH_LIMIT)
  ) {
    // Append 'M' if no unit is specified
    settings.BANDWIDTH_LIMIT = settings.BANDWIDTH_LIMIT + "M";
    console.log("Added M suffix to bandwidth limit:", settings.BANDWIDTH_LIMIT);
  }

  // Make actual API call to update env settings
  $.ajax({
    url: "srv/api/system/update_env.php",
    type: "POST",
    data: JSON.stringify(settings),
    contentType: "application/json",
    dataType: "json",
    success: function (response) {
      console.log("API response:", response);

      if (response.success) {
        showStatusMessage("Settings updated successfully!");

        // Update local settings
        Object.assign(uploaderApp.envSettings, settings);

        // Update UI based on form ID
        switch (formId) {
          case "transfer-form":
            // Update transfer settings UI
            $("#active-max").text(`Max: ${settings.TRANSFERS || "2"}`);
            $("#rate-limit").text(
              `Limit per Transfer: ${settings.BANDWIDTH_LIMIT || "30M"}`
            );
            break;

          case "system-form":
            // Update system settings UI if needed
            break;

          case "notification-form":
            // Update notification settings UI if needed
            break;

          case "autoscan-form":
            // Update autoscan settings UI if needed
            break;

          case "security-form":
            // Update security settings UI if needed
            break;
        }
      } else {
        // Try legacy API if new one fails
        updateEnvSettingsLegacy(formId, settings, function (success) {
          if (!success) {
            showStatusMessage(
              "Failed to update settings: " +
                (response.message || "Unknown error"),
              true
            );
          }
        });
      }
    },
    error: function (xhr, status, error) {
      console.error("Failed to use new settings API:", status, error);
      // Try legacy API as fallback
      updateEnvSettingsLegacy(formId, settings, function (success) {
        if (!success) {
          showStatusMessage("Failed to communicate with the server", true);
          console.error("Response:", xhr.responseText);
        }
      });
    },
    complete: function () {
      // Restore button state
      $submitBtn.prop("disabled", false).text(originalText);
    },
  });
}

/**
 * Legacy method to update environment settings
 * @param {string} formId - Form ID
 * @param {Object} settings - Settings object
 * @param {Function} callback - Callback function
 */
function updateEnvSettingsLegacy(formId, settings, callback) {
  // Convert settings keys to lowercase for legacy API
  const legacySettings = {};
  Object.keys(settings).forEach((key) => {
    legacySettings[key.toLowerCase()] = settings[key];
  });

  $.ajax({
    url: "srv/api/system/update_env.php",
    type: "POST",
    data: JSON.stringify(legacySettings),
    contentType: "application/json",
    dataType: "json",
    success: function (response) {
      if (response.success) {
        showStatusMessage("Settings updated successfully!");

        // Update local settings
        Object.assign(uploaderApp.envSettings, settings);

        // Update UI based on form ID
        switch (formId) {
          case "transfer-form":
            $("#active-max").text(`Max: ${legacySettings.transfers || "2"}`);
            $("#rate-limit").text(
              `Limit per Transfer: ${legacySettings.bandwidth_limit || "30M"}`
            );
            break;
        }

        if (callback) callback(true);
      } else {
        if (callback) callback(false);
      }
    },
    error: function () {
      if (callback) callback(false);
    },
  });
}

function updateQueueStats() {
  $.getJSON("srv/api/jobs/queue_stats.php", function (data) {
    if (data && typeof data === "object") {
      // Update the queue count
      $("#queue-count").text(data.count || 0);

      // Format the total size nicely
      const totalSize = formatFileSize(data.total_size || 0);
      $("#queue-total").text(`Total: ${totalSize}`);
    }
  }).fail(function () {
    // Fallback if API doesn't exist yet
    console.log("Queue stats API not available, using fallback method");
    estimateQueueStats();
  });
}

// Fallback method to estimate queue stats until API is available
function estimateQueueStats() {
  // Use the uploads table as a fallback
  $.getJSON("srv/api/jobs/inprogress.php", function (data) {
    const queueCount = data.jobs ? data.jobs.length : 0;
    $("#queue-count").text(queueCount);

    let totalSize = 0;
    if (data.jobs && data.jobs.length > 0) {
      data.jobs.forEach(function (job) {
        totalSize += parseFileSize(job.file_size);
      });
    }

    $("#queue-total").text(`Total: ${formatFileSize(totalSize)}`);
  });
}

/**
 * Display a status message to the user
 * @param {string} message - Message to display
 * @param {boolean} isError - Whether this is an error message
 */
function showStatusMessage(message, isError = false) {
  const $statusMessage = $("#status-message");

  if (!$statusMessage.length) {
    console.error("Status message element not found");
    console.log(message);
    return;
  }

  $statusMessage.text(message);

  if (isError) {
    $statusMessage.addClass("error");
  } else {
    $statusMessage.removeClass("error");
  }

  $statusMessage.css("display", "block");

  // Hide after 3 seconds
  setTimeout(function () {
    $statusMessage.css("display", "none");
  }, 3000);
}

// File size formatter helper function
function formatFileSize(bytes) {
  if (bytes === 0) return "0 B";

  const sizes = ["B", "KB", "MB", "GB", "TB", "PB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));

  return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + " " + sizes[i];
}

// Parse file size string to bytes
function parseFileSize(sizeStr) {
  if (!sizeStr) return 0;

  const match = sizeStr.match(/^([0-9.]+)\s*([KMGT]i?B?)?$/i);
  if (!match) return 0;

  const num = parseFloat(match[1]);
  const unit = match[2] ? match[2].toUpperCase() : "B";

  switch (unit) {
    case "B":
      return num;
    case "KB":
    case "KIB":
      return num * 1024;
    case "MB":
    case "MIB":
      return num * 1024 * 1024;
    case "GB":
    case "GIB":
      return num * 1024 * 1024 * 1024;
    case "TB":
    case "TIB":
      return num * 1024 * 1024 * 1024 * 1024;
    default:
      return num;
  }
}
