/**
 * Settings View
 */

function settingsView() {
  return {
    title: '<i class="fas fa-cog"></i> Settings',
    documentTitle: "Settings - Uploader",
    html: `
      <div class="content-container">
        <!-- Settings Layout -->
        <div class="settings-layout">
          <!-- Settings Sidebar Navigation -->
          <div class="settings-sidebar">
            <nav class="settings-nav">
              <button class="settings-nav-item active" data-section="transfer">
                <i class="fas fa-exchange-alt"></i>
                <span>Transfer</span>
              </button>
              <button class="settings-nav-item" data-section="notification">
                <i class="fas fa-bell"></i>
                <span>Notification</span>
              </button>
              <button class="settings-nav-item" data-section="system">
                <i class="fas fa-cogs"></i>
                <span>System</span>
              </button>
              <button class="settings-nav-item" data-section="autoscan">
                <i class="fas fa-search"></i>
                <span>AutoScan</span>
              </button>
              <button class="settings-nav-item" data-section="security">
                <i class="fas fa-shield-alt"></i>
                <span>Security</span>
              </button>
            </nav>
          </div>

          <!-- Settings Content Area -->
          <div class="settings-content">
            <!-- Transfer Settings -->
            <div id="transfer-section" class="settings-section active">
              <div class="settings-header">
                <h2>Transfer Settings</h2>
                <p>Configure bandwidth and transfer behavior</p>
              </div>

              <div class="settings-group">
                <div class="setting-item">
                  <div class="setting-label">
                    <label for="bandwidth_limit">
                      <i class="fas fa-tachometer-alt"></i>
                      Bandwidth Limit (MB/s)
                    </label>
                    <small>Maximum upload speed per transfer</small>
                  </div>
                  <div class="setting-control">
                    <input type="text" id="bandwidth_limit" name="bandwidth_limit" class="form-input" value="30" />
                  </div>
                </div>

                <div class="setting-item">
                  <div class="setting-label">
                    <label for="transfers">
                      <i class="fas fa-exchange-alt"></i>
                      Max Transfers
                    </label>
                    <small>Number of simultaneous uploads</small>
                  </div>
                  <div class="setting-control">
                    <input type="number" id="transfers" name="transfers" class="form-input" value="2" min="1" max="10" />
                  </div>
                </div>

                <div class="setting-item">
                  <div class="setting-label">
                    <label for="min_age_upload">
                      <i class="fas fa-clock"></i>
                      Min Age Upload (minutes)
                    </label>
                    <small>Minimum file age before upload</small>
                  </div>
                  <div class="setting-control">
                    <input type="number" id="min_age_upload" name="min_age_upload" class="form-input" value="0" min="0" />
                  </div>
                </div>

                <div class="setting-item">
                  <div class="setting-label">
                    <label for="folder_depth">
                      <i class="fas fa-folder"></i>
                      Folder Depth
                    </label>
                    <small>Directory scan depth level</small>
                  </div>
                  <div class="setting-control">
                    <input type="number" id="folder_depth" name="folder_depth" class="form-input" value="1" min="1" />
                  </div>
                </div>
              </div>

              <div class="settings-actions">
                <button type="button" class="btn btn-primary" id="save-transfer">
                  <i class="fas fa-save"></i>
                  Save Changes
                </button>
              </div>
            </div>

            <!-- Notification Settings -->
            <div id="notification-section" class="settings-section">
              <div class="settings-header">
                <h2>Notification Settings</h2>
                <p>Configure alerts and notifications</p>
              </div>

              <div class="settings-group">
                <div class="setting-item">
                  <div class="setting-label">
                    <label for="notification_level">
                      <i class="fas fa-bell"></i>
                      Notification Level
                    </label>
                    <small>Choose which events trigger notifications</small>
                  </div>
                  <div class="setting-control">
                    <select id="notification_level" name="notification_level" class="form-input">
                      <option value="ALL" selected>ALL</option>
                      <option value="ERROR">ERROR</option>
                      <option value="NONE">NONE</option>
                    </select>
                  </div>
                </div>

                <div class="setting-item">
                  <div class="setting-label">
                    <label for="notification_servername">
                      <i class="fas fa-server"></i>
                      Server Name
                    </label>
                    <small>Display name in notifications</small>
                  </div>
                  <div class="setting-control">
                    <input type="text" id="notification_servername" name="notification_servername" class="form-input" value="Drive-Upload" />
                  </div>
                </div>

                <div class="setting-item">
                  <div class="setting-label">
                    <label for="notification_url">
                      <i class="fas fa-link"></i>
                      Notification URL
                    </label>
                    <small>Discord webhook or other notification service URL</small>
                  </div>
                  <div class="setting-control">
                    <input type="text" id="notification_url" name="notification_url" class="form-input" placeholder="discord://webhook-url" />
                  </div>
                </div>
              </div>

              <div class="settings-actions">
                <button type="button" class="btn btn-primary" id="save-notification">
                  <i class="fas fa-save"></i>
                  Save Changes
                </button>
              </div>
            </div>

            <!-- System Settings -->
            <div id="system-section" class="settings-section">
              <div class="settings-header">
                <h2>System Settings</h2>
                <p>Configure logging and system behavior</p>
              </div>

              <div class="settings-group">
                <div class="setting-item">
                  <div class="setting-label">
                    <label for="log_level">
                      <i class="fas fa-file-alt"></i>
                      Log Level
                    </label>
                    <small>Logging verbosity level</small>
                  </div>
                  <div class="setting-control">
                    <select id="log_level" name="log_level" class="form-input">
                      <option value="INFO" selected>INFO</option>
                      <option value="DEBUG">DEBUG</option>
                      <option value="WARNING">WARNING</option>
                      <option value="ERROR">ERROR</option>
                    </select>
                  </div>
                </div>

                <div class="setting-item">
                  <div class="setting-label">
                    <label for="log_entry">
                      <i class="fas fa-list-ol"></i>
                      Log Entry Count
                    </label>
                    <small>Maximum log entries to keep</small>
                  </div>
                  <div class="setting-control">
                    <input type="number" id="log_entry" name="log_entry" class="form-input" value="1000" min="100" />
                  </div>
                </div>

                <div class="setting-item">
                  <div class="setting-label">
                    <label for="vfs_refresh_enable">
                      <i class="fas fa-sync"></i>
                      VFS Refresh
                    </label>
                    <small>Automatic virtual filesystem refresh</small>
                  </div>
                  <div class="setting-control">
                    <label class="toggle-switch">
                      <input type="checkbox" id="vfs_refresh_enable" name="vfs_refresh_enable" checked />
                      <span class="toggle-slider"></span>
                    </label>
                  </div>
                </div>

                <div class="setting-item">
                  <div class="setting-label">
                    <label for="language">
                      <i class="fas fa-language"></i>
                      Language
                    </label>
                    <small>Interface language</small>
                  </div>
                  <div class="setting-control">
                    <select id="language" name="language" class="form-input">
                      <option value="en" selected>English</option>
                      <option value="de">German</option>
                    </select>
                  </div>
                </div>
              </div>

              <div class="settings-actions">
                <button type="button" class="btn btn-primary" id="save-system">
                  <i class="fas fa-save"></i>
                  Save Changes
                </button>
              </div>
            </div>

            <!-- AutoScan Settings -->
            <div id="autoscan-section" class="settings-section">
              <div class="settings-header">
                <h2>AutoScan Settings</h2>
                <p>Configure AutoScan integration</p>
              </div>

              <div class="settings-group">
                <div class="setting-item">
                  <div class="setting-label">
                    <label for="autoscan_url">
                      <i class="fas fa-link"></i>
                      AutoScan URL
                    </label>
                    <small>AutoScan service endpoint</small>
                  </div>
                  <div class="setting-control">
                    <input type="text" id="autoscan_url" name="autoscan_url" class="form-input" placeholder="http://autoscan:3030" />
                  </div>
                </div>

                <div class="setting-item">
                  <div class="setting-label">
                    <label for="autoscan_user">
                      <i class="fas fa-user"></i>
                      AutoScan Username
                    </label>
                    <small>Optional authentication username</small>
                  </div>
                  <div class="setting-control">
                    <input type="text" id="autoscan_user" name="autoscan_user" class="form-input" placeholder="username (leave empty for none)" />
                  </div>
                </div>

                <div class="setting-item">
                  <div class="setting-label">
                    <label for="autoscan_pass">
                      <i class="fas fa-lock"></i>
                      AutoScan Password
                    </label>
                    <small>Optional authentication password</small>
                  </div>
                  <div class="setting-control">
                    <input type="password" id="autoscan_pass" name="autoscan_pass" class="form-input" placeholder="password (leave empty for none)" />
                  </div>
                </div>
              </div>

              <div class="settings-actions">
                <button type="button" class="btn btn-primary" id="save-autoscan">
                  <i class="fas fa-save"></i>
                  Save Changes
                </button>
              </div>
            </div>

            <!-- Security Settings -->
            <div id="security-section" class="settings-section">
              <div class="settings-header">
                <h2>Security Settings</h2>
                <p>Configure encryption and database settings</p>
              </div>

              <div class="settings-group">
                <div class="setting-item">
                  <div class="setting-label">
                    <label for="hashpassword">
                      <i class="fas fa-key"></i>
                      Hash Password
                    </label>
                    <small>Password storage method</small>
                  </div>
                  <div class="setting-control">
                    <label class="toggle-switch">
                      <input type="checkbox" id="hashpassword" name="hashpassword" checked />
                      <span class="toggle-slider"></span>
                    </label>
                  </div>
                </div>

                <div class="setting-item">
                  <div class="setting-label">
                    <label for="gdsa_name">
                      <i class="fas fa-database"></i>
                      GDSA Name
                    </label>
                    <small>Google Drive Service Account name</small>
                  </div>
                  <div class="setting-control">
                    <input type="text" id="gdsa_name" name="gdsa_name" class="form-input" value="encrypt" />
                  </div>
                </div>

                <div class="setting-item">
                  <div class="setting-label">
                    <label for="db_name">
                      <i class="fas fa-database"></i>
                      DB Name
                    </label>
                    <small>Database encryption name</small>
                  </div>
                  <div class="setting-control">
                    <input type="text" id="db_name" name="db_name" class="form-input" value="encrypt" />
                  </div>
                </div>

                <div class="setting-item">
                  <div class="setting-label">
                    <label for="db_team">
                      <i class="fas fa-users"></i>
                      DB Team
                    </label>
                    <small>Team database mode</small>
                  </div>
                  <div class="setting-control">
                    <label class="toggle-switch">
                      <input type="checkbox" id="db_team" name="db_team" checked />
                      <span class="toggle-slider"></span>
                    </label>
                  </div>
                </div>
              </div>

              <div class="settings-actions">
                <button type="button" class="btn btn-primary" id="save-security">
                  <i class="fas fa-save"></i>
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `,
    init: function () {
      // Initialize settings navigation
      const navItems = document.querySelectorAll(".settings-nav-item");
      const sections = document.querySelectorAll(".settings-section");

      navItems.forEach((item) => {
        item.addEventListener("click", function () {
          const targetSection = this.getAttribute("data-section");

          // Remove active class from all items and sections
          navItems.forEach((nav) => nav.classList.remove("active"));
          sections.forEach((section) => section.classList.remove("active"));

          // Add active class to clicked item and target section
          this.classList.add("active");
          document
            .getElementById(targetSection + "-section")
            ?.classList.add("active");
        });
      });

      // Load current settings
      loadSettingsData();

      // Save button handlers with proper save logic
      $("#save-transfer").on("click", function () {
        saveSettingsSection("transfer", {
          bandwidth_limit: $("#bandwidth_limit").val(),
          transfers: $("#transfers").val(),
          min_age_upload: $("#min_age_upload").val(),
          folder_depth: $("#folder_depth").val(),
        });
      });

      $("#save-notification").on("click", function () {
        saveSettingsSection("notification", {
          notification_level: $("#notification_level").val(),
          notification_servername: $("#notification_servername").val(),
          notification_url: $("#notification_url").val(),
        });
      });

      $("#save-system").on("click", function () {
        saveSettingsSection("system", {
          log_level: $("#log_level").val(),
          log_entry: $("#log_entry").val(),
          vfs_refresh_enable: $("#vfs_refresh_enable").is(":checked") ? "true" : "false",
          language: $("#language").val(),
        });
      });

      $("#save-autoscan").on("click", function () {
        saveSettingsSection("autoscan", {
          autoscan_url: $("#autoscan_url").val(),
          autoscan_user: $("#autoscan_user").val(),
          autoscan_pass: $("#autoscan_pass").val(),
        });
      });

      $("#save-security").on("click", function () {
        saveSettingsSection("security", {
          hashpassword: $("#hashpassword").is(":checked") ? "hashed" : "plain",
          gdsa_name: $("#gdsa_name").val(),
          db_name: $("#db_name").val(),
          db_team: $("#db_team").is(":checked") ? "true" : "false",
        });
      });

      // Helper function to load settings
      function loadSettingsData() {
        $.ajax({
          url: "srv/api/system/env_settings.php",
          method: "GET",
          success: function (response) {
            if (response && response.settings) {
              const s = response.settings;
              
              // Populate transfer settings
              if (s.bandwidth_limit) $("#bandwidth_limit").val(s.bandwidth_limit);
              if (s.transfers) $("#transfers").val(s.transfers);
              if (s.min_age_upload) $("#min_age_upload").val(s.min_age_upload);
              if (s.folder_depth) $("#folder_depth").val(s.folder_depth);
              
              // Populate notification settings
              if (s.notification_level) $("#notification_level").val(s.notification_level);
              if (s.notification_servername) $("#notification_servername").val(s.notification_servername);
              if (s.notification_url) $("#notification_url").val(s.notification_url);
              
              // Populate system settings
              if (s.log_level) $("#log_level").val(s.log_level);
              if (s.log_entry) $("#log_entry").val(s.log_entry);
              if (s.vfs_refresh_enable) $("#vfs_refresh_enable").prop("checked", s.vfs_refresh_enable === "true");
              if (s.language) $("#language").val(s.language);
              
              // Populate autoscan settings
              if (s.autoscan_url) $("#autoscan_url").val(s.autoscan_url);
              if (s.autoscan_user) $("#autoscan_user").val(s.autoscan_user);
              if (s.autoscan_pass) $("#autoscan_pass").val(s.autoscan_pass);
              
              // Populate security settings
              if (s.hashpassword) $("#hashpassword").prop("checked", s.hashpassword === "hashed");
              if (s.gdsa_name) $("#gdsa_name").val(s.gdsa_name);
              if (s.db_name) $("#db_name").val(s.db_name);
              if (s.db_team) $("#db_team").prop("checked", s.db_team === "true");
            }
          },
          error: function (xhr, status, error) {
            console.error("Error loading settings:", error);
          }
        });
      }

      // Helper function to save settings section
      function saveSettingsSection(section, data) {
        console.log("Saving " + section + " settings:", data);
        
        $.ajax({
          url: "srv/api/system/update_env.php",
          method: "POST",
          data: JSON.stringify(data),
          contentType: "application/json",
          success: function (response) {
            console.log("Settings saved successfully:", response);
            showNotification("Settings saved successfully!", "success");
            // Reload settings to confirm
            setTimeout(() => loadSettingsData(), 500);
          },
          error: function (xhr, status, error) {
            console.error("Error saving settings:", error);
            showNotification("Error saving settings: " + error, "error");
          }
        });
      }

      // Helper function to show notifications
      function showNotification(message, type) {
        // Create notification element if it doesn't exist
        let notification = document.getElementById("settings-notification");
        if (!notification) {
          notification = document.createElement("div");
          notification.id = "settings-notification";
          notification.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            font-size: 14px;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            animation: slideIn 0.3s ease-out;
          `;
          document.body.appendChild(notification);
        }

        // Set message and styling based on type
        notification.textContent = message;
        notification.style.background = type === "success" ? "#4caf50" : "#f44336";
        notification.style.display = "block";

        // Auto-hide after 3 seconds
        setTimeout(() => {
          notification.style.animation = "slideOut 0.3s ease-in";
          setTimeout(() => {
            notification.style.display = "none";
          }, 300);
        }, 3000);
      }
    },
  };
}
