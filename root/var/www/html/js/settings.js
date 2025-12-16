/**
 * Settings Page JavaScript
 * Handles settings form submissions and tab switching
 */

(function () {
  "use strict";

  // Initialize on document ready
  $(document).ready(function () {
    initializeSettingsTabs();
    initializeSettingsForms();
    loadCurrentSettings();
  });

  /**
   * Initialize Settings Tabs
   */
  function initializeSettingsTabs() {
    const tabButtons = document.querySelectorAll(".tab-button");
    const tabContents = document.querySelectorAll(".tab-content");

    tabButtons.forEach((button) => {
      button.addEventListener("click", function () {
        const targetId = this.getAttribute("data-target");

        // Remove active class from all buttons and contents
        tabButtons.forEach((btn) => btn.classList.remove("active"));
        tabContents.forEach((content) => content.classList.remove("active"));

        // Add active class to clicked button and corresponding content
        this.classList.add("active");
        document.getElementById(targetId)?.classList.add("active");
      });
    });
  }

  /**
   * Initialize Settings Forms
   */
  function initializeSettingsForms() {
    // Transfer Form
    $("#transfer-form").on("submit", function (e) {
      e.preventDefault();
      const formData = getFormData(this);
      saveSettings("transfer", formData);
    });

    // Notification Form
    $("#notification-form").on("submit", function (e) {
      e.preventDefault();
      const formData = getFormData(this);
      saveSettings("notification", formData);
    });

    // System Form
    $("#system-form").on("submit", function (e) {
      e.preventDefault();
      const formData = getFormData(this);
      saveSettings("system", formData);
    });

    // AutoScan Form
    $("#autoscan-form").on("submit", function (e) {
      e.preventDefault();
      const formData = getFormData(this);
      saveSettings("autoscan", formData);
    });

    // Security Form
    $("#security-form").on("submit", function (e) {
      e.preventDefault();
      const formData = getFormData(this);
      saveSettings("security", formData);
    });
  }

  /**
   * Get Form Data as Object
   */
  function getFormData(form) {
    const formData = {};
    const elements = form.elements;

    for (let i = 0; i < elements.length; i++) {
      const element = elements[i];
      if (element.name) {
        formData[element.name] = element.value;
      }
    }

    return formData;
  }

  /**
   * Save Settings to Server
   */
  function saveSettings(category, data) {
    console.log("Saving settings:", category, data);

    // Show loading state
    showStatusMessage("Saving settings...", "info");

    // Make API call to save settings
    $.ajax({
      url: "srv/api/settings/update.php",
      method: "POST",
      data: JSON.stringify({
        category: category,
        settings: data,
      }),
      contentType: "application/json",
      success: function (response) {
        console.log("Settings saved:", response);
        showStatusMessage("Settings saved successfully!", "success");

        // Reload settings to confirm
        setTimeout(() => {
          loadCurrentSettings();
        }, 1000);
      },
      error: function (xhr, status, error) {
        console.error("Error saving settings:", error);
        showStatusMessage("Error saving settings: " + error, "error");
      },
    });
  }

  /**
   * Load Current Settings from Server
   */
  function loadCurrentSettings() {
    console.log("Loading current settings...");

    $.ajax({
      url: "srv/api/system/env_settings.php",
      method: "GET",
      success: function (response) {
        console.log("Settings loaded:", response);

        if (response && response.settings) {
          populateFormFields(response.settings);
        }
      },
      error: function (xhr, status, error) {
        console.error("Error loading settings:", error);
      },
    });
  }

  /**
   * Populate Form Fields with Settings
   */
  function populateFormFields(settings) {
    // Transfer settings
    if (settings.bandwidth_limit !== undefined) {
      $("#bandwidth_limit").val(settings.bandwidth_limit);
    }
    if (settings.transfers !== undefined) {
      $("#transfers").val(settings.transfers);
    }
    if (settings.min_age_upload !== undefined) {
      $("#min_age_upload").val(settings.min_age_upload);
    }
    if (settings.folder_depth !== undefined) {
      $("#folder_depth").val(settings.folder_depth);
    }

    // Notification settings
    if (settings.notification_level !== undefined) {
      $("#notification_level").val(settings.notification_level);
    }
    if (settings.notification_servername !== undefined) {
      $("#notification_servername").val(settings.notification_servername);
    }
    if (settings.notification_url !== undefined) {
      $("#notification_url").val(settings.notification_url);
    }

    // System settings
    if (settings.log_level !== undefined) {
      $("#log_level").val(settings.log_level);
    }
    if (settings.log_entry !== undefined) {
      $("#log_entry").val(settings.log_entry);
    }
    if (settings.vfs_refresh_enable !== undefined) {
      $("#vfs_refresh_enable").val(settings.vfs_refresh_enable);
    }
    if (settings.language !== undefined) {
      $("#language").val(settings.language);
    }

    // AutoScan settings
    if (settings.autoscan_url !== undefined) {
      $("#autoscan_url").val(settings.autoscan_url);
    }
    if (settings.autoscan_user !== undefined) {
      $("#autoscan_user").val(settings.autoscan_user);
    }
    if (settings.autoscan_pass !== undefined) {
      $("#autoscan_pass").val(settings.autoscan_pass);
    }

    // Security settings
    if (settings.hashpassword !== undefined) {
      $("#hashpassword").val(settings.hashpassword);
    }
    if (settings.gdsa_name !== undefined) {
      $("#gdsa_name").val(settings.gdsa_name);
    }
    if (settings.db_name !== undefined) {
      $("#db_name").val(settings.db_name);
    }
    if (settings.db_team !== undefined) {
      $("#db_team").val(settings.db_team);
    }
  }

  /**
   * Show Status Message
   */
  function showStatusMessage(message, type = "info") {
    const statusEl = $("#status-message");

    // Set message and type
    statusEl.text(message);
    statusEl.removeClass("success error info warning");
    statusEl.addClass(type);
    statusEl.addClass("active");

    // Auto-hide after 3 seconds
    setTimeout(() => {
      statusEl.removeClass("active");
    }, 3000);
  }

  /**
   * Export Rate Limit Update (used by dashboard)
   */
  window.updateRateLimitDisplay = function (limit) {
    $("#bandwidth_limit").val(limit);
  };
})();
