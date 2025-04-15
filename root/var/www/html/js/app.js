/**
 * Main application JavaScript for the Uploader Dashboard
 *
 * This updated version includes modern UI interactions and animations
 * while maintaining full compatibility with existing functionality
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
  // Animation states
  animations: {
    cardEntrance: true,
    tableRowEffects: true,
  },
};

// Update the document ready function with enhanced initializations
$(document).ready(function () {
  // Apply entrance animations for stat cards
  animateStatsCards();

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

  // Apply shimmer effect to empty tables
  applyEmptyStateEffects();
});

/**
 * Apply entrance animations to stat cards
 */
function animateStatsCards() {
  // Add animation class to each stat card with increasing delay
  $(".stat-card").each(function (index) {
    $(this).css({
      opacity: "0",
      transform: "translateY(20px)",
    });

    setTimeout(() => {
      $(this).css({
        opacity: "1",
        transform: "translateY(0)",
        transition: "opacity 0.5s ease, transform 0.5s ease",
      });
    }, 100 * (index + 1));
  });
}

/**
 * Apply effects to empty state tables
 */
function applyEmptyStateEffects() {
  $(".empty-state").each(function () {
    $(this).css({
      opacity: "0",
      transform: "scale(0.9)",
    });

    setTimeout(() => {
      $(this).css({
        opacity: "1",
        transform: "scale(1)",
        transition: "opacity 0.5s ease, transform 0.5s ease",
      });
    }, 300);
  });
}

/**
 * Initialize the application
 */
function initializeApp() {
  // Add loading state to cards
  $(".card").addClass("loading");
  $(".card-body").append(
    '<div class="loading-overlay"><div class="loading-spinner"></div></div>'
  );

  // Load environment settings
  loadEnvSettings();
  loadAppVersion();

  // Initial data fetching
  handleInProgressJobs();
  handleCompletedJobList();
  checkStatus();
  updateRealTimeStats();

  // Remove loading state after 1 second (simulated loading time)
  setTimeout(() => {
    $(".card").removeClass("loading");
    $(".loading-overlay").fadeOut(300, function () {
      $(this).remove();
    });
  }, 800);
}

/**
 * Load the application version with visual feedback
 */
function loadAppVersion() {
  const versionBadge = document.getElementById("app-version");
  versionBadge.classList.add("loading");

  // Try dedicated API endpoint first
  fetch("srv/api/system/version.php")
    .then((response) => response.json())
    .then((data) => {
      if (data && data.version) {
        versionBadge.textContent = "v" + data.version;
        versionBadge.classList.remove("loading");
        versionBadge.classList.add("loaded");
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
            versionBadge.textContent = "v" + data.newversion;
            versionBadge.classList.remove("loading");
            versionBadge.classList.add("loaded");
            console.log("Version loaded from file:", data.newversion);
          } else {
            throw new Error("Invalid release.json format");
          }
        })
        .catch((fallbackError) => {
          console.error("Version fetch failed:", fallbackError);
          // Set a hardcoded version as last resort
          versionBadge.textContent = "v4.0.0";
          versionBadge.classList.remove("loading");
          versionBadge.classList.add("loaded");
        });
    });
}

/**
 * Set up all event listeners with enhanced interactions
 */
function setupEventListeners() {
  // Settings modal toggle with effects
  $("#settings-toggle").on("click", function () {
    $("#settings-modal").addClass("active");
    $("#modal-overlay").addClass("active");

    // Animate modal entrance
    $(".modal-content").css({
      transform: "translateY(20px) scale(0.98)",
      opacity: "0",
    });

    setTimeout(() => {
      $(".modal-content").css({
        transform: "translateY(0) scale(1)",
        opacity: "1",
        transition: "transform 0.4s ease, opacity 0.4s ease",
      });
    }, 50);
  });

  // Modal close with animation
  $("#modal-close, #modal-overlay").on("click", function (e) {
    if (e.target === this) {
      $(".modal-content").css({
        transform: "translateY(10px) scale(0.98)",
        opacity: "0",
        transition: "transform 0.3s ease, opacity 0.3s ease",
      });

      setTimeout(() => {
        $("#settings-modal").removeClass("active");
        $("#modal-overlay").removeClass("active");

        // Reset the modal content styling for next open
        setTimeout(() => {
          $(".modal-content").css({
            transform: "",
            opacity: "",
            transition: "",
          });
        }, 300);
      }, 280);
    }
  });

  setupSettingsModal();

  // Theme selection - uses function from utils.js
  setupThemeEventListeners();

  // Sidebar accordion toggles - keeping for backwards compatibility
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

  // Play/Pause button with enhanced effects
  $("#control > span").on("click", function () {
    // Add click effect
    $(this).css({
      transform: "scale(0.85)",
      transition: "transform 0.1s ease",
    });

    setTimeout(() => {
      $(this).css({
        transform: "scale(1)",
        transition: "transform 0.2s ease",
      });
    }, 100);

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

  // Clear history button with enhanced effects
  $("#clnHist").on("click", function () {
    // Confirm clearing history
    if (confirm("Are you sure you want to clear the upload history?")) {
      // Visual feedback for button click
      $(this).addClass("btn-processing");

      $.ajax({
        type: "POST",
        url: "srv/api/system/clean_history.php",
        success: function () {
          handleCompletedJobList();
          showStatusMessage("Upload history cleared successfully");
          $("#clnHist").removeClass("btn-processing");
        },
        error: function () {
          showStatusMessage("Failed to clear upload history", true);
          $("#clnHist").removeClass("btn-processing");
        },
      });
    }
  });

  // Toggle time format with animation
  $(".toggle-time-format").on("click", function () {
    $(this).addClass("rotating");

    setTimeout(() => {
      $(this).removeClass("rotating");
    }, 500);

    $("#prettyEndTime").click();
  });

  // Page size selection with feedback
  $("#pageSize > li.page-item").on("click", function () {
    // Visual feedback
    $(this).css({
      transform: "scale(0.9)",
      transition: "transform 0.1s ease",
    });

    setTimeout(() => {
      $(this).css({
        transform: "scale(1)",
        transition: "transform 0.2s ease",
      });
    }, 100);

    $("#pageSize > li.page-item.active").removeClass("active");
    $(this).addClass("active");
    uploaderApp.pageSize = parseInt($(this).find("a").text());
    saveUserSetting("pageSize", uploaderApp.pageSize);
    handleCompletedJobList();
  });

  // Enable password toggle in forms
  $(".password-toggle").on("click", function () {
    const input = $(this).siblings("input");
    const icon = $(this).find("i");

    if (input.attr("type") === "password") {
      input.attr("type", "text");
      icon.removeClass("fa-eye").addClass("fa-eye-slash");
    } else {
      input.attr("type", "password");
      icon.removeClass("fa-eye-slash").addClass("fa-eye");
    }
  });

  // Table rows hover effects - add delegated handler for dynamic content
  $(document)
    .on("mouseenter", "table tbody tr", function () {
      if (!uploaderApp.animations.tableRowEffects) return;

      // Only animate if it's not a no-data row
      if (!$(this).find("td[colspan]").length) {
        $(this).siblings().css({
          opacity: "0.7",
          transition: "opacity 0.3s ease",
        });
      }
    })
    .on("mouseleave", "table tbody tr", function () {
      if (!uploaderApp.animations.tableRowEffects) return;

      $(this).siblings().css({
        opacity: "1",
        transition: "opacity 0.3s ease",
      });
    });
}

/**
 * Settings Modal and Tabbed Interface Functionality
 */
function setupSettingsModal() {
  // Tab switching with enhanced transitions
  $(".tab-button").on("click", function () {
    const targetId = $(this).data("target");
    const $targetContent = $("#" + targetId);

    // Skip if already active
    if ($(this).hasClass("active")) return;

    // Update active state for buttons
    $(".tab-button").removeClass("active");
    $(this).addClass("active");

    // Fade out current content
    $(".tab-content.active").css({
      opacity: "0",
      transform: "translateX(-10px)",
      transition: "opacity 0.2s ease, transform 0.2s ease",
    });

    // After short delay, swap content and fade in new content
    setTimeout(() => {
      $(".tab-content").removeClass("active").css({
        opacity: "",
        transform: "",
        transition: "",
      });

      $targetContent.addClass("active").css({
        opacity: "0",
        transform: "translateX(10px)",
      });

      // Force reflow
      void $targetContent[0].offsetWidth;

      $targetContent.css({
        opacity: "1",
        transform: "translateX(0)",
        transition: "opacity 0.3s ease, transform 0.3s ease",
      });
    }, 200);
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
  // Form submissions with feedback animation
  $(".settings-form").on("submit", function (e) {
    e.preventDefault();

    // Get form ID to determine which settings to update
    const formId = $(this).attr("id");

    // Skip notification form as it has special handling
    if (formId === "notification-form") {
      return;
    }

    // Add visual feedback - button animation
    const $submitBtn = $(this).find('button[type="submit"]');
    $submitBtn.addClass("btn-processing");

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

    // Add visual feedback
    const $submitBtn = $(this).find('button[type="submit"]');
    $submitBtn.addClass("btn-processing");

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
 * Handle in-progress uploads display with improved animations
 */
function handleInProgressJobs() {
  $.getJSON("srv/api/jobs/inprogress.php", function (json) {
    const $tableBody = $("#uploadsTable > tbody");
    let totalUploadRate = 0;

    // Create a flag to check if we're transitioning from empty to having data
    const wasEmpty = $tableBody.find(".empty-state").length > 0;

    $tableBody.empty();

    if (!json.jobs || json.jobs.length === 0) {
      $tableBody.html(`
        <tr>
          <td colspan="6" class="text-center">
            <div class="empty-state">
              <i class="fas fa-cloud-upload-alt"></i>
              <p>No uploads in progress</p>
            </div>
          </td>
        </tr>
      `);

      // Apply empty state animation
      applyEmptyStateEffects();

      $("#download_rate").text("0.00");
      return;
    }

    // If we're transitioning from empty to having data, add animation
    if (wasEmpty) {
      $tableBody.css("opacity", "0");
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

      // Create table row with responsive data attributes and animation delay
      const $row = $(`
        <tr style="opacity: 0; transform: translateX(20px);">
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

      $tableBody.append($row);

      // Animate row entrance with staggered delay
      setTimeout(() => {
        $row.css({
          opacity: "1",
          transform: "translateX(0)",
          transition: "opacity 0.5s ease, transform 0.5s ease",
        });
      }, 50 * index);
    });

    // If transitioning from empty, fade in the table
    if (wasEmpty) {
      setTimeout(() => {
        $tableBody.css({
          opacity: "1",
          transition: "opacity 0.5s ease",
        });
      }, 50);
    }

    // Update the upload rate display
    totalUploadRate = totalUploadRate.toFixed(2);
    $("#download_rate").text(totalUploadRate);

    // Animate the rate change
    $("#download_rate").css({
      transform: "scale(1.2)",
      transition: "transform 0.2s ease",
    });

    setTimeout(() => {
      $("#download_rate").css({
        transform: "scale(1)",
        transition: "transform 0.2s ease",
      });
    }, 200);

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

// Update handleCompletedJobList to use relative date by default and add animations
function handleCompletedJobList() {
  const $completedTableBody = $("#completedTable > tbody");

  // Add loading indicator
  $completedTableBody.html(
    '<tr><td colspan="6" class="text-center"><div class="loading-spinner"></div></td></tr>'
  );

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

      // Add loading effect
      $completedTableBody.css("opacity", "0.6");
    },
    afterPaging: function () {
      // After page changes, fetch complete upload stats for today
      fetchCompletedTodayStats();

      // Restore opacity
      $completedTableBody.css({
        opacity: "1",
        transition: "opacity 0.3s ease",
      });
    },
    callback: function (data, pagination) {
      // Add Bootstrap classes to pagination links
      $("#page").find("ul").children("li").addClass("page-item");
      $("#page").find("ul").children("li").children("a").addClass("page-link");

      $completedTableBody.empty();

      if (!data || data.length === 0) {
        $completedTableBody.html(`
          <tr>
            <td colspan="6" class="text-center">
              <div class="empty-state">
                <i class="fas fa-history"></i>
                <p>No completed uploads</p>
              </div>
            </td>
          </tr>
        `);

        // Apply empty state animation
        applyEmptyStateEffects();

        $("#clnHist").hide();
        return;
      }

      $("#clnHist").show();

      // Process and display each completed job with staggered animation
      $.each(data, function (index, job) {
        // Use time_end_clean (relative time) by default, only switch if prettyEndTime is checked
        const endTime = $("#prettyEndTime").is(":checked")
          ? job.time_end
          : job.time_end_clean;
        const rowClass = job.successful === true ? "" : "table-danger";

        const $row = $(`
          <tr class="${rowClass}" style="opacity: 0; transform: translateX(20px);">
            <td data-title="Filename" class="truncate">${job.file_name}</td>
            <td data-title="Folder">${job.drive}</td>
            <td data-title="Key">${job.gdsa}</td>
            <td data-title="Filesize">${job.file_size}</td>
            <td data-title="Time spent">${job.time_elapsed || "n/a"}</td>
            <td data-title="Uploaded">${endTime}</td>
          </tr>
        `);

        $completedTableBody.append($row);

        // Staggered animation
        setTimeout(() => {
          $row.css({
            opacity: "1",
            transform: "translateX(0)",
            transition: "opacity 0.5s ease, transform 0.5s ease",
          });
        }, 30 * index);
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
      // Check if values have changed
      const countChanged = uploaderApp.completedTodayCount !== data.count;
      const sizeChanged = uploaderApp.completedTodaySize !== data.total_size;

      uploaderApp.completedTodayCount = data.count;
      uploaderApp.completedTodaySize = data.total_size || 0;

      // Update the stats display with animation if changed
      if (countChanged) {
        updateWithAnimation("#completed-count", data.count);
      } else {
        $("#completed-count").text(data.count);
      }

      if (sizeChanged) {
        updateWithAnimation(
          "#completed-total",
          `Total: ${formatFileSize(data.total_size)}`
        );
      } else {
        $("#completed-total").text(`Total: ${formatFileSize(data.total_size)}`);
      }
    }
  }).fail(function () {
    // If the API doesn't exist yet, fall back to counting visible rows
    // This is a temporary solution until the API endpoint is implemented
    calculateCompletedTodayStats();
  });
}

/**
 * Helper function to update text with animation
 */
function updateWithAnimation(selector, newValue) {
  const $element = $(selector);

  // Animate out
  $element.css({
    transform: "scale(0.8)",
    opacity: "0.5",
    transition: "transform 0.2s ease, opacity 0.2s ease",
  });

  // Update value and animate in
  setTimeout(() => {
    $element.text(newValue);
    $element.css({
      transform: "scale(1.1)",
      opacity: "1",
      transition: "transform 0.2s ease, opacity 0.2s ease",
    });

    // Reset to normal
    setTimeout(() => {
      $element.css({
        transform: "scale(1)",
        transition: "transform 0.2s ease",
      });
    }, 200);
  }, 200);
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

  // Check if values have changed
  const countChanged = uploaderApp.completedTodayCount !== completedToday;
  const sizeChanged = uploaderApp.completedTodaySize !== totalSize;

  // Update the stats with animation if changed
  if (countChanged) {
    updateWithAnimation("#completed-count", completedToday);
  } else {
    $("#completed-count").text(completedToday);
  }

  if (sizeChanged) {
    updateWithAnimation(
      "#completed-total",
      `Total: ${formatFileSize(totalSize)}`
    );
  } else {
    $("#completed-total").text(`Total: ${formatFileSize(totalSize)}`);
  }

  // Save to app state
  uploaderApp.completedTodayCount = completedToday;
  uploaderApp.completedTodaySize = totalSize;
}

// Enhanced status check function with visual feedback
function checkStatus() {
  console.log("Checking uploader status");

  // Add subtle visual indicator that status is being checked
  $("#control > span").css({
    opacity: "0.8",
    transition: "opacity 0.3s ease",
  });

  $.getJSON("srv/api/system/status.php")
    .done(function (json) {
      console.log("Status response:", json);

      // Restore control opacity
      $("#control > span").css("opacity", "1");

      if (json === undefined || json.status === "UNKNOWN") {
        console.warn("Unable to check status");
        return;
      }

      // Pass false as second parameter since this is an automatic check, not user action
      alignPauseControl(json.status, false);
    })
    .fail(function (jqXHR, textStatus, errorThrown) {
      console.error("Failed to check status:", textStatus, errorThrown);

      // Restore control opacity
      $("#control > span").css("opacity", "1");
    });
}

// Play/Pause button handler with enhanced animation
function alignPauseControl(status, fromUserAction = false) {
  console.log("Aligning pause control to status:", status);

  const $control = $("#control > span");
  const $icon = $control.find("i");

  // Start transition animation
  $control.css({
    transform: "scale(0.9)",
    opacity: "0.7",
    transition:
      "transform 0.2s ease, opacity 0.2s ease, background-color 0.3s ease",
  });

  setTimeout(() => {
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

    // Complete transition animation
    $control.css({
      transform: "scale(1)",
      opacity: "1",
    });
  }, 200);
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
    $button.css({
      transform: "scale(0.9)",
      opacity: "0.7",
      "pointer-events": "none",
      transition: "transform 0.2s ease, opacity 0.2s ease",
    });

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
        $button.css({
          opacity: "1",
          "pointer-events": "auto",
          transform: "scale(1)",
        });
      },
    });
  });
}

// Update the updateRealTimeStats function with animations
function updateRealTimeStats() {
  // Get current upload rate
  const currentRate = $("#download_rate").text() || "0.00";

  // Only update if changed
  if ($("#current-rate").text() !== `${currentRate} MB/s`) {
    updateWithAnimation("#current-rate", `${currentRate} MB/s`);
  }

  // Get active uploads count
  const activeUploads =
    $("#uploadsTable tbody tr").not(':contains("No uploads")').length || 0;

  // Only update if changed
  if ($("#active-count").text() !== activeUploads.toString()) {
    updateWithAnimation("#active-count", activeUploads);
  }

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
 * Load environment settings from the server with visual feedback
 */
function loadEnvSettings() {
  // Add loading indicator to settings forms
  $(".settings-form").addClass("loading");

  // First try the new API endpoint
  $.getJSON("srv/api/settings/update.php")
    .done(function (data) {
      if (data && data.success && data.settings) {
        uploaderApp.envSettings = data.settings;

        // Populate form fields with loaded settings
        populateFormFields(data.settings);

        // Update UI elements that depend on settings
        updateUIFromSettings(data.settings);

        // Remove loading state
        $(".settings-form").removeClass("loading");
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

        // Remove loading state
        $(".settings-form").removeClass("loading");
      } else {
        console.warn("Failed to load environment settings from legacy API");
        // Remove loading state
        $(".settings-form").removeClass("loading");
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

      // Remove loading state
      $(".settings-form").removeClass("loading");
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

      // Add a subtle highlight effect to filled fields
      $field.addClass("field-populated");
      setTimeout(() => {
        $field.removeClass("field-populated");
      }, 500);
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
 * Update environment settings with enhanced visual feedback
 * @param {string} formId - Form ID that was submitted
 * @param {Object} settings - Settings to update
 */
function updateEnvSettings(formId, settings) {
  console.log("Updating settings:", settings);

  // Create a loading indicator
  const $form = $(`#${formId}`);
  const $submitBtn = $form.find('button[type="submit"]');
  const originalText = $submitBtn.text();

  // Add processing class for styles
  $submitBtn.addClass("btn-processing");
  $submitBtn
    .prop("disabled", true)
    .html('<i class="fas fa-spinner fa-spin"></i> Saving...');

  // Add a safety timeout to restore button state even if AJAX fails
  const resetTimeout = setTimeout(() => {
    $submitBtn.removeClass("btn-processing");
    $submitBtn.prop("disabled", false).html(originalText);
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

        // Success animation for button
        $submitBtn.removeClass("btn-processing").addClass("btn-success");
        $submitBtn.html('<i class="fas fa-check"></i> Saved!');

        // Update local settings
        Object.assign(uploaderApp.envSettings, settings);

        // Update UI based on form ID
        switch (formId) {
          case "transfer-form":
            // Update transfer settings UI
            updateWithAnimation(
              "#active-max",
              `Max: ${settings.TRANSFERS || "2"}`
            );
            updateWithAnimation(
              "#rate-limit",
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

        // Reset button after delay
        setTimeout(() => {
          $submitBtn.removeClass("btn-success");
          $submitBtn.prop("disabled", false).html(originalText);
        }, 1500);
      } else {
        // Try legacy API if new one fails
        updateEnvSettingsLegacy(
          formId,
          settings,
          $submitBtn,
          originalText,
          function (success) {
            if (!success) {
              $submitBtn.removeClass("btn-processing").addClass("btn-danger");
              $submitBtn.html(
                '<i class="fas fa-exclamation-triangle"></i> Error'
              );

              showStatusMessage(
                "Failed to update settings: " +
                  (response.message || "Unknown error"),
                true
              );

              // Reset button after delay
              setTimeout(() => {
                $submitBtn.removeClass("btn-danger");
                $submitBtn.prop("disabled", false).html(originalText);
              }, 1500);
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
            $submitBtn.removeClass("btn-processing").addClass("btn-danger");
            $submitBtn.html(
              '<i class="fas fa-exclamation-triangle"></i> Error'
            );

            showStatusMessage("Failed to communicate with the server", true);
            console.error("Response:", xhr.responseText);

            // Reset button after delay
            setTimeout(() => {
              $submitBtn.removeClass("btn-danger");
              $submitBtn.prop("disabled", false).html(originalText);
            }, 1500);
          }
        }
      );
    },
    complete: function () {
      // Clear the safety timeout
      clearTimeout(resetTimeout);
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
        $submitBtn.removeClass("btn-processing").addClass("btn-success");
        $submitBtn.html('<i class="fas fa-check"></i> Saved!');

        showStatusMessage("Settings updated successfully!");

        // Update local settings
        Object.assign(uploaderApp.envSettings, settings);

        // Update UI based on form ID
        switch (formId) {
          case "transfer-form":
            updateWithAnimation(
              "#active-max",
              `Max: ${legacySettings.transfers || "2"}`
            );
            updateWithAnimation(
              "#rate-limit",
              `Limit per Transfer: ${legacySettings.bandwidth_limit || "30M"}`
            );
            break;
        }

        // Reset button after delay
        setTimeout(() => {
          $submitBtn.removeClass("btn-success");
          $submitBtn.prop("disabled", false).html(originalText);
        }, 1500);

        if (callback) callback(true);
      } else {
        if (callback) callback(false);
      }
    },
    error: function () {
      if (callback) callback(false);
    },
    complete: function () {
      // Also restore button state in legacy handler if not already handled
      if ($submitBtn.hasClass("btn-processing")) {
        $submitBtn.removeClass("btn-processing");
        $submitBtn.prop("disabled", false).html(originalText);
        console.log("Button state restored in legacy complete callback");
      }
    },
  });
}

function updateQueueStats() {
  $.getJSON("srv/api/jobs/queue_stats.php", function (data) {
    if (data && typeof data === "object") {
      // Update the queue count with animation if changed
      const currentCount = $("#queue-count").text();
      if (currentCount !== (data.count || 0).toString()) {
        updateWithAnimation("#queue-count", data.count || 0);
      }

      // Format the total size nicely
      const totalSize = formatFileSize(data.total_size || 0);
      const currentTotal = $("#queue-total").text().replace("Total: ", "");

      if (currentTotal !== totalSize) {
        updateWithAnimation("#queue-total", `Total: ${totalSize}`);
      }
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

    const currentCount = $("#queue-count").text();
    if (currentCount !== queueCount.toString()) {
      updateWithAnimation("#queue-count", queueCount);
    }

    let totalSize = 0;
    if (data.jobs && data.jobs.length > 0) {
      data.jobs.forEach(function (job) {
        totalSize += parseFileSize(job.file_size);
      });
    }

    const formattedSize = formatFileSize(totalSize);
    const currentTotal = $("#queue-total").text().replace("Total: ", "");

    if (currentTotal !== formattedSize) {
      updateWithAnimation("#queue-total", `Total: ${formattedSize}`);
    }
  });
}

/**
 * CSS class for button processing state
 * Adds a dynamic pulse effect to buttons while processing
 */
// Add CSS class definitions for processing and success states
if (!document.getElementById("dynamic-button-styles")) {
  const style = document.createElement("style");
  style.id = "dynamic-button-styles";
  style.textContent = `
    .btn-processing {
      position: relative;
      overflow: hidden;
      pointer-events: none;
    }
    
    .btn-processing::after {
      content: "";
      position: absolute;
      top: 0;
      left: -100%;
      width: 300%;
      height: 100%;
      background: linear-gradient(
        90deg,
        transparent 0%,
        rgba(255, 255, 255, 0.2) 50%,
        transparent 100%
      );
      animation: shimmer 2s infinite;
    }
    
    .field-populated {
      animation: highlight 1s ease;
    }

    @keyframes shimmer {
      0% { left: -100%; }
      100% { left: 100%; }
    }
    
    @keyframes highlight {
      0% { background-color: var(--accent-transparent); }
      100% { background-color: transparent; }
    }
    
    .rotating {
      animation: rotate 0.5s ease;
    }
    
    @keyframes rotate {
      0% { transform: rotate(0); }
      100% { transform: rotate(360deg); }
    }
    
    .loading-spinner {
      width: 40px;
      height: 40px;
      margin: 20px auto;
      border: 3px solid rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      border-top-color: var(--accent-color);
      animation: spin 1s ease-in-out infinite;
    }
    
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    
    .loading-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: var(--transparency-dark-70);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10;
      backdrop-filter: blur(3px);
    }
    
    .card.loading {
      position: relative;
      min-height: 200px;
    }
    
    #app-version.loading {
      animation: pulse 1.5s infinite;
    }
    
    #app-version.loaded {
      animation: bounce 0.5s ease;
    }
    
    @keyframes bounce {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.2); }
    }
    
    .btn-success {
      background-color: var(--success) !important;
    }
    
    .btn-danger {
      background-color: var(--danger) !important;
    }
  `;
  document.head.appendChild(style);
}
