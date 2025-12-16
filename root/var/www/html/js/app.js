/**
 * Main application JavaScript for the Uploader Dashboard
 *
 * Note: Common utility functions have been moved to utils.js
 * This file now focuses on application-specific functionality
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
  initializeTheme();

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
  loadAppVersion();
  // Initial data fetching
  handleInProgressJobs();
  handleCompletedJobList();
  checkStatus();
  updateRealTimeStats();
}

/**
 * Load the application version
 */
function loadAppVersion() {
  // Try dedicated API endpoint first
  fetch("srv/api/system/version.php")
    .then((response) => response.json())
    .then((data) => {
      if (data && data.version) {
        document.getElementById("app-version").textContent = "v" + data.version;
        console.log("Version loaded from API:", data.version);
      }
    })
    .catch((error) => {
      console.log("API version fetch failed, trying direct file");

      // Fallback to direct file access
      fetch("release.json")
        .then((response) => response.json())
        .then((data) => {
          if (data && data.newversion) {
            document.getElementById("app-version").textContent =
              "v" + data.newversion;
            console.log("Version loaded from file:", data.newversion);
          } else {
            throw new Error("Invalid release.json format");
          }
        })
        .catch((fallbackError) => {
          console.error("Version fetch failed:", fallbackError);
          // Set a hardcoded version as last resort
          document.getElementById("app-version").textContent = "v4.0.0";
        });
    });
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

  setupSettingsModal();

  // Theme selection - uses function from utils.js
  setupThemeEventListeners();

  // Sidebar accordion toggles
  $(".sidebar-section-header").on("click", function () {
    const targetId = $(this).data("target");
    const $content = $("#" + targetId);
    // Use a more specific selector to target only the chevron icon
    const $chevronIcon = $(this).find("i.fa-chevron-up, i.fa-chevron-down");

    if ($content.hasClass("active")) {
      $content.removeClass("active");
      $chevronIcon.removeClass("fa-chevron-up").addClass("fa-chevron-down");
      $(this).attr("aria-expanded", "false");
    } else {
      $content.addClass("active");
      $chevronIcon.removeClass("fa-chevron-down").addClass("fa-chevron-up");
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
 * Settings Modal and Tabbed Interface Functionality
 */
function setupSettingsModal() {
  // Modal open/close
  $("#settings-toggle").on("click", function () {
    $("#settings-modal").addClass("active");
    $("#modal-overlay").addClass("active");
  });

  $("#modal-close, #modal-overlay").on("click", function () {
    $("#settings-modal").removeClass("active");
    $("#modal-overlay").removeClass("active");
  });

  // Close modal when clicking outside of it
  $(document).on("click", function (event) {
    if (
      $("#settings-modal").hasClass("active") &&
      !$(event.target).closest(".modal-content").length &&
      !$(event.target).closest("#settings-toggle").length
    ) {
      $("#settings-modal").removeClass("active");
      $("#modal-overlay").removeClass("active");
    }
  });

  // Prevent closing when clicking inside modal content
  $(".modal-content").on("click", function (event) {
    event.stopPropagation();
  });

  // Tab switching
  $(".tab-button").on("click", function () {
    const targetId = $(this).data("target");

    // Update active state for buttons
    $(".tab-button").removeClass("active");
    $(this).addClass("active");

    // Update active state for content
    $(".tab-content").removeClass("active");
    $("#" + targetId).addClass("active");
  });

  // Submit handling for forms in tabs
  $(".tab-content form").on("submit", function (e) {
    e.preventDefault();

    // Get form ID to determine which settings to update
    const formId = $(this).attr("id");

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
        '<tr><td colspan="6" class="no-uploads-message">No uploads in progress</td></tr>'
      );
      $("#download_rate").text("0.00");
      $("#active-count-badge").text("0");
      return;
    }

    // Process and display each job
    $.each(json.jobs, function (index, data) {
      // Parse upload speed
      let uploadRateNumeric = 0;
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
          uploadRateNumeric = rate;
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

      // Create a new row based on the template
      const template = document.getElementById("upload-row-template");
      if (!template) {
        console.error("Upload row template not found");
        return;
      }

      // Clone the template content
      const rowNode = template.content.cloneNode(true);

      // Fill in the data
      rowNode.querySelector(".file-name").textContent = data.file_name;
      rowNode.querySelector(".folder-name").textContent = data.drive;
      rowNode.querySelector(".key-name").textContent = data.gdsa;
      rowNode.querySelector(".progress-percentage").textContent =
        data.upload_percentage;
      rowNode.querySelector(".progress-bar").style.width =
        data.upload_percentage;
      rowNode
        .querySelector(".progress-bar")
        .classList.remove(
          "bg-success",
          "bg-warning",
          "bg-danger",
          "bg-secondary"
        );
      rowNode.querySelector(".progress-bar").classList.add(progressClass);
      rowNode
        .querySelector(".progress-bar")
        .setAttribute("aria-valuenow", progress);
      rowNode.querySelector(".file-size").textContent = data.file_size;

      // Format the time remaining and speed
      const timeRemainingEl = rowNode.querySelector(".time-remaining");
      const uploadSpeedEl = rowNode.querySelector(".upload-speed");

      timeRemainingEl.textContent = data.upload_remainingtime;
      uploadSpeedEl.innerHTML = `<i class="fas fa-tachometer-alt"></i> ${data.upload_speed}`;

      // Add a color class based on upload speed
      if (uploadRateNumeric < 5) {
        uploadSpeedEl.classList.add("speed-low");
      } else if (uploadRateNumeric < 20) {
        uploadSpeedEl.classList.add("speed-medium");
      } else {
        uploadSpeedEl.classList.add("speed-high");
      }

      // Append the row to the table
      $tableBody.append(rowNode);
    });

    // Update the upload rate display
    totalUploadRate = totalUploadRate.toFixed(2);
    $("#download_rate").text(totalUploadRate);
    $("#active-count-badge").text(json.jobs.length);

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
                    <td data-title="Time spent">${
                      job.time_elapsed || "n/a"
                    }</td>
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

      // Pass false as second parameter since this is an automatic check, not user action
      alignPauseControl(json.status, false);
    })
    .fail(function (jqXHR, textStatus, errorThrown) {
      console.error("Failed to check status:", textStatus, errorThrown);
    });
}

// Play/Pause button handler
function alignPauseControl(status, fromUserAction = false) {
  console.log("Aligning pause control to status:", status);

  const $control = $("#control > span");
  const $icon = $control.find("i");

  if (status === "STARTED") {
    // If uploader is RUNNING, show PAUSE icon (so user can pause it)
    $icon.removeClass("fa-play").addClass("fa-pause");
    $control.removeClass("bg-danger").addClass("bg-success");
    $control.attr("aria-label", "Pause uploads");

    if (fromUserAction) {
      showStatusMessage("Uploader is running");
    }
  } else if (status === "STOPPED") {
    // If uploader is STOPPED, show PLAY icon (so user can resume it)
    $icon.removeClass("fa-pause").addClass("fa-play");
    $control.removeClass("bg-success").addClass("bg-danger");
    $control.attr("aria-label", "Resume uploads");

    if (fromUserAction) {
      showStatusMessage("Uploader is paused");
    }
  }
}

/**
 * Update the pause/play control based on service status
 */
function setupPauseControl() {
  $("#control > span").on("click", function () {
    console.log("Pause/play button clicked");

    // Determine action based on current state
    const $icon = $(this).find("i");

    // If we see pause icon, clicking means we want to pause
    // If we see play icon, clicking means we want to resume
    const action = $icon.hasClass("fa-pause") ? "pause" : "continue";

    console.log("Icon class:", $icon.attr("class"), "Action:", action);

    // Visual feedback while processing
    const $button = $(this);
    $button.css("opacity", "0.5").css("pointer-events", "none");

    // Send request to API
    $.ajax({
      type: "POST",
      url: "srv/api/system/status.php",
      data: { action: action },
      dataType: "json",
      success: function (data) {
        console.log("Status update response:", data);
        if (data && data.status) {
          alignPauseControl(data.status, true);
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

  // Add a safety timeout to restore button state even if AJAX fails
  const resetTimeout = setTimeout(() => {
    $submitBtn.prop("disabled", false).text(originalText);
    console.log("Button state restored by safety timeout");
  }, 8000);

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
        updateEnvSettingsLegacy(
          formId,
          settings,
          $submitBtn,
          originalText,
          function (success) {
            if (!success) {
              showStatusMessage(
                "Failed to update settings: " +
                  (response.message || "Unknown error"),
                true
              );
            }
          }
        );
      }
    },
    error: function (xhr, status, error) {
      console.error("Failed to use new settings API:", status, error);
      // Try legacy API as fallback
      updateEnvSettingsLegacy(
        formId,
        settings,
        $submitBtn,
        originalText,
        function (success) {
          if (!success) {
            showStatusMessage("Failed to communicate with the server", true);
            console.error("Response:", xhr.responseText);
          }
        }
      );
    },
    complete: function () {
      // Clear the safety timeout
      clearTimeout(resetTimeout);
      // Restore button state
      $submitBtn.prop("disabled", false).text(originalText);
      console.log("Button state restored in complete callback");
    },
  });
}

/**
 * Legacy method to update environment settings
 * @param {string} formId - Form ID
 * @param {Object} settings - Settings object
 * @param {jQuery} $submitBtn - Submit button jQuery object
 * @param {string} originalText - Original button text
 * @param {Function} callback - Callback function
 */
function updateEnvSettingsLegacy(
  formId,
  settings,
  $submitBtn,
  originalText,
  callback
) {
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
    complete: function () {
      // Also restore button state in legacy handler
      if ($submitBtn && originalText) {
        $submitBtn.prop("disabled", false).text(originalText);
        console.log("Button state restored in legacy complete callback");
      }
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
 * Wrapper function for handleCompletedJobList to match the naming convention used in views
 */
function handleCompletedJobs() {
  return handleCompletedJobList();
}

/**
 * Load and display queued jobs
 * Note: Currently there's no dedicated queue API, so this displays a message
 */
function handleQueuedJobs() {
  const $tbody = $("#queue-table");

  if (!$tbody.length) {
    console.warn("Queue table not found");
    return;
  }

  // Show loading state
  $tbody.html(
    '<tr><td colspan="4" class="text-center">Loading queue data...</td></tr>'
  );

  // Note: There's currently no queue API endpoint
  // This would need to be implemented on the backend
  // For now, show a placeholder message
  setTimeout(() => {
    $tbody.html(
      '<tr><td colspan="4" class="text-center">Queue functionality coming soon</td></tr>'
    );
  }, 500);
}
