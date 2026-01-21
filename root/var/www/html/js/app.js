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
  // Current filter in history section
  historyFilter: "all",
  // Interval IDs for periodic updates
  intervals: {
    inProgress: null,
    completed: null,
    stats: null,
    queue: null,
    failedCount: null,
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

  // Initialize styled selects in settings
  initStyledSelects();

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
  handleQueueList();
  checkStatus();
  updateRealTimeStats();
  // Load dashboard recent activity
  loadDashboardActivity();
  // Load failed uploads count
  updateFailedCount();
}

/**
 * Load the application versions (WebUI and Uploader)
 */
function loadAppVersion() {
  let webuiVersion = null;
  let uploaderVersion = null;

  // Try dedicated API endpoint first
  fetch("srv/api/system/version.php")
    .then((response) => response.json())
    .then((data) => {
      if (data && data.webui_version && data.uploader_version) {
        webuiVersion = data.webui_version;
        uploaderVersion = data.uploader_version;

        // Update sidebar
        document.getElementById("webui-version").textContent =
          "v" + webuiVersion;
        document.getElementById("uploader-version").textContent =
          "v" + uploaderVersion;

        // Update about section
        const aboutWebui = document.getElementById("about-webui-version");
        const aboutUploader = document.getElementById("about-uploader-version");
        if (aboutWebui) aboutWebui.textContent = "v" + webuiVersion;
        if (aboutUploader) aboutUploader.textContent = "v" + uploaderVersion;

        console.log(
          "Versions loaded from API - WebUI:",
          webuiVersion,
          "Uploader:",
          uploaderVersion,
        );
        checkGitHubVersion(webuiVersion, uploaderVersion);
      } else if (data && data.version) {
        // Legacy single version format
        webuiVersion = data.version;
        uploaderVersion = data.version;
        document.getElementById("webui-version").textContent =
          "v" + webuiVersion;
        document.getElementById("uploader-version").textContent =
          "v" + uploaderVersion;
        console.log("Legacy version loaded from API:", data.version);
        checkGitHubVersion(webuiVersion, uploaderVersion);
      }
    })
    .catch((error) => {
      console.log("API version fetch failed, trying direct file");

      // Fallback to direct file access
      fetch("release.json")
        .then((response) => response.json())
        .then((data) => {
          if (data && data.webui_version && data.uploader_version) {
            webuiVersion = data.webui_version;
            uploaderVersion = data.uploader_version;

            document.getElementById("webui-version").textContent =
              "v" + webuiVersion;
            document.getElementById("uploader-version").textContent =
              "v" + uploaderVersion;

            const aboutWebui = document.getElementById("about-webui-version");
            const aboutUploader = document.getElementById(
              "about-uploader-version",
            );
            if (aboutWebui) aboutWebui.textContent = "v" + webuiVersion;
            if (aboutUploader)
              aboutUploader.textContent = "v" + uploaderVersion;

            console.log(
              "Versions loaded from file - WebUI:",
              webuiVersion,
              "Uploader:",
              uploaderVersion,
            );
            checkGitHubVersion(webuiVersion, uploaderVersion);
          } else if (data && data.newversion) {
            // Legacy format
            webuiVersion = data.newversion;
            uploaderVersion = data.newversion;
            document.getElementById("webui-version").textContent =
              "v" + webuiVersion;
            document.getElementById("uploader-version").textContent =
              "v" + uploaderVersion;
            console.log("Legacy version loaded from file:", data.newversion);
            checkGitHubVersion(webuiVersion, uploaderVersion);
          } else {
            throw new Error("Invalid release.json format");
          }
        })
        .catch((fallbackError) => {
          console.error("Version fetch failed:", fallbackError);
          // Set hardcoded versions as last resort
          webuiVersion = "5.0.0";
          uploaderVersion = "3.0.0";
          document.getElementById("webui-version").textContent =
            "v" + webuiVersion;
          document.getElementById("uploader-version").textContent =
            "v" + uploaderVersion;
          checkGitHubVersion(webuiVersion, uploaderVersion);
        });
    });
}

/**
 * Check GitHub for latest release version
 */
function checkGitHubVersion(webuiVersion, uploaderVersion) {
  const $statusBadge = $("#version-status");

  fetch(
    "https://api.github.com/repos/cyb3rgh05t/docker-uploader/releases/latest",
  )
    .then((response) => response.json())
    .then((data) => {
      if (data && data.tag_name) {
        const latestVersion = data.tag_name.replace(/^v/, "");
        // Compare using WebUI version as the main version indicator
        const current = webuiVersion.replace(/^v/, "");

        console.log(
          "Current WebUI version:",
          current,
          "Latest version:",
          latestVersion,
        );

        const versionComparison = compareVersions(current, latestVersion);

        if (versionComparison < 0) {
          // Update available
          $statusBadge.html('<i class="fas fa-arrow-up"></i>');
          $statusBadge
            .removeClass("up-to-date checking develop")
            .addClass("update-available");
          $statusBadge.attr("title", `New version ${latestVersion} available`);
        } else if (versionComparison > 0) {
          // Development version (ahead of latest release)
          $statusBadge.html('<i class="fas fa-code-branch"></i>');
          $statusBadge
            .removeClass("update-available checking up-to-date")
            .addClass("develop");
          $statusBadge.attr(
            "title",
            `Development build (ahead of v${latestVersion})`,
          );
        } else {
          // Up to date
          $statusBadge.html('<i class="fas fa-check"></i>');
          $statusBadge
            .removeClass("update-available checking develop")
            .addClass("up-to-date");
          $statusBadge.attr("title", "You are running the latest version");
        }
      } else {
        throw new Error("Invalid GitHub response");
      }
    })
    .catch((error) => {
      console.error("Failed to check GitHub version:", error);
      $statusBadge.html('<i class="fas fa-question"></i>');
      $statusBadge.removeClass("update-available checking up-to-date");
      $statusBadge.attr("title", "Unable to check for updates");
    });
}

/**
 * Compare two semantic version strings
 * Returns: -1 if v1 < v2, 0 if equal, 1 if v1 > v2
 */
function compareVersions(v1, v2) {
  const parts1 = v1.split(".").map(Number);
  const parts2 = v2.split(".").map(Number);

  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const part1 = parts1[i] || 0;
    const part2 = parts2[i] || 0;

    if (part1 < part2) return -1;
    if (part1 > part2) return 1;
  }

  return 0;
}

/**
 * Update failed uploads count badge
 */
function updateFailedCount() {
  fetch("srv/api/jobs/failed_count.php")
    .then((response) => response.json())
    .then((data) => {
      const count = data.count || 0;
      const $badge = $("#failed-count-badge");
      const $badgeCount = $("#failed-badge-count");

      $badgeCount.text(count);

      if (count > 0) {
        $badge.show();
      } else {
        $badge.hide();
      }
    })
    .catch((error) => {
      console.error("Failed to fetch failed uploads count:", error);
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

  // Setup pause control
  setupPauseControl();

  // Clear history dropdown toggle
  $("#clnHistToggle").on("click", function (e) {
    e.stopPropagation();
    $(".clear-history-menu").toggleClass("active");
    $(this).find(".dropdown-arrow").toggleClass("rotated");
  });

  // Close dropdown when clicking outside
  $(document).on("click", function (e) {
    if (!$(e.target).closest(".clear-history-dropdown").length) {
      $(".clear-history-menu").removeClass("active");
      $("#clnHistToggle .dropdown-arrow").removeClass("rotated");
    }
  });

  // Clear history menu item click
  $(".clear-history-item").on("click", function () {
    const type = $(this).data("type");
    const message =
      type === "failed"
        ? "Failed uploads cleared successfully"
        : "Upload history cleared successfully";

    $.ajax({
      type: "POST",
      url: "srv/api/system/clean_history.php",
      data: { type: type },
      success: function () {
        handleCompletedJobList();
        updateFailedCount();
        showToast(message, "success", 2500);
      },
      error: function () {
        showToast("Failed to clear upload history", "error", 3000);
      },
    });

    // Close dropdown
    $(".clear-history-menu").removeClass("active");
    $("#clnHistToggle .dropdown-arrow").removeClass("rotated");
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

  // History filter buttons
  $(".filter-btn").on("click", function () {
    $(".filter-btn").removeClass("active");
    $(this).addClass("active");
    uploaderApp.historyFilter = $(this).data("filter");
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
  let autoSaveTimeout = null;

  function collectFormData($form) {
    const formData = {};
    $form.find("input, select, textarea").each(function () {
      const $input = $(this);
      const name = $input.attr("name");
      if (name) {
        if ($input.is(":checkbox")) {
          formData[name.toUpperCase()] = $input.is(":checked")
            ? "true"
            : "false";
        } else {
          formData[name.toUpperCase()] = $input.val();
        }
      }
    });
    return formData;
  }

  function showAutoSaveIndicator() {
    showToast("Settings auto-saved successfully", "success", 2500);
  }

  $("#unified-settings-form").on(
    "change",
    "input, select, textarea",
    function () {
      const $form = $("#unified-settings-form");
      if (autoSaveTimeout) clearTimeout(autoSaveTimeout);
      autoSaveTimeout = setTimeout(() => {
        const formData = collectFormData($form);
        console.log("Auto-saving settings:", formData);
        $.ajax({
          url: "srv/api/system/update_env.php",
          method: "POST",
          data: JSON.stringify(formData),
          contentType: "application/json",
          success: function (response) {
            console.log("Auto-save successful:", response);
            showAutoSaveIndicator();
          },
          error: function (xhr, status, error) {
            console.error("Auto-save failed:", error);
          },
        });
      }, 1000);
    },
  );

  $("#unified-settings-form").on("submit", function (e) {
    e.preventDefault();
    const $form = $(this);
    const formData = collectFormData($form);
    console.log("Submitting unified settings:", formData);
    updateEnvSettings("unified-settings-form", formData);
  });
}

/**
 * Initialize styled selects in the settings form using a dropdown
 * layout similar to the theme selector. Keeps the original select hidden
 * and syncs value changes to trigger auto-save.
 */
function initStyledSelects() {
  const $form = $("#unified-settings-form");
  if ($form.length === 0) return;

  // Enhance each select with a styled dropdown
  $form.find(".form-group select").each(function () {
    const $select = $(this);
    if ($select.data("styled")) return; // avoid double init

    // Build dropdown structure
    const currentText = $select.find("option:selected").text();
    const $dropdown = $(`
      <div class="settings-dropdown">
        <button type="button" class="settings-select-btn" aria-haspopup="listbox" aria-expanded="false">
          <span class="selected-text"></span>
          <i class="fas fa-chevron-down"></i>
        </button>
        <div class="settings-dropdown-menu" role="listbox"></div>
      </div>
    `);

    $dropdown.find(".selected-text").text(currentText);

    const $menu = $dropdown.find(".settings-dropdown-menu");
    $select.find("option").each(function () {
      const value = $(this).attr("value");
      const label = $(this).text();
      const isSelected = $(this).is(":selected");
      const $item = $(
        `<div class="settings-dropdown-item" role="option" data-value="${value}">${label}</div>`,
      );
      if (isSelected) $item.addClass("active");
      $menu.append($item);
    });

    // Hide original select and insert dropdown after it
    $select.hide().after($dropdown);
    $select.data("styled", true);

    // Toggle menu
    const $btn = $dropdown.find(".settings-select-btn");
    $btn.on("click", function (e) {
      e.stopPropagation();
      const expanded = $(this).attr("aria-expanded") === "true";
      $(this).attr("aria-expanded", expanded ? "false" : "true");
      $menu.toggleClass("active", !expanded);
    });

    // Close when clicking outside
    $(document).on("click", function () {
      $menu.removeClass("active");
      $btn.attr("aria-expanded", "false");
    });

    // Select item
    $menu.on("click", ".settings-dropdown-item", function (e) {
      e.stopPropagation();
      const value = $(this).data("value");
      const label = $(this).text();
      $menu.find(".settings-dropdown-item").removeClass("active");
      $(this).addClass("active");
      $dropdown.find(".selected-text").text(label);
      $menu.removeClass("active");
      $btn.attr("aria-expanded", "false");
      // Update original select and trigger change for auto-save
      $select.val(value).trigger("change");
    });
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
  uploaderApp.intervals.queue = setInterval(handleQueueList, 5000);
  uploaderApp.intervals.stats = setInterval(updateRealTimeStats, 2000);
  uploaderApp.intervals.status = setInterval(checkStatus, 30000);
  uploaderApp.intervals.dashboard = setInterval(loadDashboardActivity, 5000);
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
        '<tr><td colspan="8" class="no-uploads-message text-center">No uploads in progress</td></tr>',
      );
      $("#download_rate").text("0.00");
      $("#current-rate").text("0.00 MB/s");
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
      // Remove folder prefix from directory path
      let directory = data.file_directory || "N/A";
      if (data.drive && directory.startsWith(data.drive + "/")) {
        directory = directory.substring(data.drive.length + 1);
      }
      rowNode.querySelector(".directory-name").textContent = directory;
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
          "bg-secondary",
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
      uploadSpeedEl.textContent = data.upload_speed;

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
    $("#current-rate").text(`${totalUploadRate} MB/s`);
    $("#overview-rate").text(`${totalUploadRate} MB/s`);
    $("#active-count-badge").text(json.jobs.length);

    // Store the rate for other functions to access
    uploaderApp.currentUploadRate = totalUploadRate;

    // Color-code the upload rate based on speed (if element exists)
    if ($("#download_rate").length > 0) {
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

  // Determine which API endpoint to use based on filter
  let apiEndpoint = "srv/api/jobs/completed.php";
  if (uploaderApp.historyFilter === "failed") {
    apiEndpoint = "srv/api/jobs/failed.php";
  }

  // Initialize pagination
  $("#page").pagination({
    dataSource: apiEndpoint,
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
            5000,
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
      // Also update failed count
      updateFailedCount();
    },
    callback: function (data, pagination) {
      // Add Bootstrap classes to pagination links
      $("#page").find("ul").children("li").addClass("page-item");
      $("#page").find("ul").children("li").children("a").addClass("page-link");

      $completedTableBody.empty();

      if (!data || data.length === 0) {
        const message =
          uploaderApp.historyFilter === "failed"
            ? "No failed uploads"
            : "No completed uploads";
        $completedTableBody.append(
          `<tr><td colspan="7" class="no-uploads-message text-center">${message}</td></tr>`,
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
        // Remove folder prefix from directory path
        let directory = job.file_directory || "N/A";
        if (job.drive && directory.startsWith(job.drive + "/")) {
          directory = directory.substring(job.drive.length + 1);
        }

        const row = $("<tr>").addClass(rowClass);
        row.append(
          $("<td>")
            .attr("data-title", "Filename")
            .addClass("truncate")
            .text(job.file_name),
        );
        row.append($("<td>").attr("data-title", "Folder").text(job.drive));
        row.append(
          $("<td>")
            .attr("data-title", "Directory")
            .addClass("truncate")
            .text(directory),
        );
        row.append($("<td>").attr("data-title", "Key").text(job.gdsa));
        row.append(
          $("<td>").attr("data-title", "Filesize").text(job.file_size),
        );
        row.append(
          $("<td>")
            .attr("data-title", "Time spent")
            .text(job.time_elapsed || "n/a"),
        );

        // Show error message in tooltip for failed uploads
        let uploadedCell = $("<td>")
          .attr("data-title", "Uploaded")
          .text(endTime);
        if (!job.successful && job.error_message) {
          uploadedCell.attr("title", job.error_message).addClass("has-error");
        }
        row.append(uploadedCell);

        $completedTableBody.append(row);
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
 * Handle queue list display
 */
function handleQueueList() {
  $.getJSON("srv/api/jobs/queue.php", function (json) {
    const $tableBody = $("#queueTable > tbody");
    $tableBody.empty();

    if (!json.success || !json.files || json.files.length === 0) {
      $tableBody.append(
        '<tr><td colspan="6" class="no-uploads-message text-center">No files in queue</td></tr>',
      );
      $("#queue-count-badge").text("0");
      return;
    }

    // Update badge count
    $("#queue-count-badge").text(json.files.length);

    // Process and display each queued file
    $.each(json.files, function (index, file) {
      const row = $("<tr>");

      // Position number
      row.append($("<td>").text(index + 1));

      // Filename
      row.append($("<td>").addClass("truncate").text(file.filename));

      // Folder (hidden on mobile)
      row.append(
        $("<td>")
          .addClass("d-none d-lg-table-cell")
          .text(file.drive || "N/A"),
      );

      // Directory (hidden on mobile) - remove folder prefix
      let directory = file.filedir || "/";
      if (file.drive && directory.startsWith(file.drive + "/")) {
        directory = directory.substring(file.drive.length + 1);
      }
      row.append(
        $("<td>").addClass("d-none d-lg-table-cell truncate").text(directory),
      );

      // Filesize (hidden on mobile) - format the size
      const formattedSize = formatFileSize(parseFileSize(file.filesize));
      row.append(
        $("<td>").addClass("d-none d-lg-table-cell").text(formattedSize),
      );

      // Added time
      const addedTime = file.created_at
        ? formatRelativeTime(file.created_at)
        : "Unknown";
      row.append($("<td>").text(addedTime));

      $tableBody.append(row);
    });
  }).fail(function (jqXHR, textStatus, errorThrown) {
    console.error("Failed to fetch queue list:", textStatus, errorThrown);
    const $tableBody = $("#queueTable > tbody");
    $tableBody.empty();
    $tableBody.append(
      '<tr><td colspan="6" class="no-uploads-message text-center">Error loading queue</td></tr>',
    );
  });
}

// Enhanced status check function
function checkStatus() {
  console.log("Checking uploader status");

  $.getJSON("srv/api/system/status.php")
    .done(function (json) {
      console.log("Status response:", json);

      if (json === undefined || json.status === "UNKNOWN") {
        console.warn("Unable to check status");
        updateStatusIndicator("error", "Unknown");
        return;
      }

      // Update pause control button
      alignPauseControl(json.status, false);

      // Update status indicator
      if (json.status === "STARTED") {
        updateStatusIndicator("active", "Active");
      } else if (json.status === "STOPPED") {
        updateStatusIndicator("paused", "Paused");
      } else {
        updateStatusIndicator("stopped", "Stopped");
      }
    })
    .fail(function (jqXHR, textStatus, errorThrown) {
      console.error("Failed to check status:", textStatus, errorThrown);
      updateStatusIndicator("error", "Error");
    });
}

// Play/Pause button handler
function alignPauseControl(status, fromUserAction = false) {
  console.log("Aligning pause control to status:", status);

  const $control = $("#control > button");
  const $icon = $control.find("i");
  const $text = $control.find("span");

  if (status === "STARTED") {
    // If uploader is RUNNING, show PAUSE icon (so user can pause it)
    $icon.removeClass("fa-play").addClass("fa-pause");
    $text.text("Pause");
    $control.removeClass("bg-danger").addClass("bg-success");
    $control.attr("aria-label", "Pause uploads");

    if (fromUserAction) {
      showToast("Uploader is running", "success");
      updateStatusIndicator("active", "Active");
    }
  } else if (status === "STOPPED") {
    // If uploader is STOPPED, show PLAY icon (so user can resume it)
    $icon.removeClass("fa-pause").addClass("fa-play");
    $text.text("Resume");
    $control.removeClass("bg-success").addClass("bg-danger");
    $control.attr("aria-label", "Resume uploads");

    if (fromUserAction) {
      showToast("Uploader is paused", "warning");
      updateStatusIndicator("paused", "Paused");
    }
  }
}

/**
 * Update the status indicator badge
 * @param {string} state - One of: 'active', 'paused', 'stopped', 'error'
 * @param {string} text - Text to display
 */
function updateStatusIndicator(state, text) {
  const $indicator = $("#status-indicator");
  const $statusText = $indicator.find(".status-text");

  // Remove all status classes
  $indicator.removeClass(
    "status-active status-paused status-stopped status-error",
  );

  // Add the new status class
  $indicator.addClass(`status-${state}`);

  // Update text
  $statusText.text(text);

  console.log(`Status indicator updated: ${state} - ${text}`);
}

/**
 * Update the pause/play control based on service status
 */
function setupPauseControl() {
  // Pause/Resume button click handler
  $("#control > button").on("click", function () {
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
        showToast(
          "Failed to update status. Check console for details.",
          "error",
        );
      },
      complete: function () {
        // Reset button appearance
        $button.css("opacity", "1").css("pointer-events", "auto");
      },
    });
  });

  // Status indicator click handler - triggers pause/resume
  $("#status-indicator").on("click", function () {
    console.log("Status indicator clicked - triggering pause/resume");
    $("#control > button").click();
  });
}

// Update the updateRealTimeStats function
function updateRealTimeStats() {
  // Get current upload rate from the app state or current-rate element
  const currentRate =
    uploaderApp.currentUploadRate || parseFloat($("#current-rate").text()) || 0;
  const currentRateStr =
    typeof currentRate === "number" ? currentRate.toFixed(2) : currentRate;

  // Update rate progress bar
  const bandwidthLimit = parseFloat(
    uploaderApp.envSettings.BANDWIDTH_LIMIT ||
      $("#bandwidth_limit").val() ||
      "30",
  );
  const rateValue = parseFloat(currentRateStr);
  const ratePercentage = Math.min((rateValue / bandwidthLimit) * 100, 100);
  $("#rate-progress .progress-bar-mini").css("width", ratePercentage + "%");

  // Get active uploads count
  const activeUploads =
    $("#uploadsTable tbody tr").not(':contains("No uploads")').length || 0;
  $("#active-count").text(activeUploads);

  // Update active count badge
  $("#active-count-badge").text(activeUploads);

  // Update overview cards
  $("#overview-active").text(activeUploads);

  // Update queue stats separately - don't use active uploads count
  updateQueueStats();

  // Set the current max active transfers
  const maxTransfers =
    uploaderApp.envSettings.TRANSFERS || $("#transfers").val() || "2";
  $("#active-max").text(`Max: ${maxTransfers}`);

  // Set the bandwidth limit
  $("#rate-limit").html(
    `<i class="fas fa-gauge-high"></i> Limit: ${bandwidthLimit} MB/s per transfer`,
  );

  // Update system overview
  updateSystemOverview();
}

/**
 * Update system overview card with uptime and storage info
 */
function updateSystemOverview() {
  // Update uptime and storage with a single API call
  fetch("srv/api/system/status.php")
    .then((response) => response.json())
    .then((data) => {
      console.log("System overview data:", data);

      if (data) {
        // Update uptime
        if (data.uptime) {
          $("#system-uptime").text(data.uptime);
        }

        // Update storage
        if (data.storage) {
          $("#storage-used").text(data.storage);
        }

        // Update system status with dynamic styling
        if (data.status) {
          const $statusValue = $("#system-status-mini");
          const $statusIcon = $("#system-status-icon");
          const $statusIconI = $statusIcon.find("i");

          // Check if there are active uploads
          const activeUploads =
            $("#uploadsTable tbody tr").not(':contains("No uploads")').length ||
            0;

          // Remove all color classes
          $statusValue.removeClass(
            "value-green value-red value-orange value-blue",
          );
          $statusIcon.removeClass(
            "gradient-green gradient-red gradient-orange gradient-blue",
          );

          if (data.status === "STARTED") {
            if (activeUploads > 0) {
              // Uploading state - green with arrow-up icon
              $statusValue.text("Uploading").addClass("value-green");
              $statusIcon.addClass("gradient-green");
              $statusIconI
                .removeClass("fa-times-circle fa-pause-circle fa-check-circle")
                .addClass("fa-arrow-up");
            } else {
              // Online but idle - green with check-circle icon
              $statusValue.text("Online").addClass("value-green");
              $statusIcon.addClass("gradient-green");
              $statusIconI
                .removeClass("fa-times-circle fa-pause-circle fa-arrow-up")
                .addClass("fa-check-circle");
            }
          } else if (data.status === "STOPPED") {
            $statusValue.text("Stopped").addClass("value-orange");
            $statusIcon.addClass("gradient-orange");
            $statusIconI
              .removeClass("fa-check-circle fa-times-circle fa-arrow-up")
              .addClass("fa-pause-circle");
          } else {
            $statusValue.text("Offline").addClass("value-red");
            $statusIcon.addClass("gradient-red");
            $statusIconI
              .removeClass("fa-check-circle fa-pause-circle fa-arrow-up")
              .addClass("fa-times-circle");
          }
        }
      }
    })
    .catch((error) => {
      console.error("Failed to fetch system overview:", error);

      // On error, show red error state
      const $statusValue = $("#system-status-mini");
      const $statusIcon = $("#system-status-icon");
      const $statusIconI = $statusIcon.find("i");

      $statusValue
        .removeClass("value-green value-orange")
        .addClass("value-red")
        .text("Error");
      $statusIcon
        .removeClass("gradient-green gradient-orange")
        .addClass("gradient-red");
      $statusIconI
        .removeClass("fa-check-circle fa-pause-circle")
        .addClass("fa-times-circle");

      $("#system-uptime").text("Error");
      $("#storage-used").text("Error");
    });
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
          "New settings API returned invalid data, falling back to legacy endpoint",
        );
        loadEnvSettingsLegacy();
      }
    })
    .fail(function () {
      console.warn(
        "New settings API not available, falling back to legacy endpoint",
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
        // If this select is styled, sync the visible dropdown text and active item
        const $dropdown = $field.next(".settings-dropdown");
        if ($dropdown.length) {
          const label = $field.find(`option[value="${value}"]`).text() || value;
          $dropdown.find(".selected-text").text(label);
          const $menu = $dropdown.find(".settings-dropdown-menu");
          $menu.find(".settings-dropdown-item").removeClass("active");
          $menu
            .find(`.settings-dropdown-item[data-value="${value}"]`)
            .addClass("active");
        }
      } else if ($field.is(":checkbox")) {
        $field.prop("checked", value === true || value === "true");
      } else {
        // Strip quotes from string values like "null"
        const cleanVal =
          typeof value === "string" ? value.replace(/"/g, "") : value;
        $field.val(cleanVal);
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

  // Refresh styled selects to reflect updated values
  $("#unified-settings-form select").each(function () {
    const $select = $(this);
    const $dropdown = $select.next(".settings-dropdown");
    if ($dropdown.length) {
      const value = $select.val();
      const label = $select.find(`option[value="${value}"]`).text() || value;
      $dropdown.find(".selected-text").text(label);
      const $menu = $dropdown.find(".settings-dropdown-menu");
      $menu.find(".settings-dropdown-item").removeClass("active");
      $menu
        .find(`.settings-dropdown-item[data-value="${value}"]`)
        .addClass("active");
    }
  });
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
        showToast("Settings updated successfully!", "success");

        // Update local settings
        Object.assign(uploaderApp.envSettings, settings);

        // Update UI based on form ID
        switch (formId) {
          case "transfer-form":
            // Update transfer settings UI
            $("#active-max").text(`Max: ${settings.TRANSFERS || "2"}`);
            $("#rate-limit").text(
              `Limit per Transfer: ${settings.BANDWIDTH_LIMIT || "30M"}`,
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
              showToast(
                "Failed to update settings: " +
                  (response.message || "Unknown error"),
                "error",
              );
            }
          },
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
            showToast("Failed to communicate with the server", "error", 3000);
            console.error("Response:", xhr.responseText);
          }
        },
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
  callback,
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
        showToast("Settings updated successfully!", "success");

        // Update local settings
        Object.assign(uploaderApp.envSettings, settings);

        // Update UI based on form ID
        switch (formId) {
          case "transfer-form":
            $("#active-max").text(`Max: ${legacySettings.transfers || "2"}`);
            $("#rate-limit").text(
              `Limit per Transfer: ${legacySettings.bandwidth_limit || "30M"}`,
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
      const queueCount = data.count || 0;
      $("#queue-count").text(queueCount);
      $("#overview-queue").text(queueCount);

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
    $("#overview-queue").text(queueCount);

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
 * Load dashboard activity sections
 */
function loadDashboardActivity() {
  loadDashboardQueue();
  loadDashboardActive();
  loadDashboardHistory();
}

/**
 * Load latest queue items for dashboard
 */
function loadDashboardQueue() {
  $.getJSON("srv/api/jobs/queue.php", function (data) {
    const $tbody = $("#dashboard-queue-table tbody");
    $tbody.empty();

    if (!data.files || data.files.length === 0) {
      $tbody.append(
        '<tr><td colspan="6" class="text-center">No files in queue</td></tr>',
      );
      return;
    }

    // Show only latest 5 items
    const files = data.files.slice(0, 5);
    files.forEach(function (file, index) {
      const size = formatFileSize(parseFileSize(file.filesize));
      // Remove folder prefix from directory path
      let directory = file.filedir || "/";
      if (file.drive && directory.startsWith(file.drive + "/")) {
        directory = directory.substring(file.drive.length + 1);
      }
      // Format the added time properly
      const time = file.created_at
        ? formatRelativeTime(file.created_at)
        : "N/A";
      const $row = $(`
        <tr>
          <td>${index + 1}</td>
          <td class="truncate">${escapeHtml(file.filename)}</td>
          <td>${escapeHtml(file.drive || "N/A")}</td>
          <td class="truncate">${escapeHtml(directory)}</td>
          <td>${size}</td>
          <td>${time}</td>
        </tr>
      `);
      $tbody.append($row);
    });
  }).fail(function () {
    $("#dashboard-queue-table tbody").html(
      '<tr><td colspan="6" class="text-center">Failed to load queue</td></tr>',
    );
  });
}

/**
 * Load latest active uploads for dashboard
 */
function loadDashboardActive() {
  $.getJSON("srv/api/jobs/inprogress.php", function (data) {
    const $tbody = $("#dashboard-active-table tbody");
    $tbody.empty();

    if (!data.jobs || data.jobs.length === 0) {
      $tbody.append(
        '<tr><td colspan="8" class="text-center">No active uploads</td></tr>',
      );
      return;
    }

    // Show only latest 5 items
    const jobs = data.jobs.slice(0, 5);
    jobs.forEach(function (job) {
      const size = job.file_size || "N/A";
      const progress = parseInt(job.upload_percentage) || 0;
      const speed = job.upload_speed || "0 MB/s";
      const timeLeft = job.upload_remainingtime || "N/A";
      // Remove folder prefix from directory path
      let directory = job.file_directory || "N/A";
      if (job.drive && directory.startsWith(job.drive + "/")) {
        directory = directory.substring(job.drive.length + 1);
      }

      const $row = $(`
        <tr>
          <td class="truncate">${escapeHtml(
            job.file_name || job.job_name || "Unknown",
          )}</td>
          <td>${escapeHtml(job.drive || "N/A")}</td>
          <td class="truncate">${escapeHtml(directory)}</td>
          <td>${escapeHtml(job.gdsa || "N/A")}</td>
          <td>
            <div class="progress-container">
              <div class="progress-info">
                <span class="progress-percentage">${progress}%</span>
              </div>
              <div class="progress">
                <div class="progress-bar bg-success" style="width: ${progress}%"></div>
              </div>
            </div>
          </td>
          <td>${size}</td>
          <td>${timeLeft}</td>
          <td>${speed}</td>
        </tr>
      `);
      $tbody.append($row);
    });
  }).fail(function () {
    $("#dashboard-active-table tbody").html(
      '<tr><td colspan="8" class="text-center">Failed to load active uploads</td></tr>',
    );
  });
}

/**
 * Load latest history for dashboard
 */
function loadDashboardHistory() {
  $.getJSON("srv/api/jobs/completed.php?page=1", function (data) {
    const $tbody = $("#dashboard-history-table tbody");
    $tbody.empty();

    if (!data.jobs || data.jobs.length === 0) {
      $tbody.append(
        '<tr><td colspan="7" class="text-center">No upload history</td></tr>',
      );
      return;
    }

    // Show only latest 5 items
    const jobs = data.jobs.slice(0, 5);
    jobs.forEach(function (job) {
      const size = job.file_size || "N/A";
      const timeSpent = job.time_elapsed || "N/A";
      const uploaded = job.time_end_clean || "N/A";
      // Remove folder prefix from directory path
      let directory = job.file_directory || "N/A";
      if (job.drive && directory.startsWith(job.drive + "/")) {
        directory = directory.substring(job.drive.length + 1);
      }

      const $row = $(`
        <tr>
          <td class="truncate">${escapeHtml(job.file_name || "")}</td>
          <td>${escapeHtml(job.drive || "N/A")}</td>
          <td class="truncate">${escapeHtml(directory)}</td>
          <td>${escapeHtml(job.gdsa || "N/A")}</td>
          <td>${size}</td>
          <td>${timeSpent}</td>
          <td>${uploaded}</td>
        </tr>
      `);
      $tbody.append($row);
    });
  }).fail(function () {
    $("#dashboard-history-table tbody").html(
      '<tr><td colspan="7" class="text-center">Failed to load history</td></tr>',
    );
  });
}
