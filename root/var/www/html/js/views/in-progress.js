/**
 * In Progress View
 */

function inProgressView() {
  return {
    title: '<i class="fas fa-sync-alt fa-spin-pulse"></i> In Progress',
    documentTitle: "In Progress - Uploader",
    html: `
      <div class="content-container">
        <!-- Current Stats -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-card-icon">
              <i class="fas fa-tachometer-alt"></i>
            </div>
            <div class="stat-card-content">
              <div class="stat-card-title">Current Upload Rate</div>
              <div class="stat-card-value-row">
                <div class="stat-card-value" id="current-rate">0.00 MB/s</div>
                <div id="control">
                  <span class="control-button bg-success" aria-label="Pause uploads">
                    <i class="fa-solid fa-pause"></i>
                  </span>
                </div>
              </div>
              <div class="stat-card-subtitle" id="rate-limit">Limit per Transfer: 30 MB/s</div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-card-icon">
              <i class="fas fa-exchange-alt"></i>
            </div>
            <div class="stat-card-content">
              <div class="stat-card-title">Active Transfers</div>
              <div class="stat-card-value" id="active-count">0</div>
              <div class="stat-card-subtitle" id="active-max">Max: 2</div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-card-icon">
              <i class="fas fa-database"></i>
            </div>
            <div class="stat-card-content">
              <div class="stat-card-title">Total Uploading</div>
              <div class="stat-card-value" id="total-uploading-size">0 GB</div>
              <div class="stat-card-subtitle" id="total-uploading-files">0 files</div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-card-icon">
              <i class="fas fa-clock"></i>
            </div>
            <div class="stat-card-content">
              <div class="stat-card-title">Average Speed</div>
              <div class="stat-card-value" id="avg-speed">0.00 MB/s</div>
              <div class="stat-card-subtitle">Current session</div>
            </div>
          </div>
        </div>

        <!-- Active Uploads Card -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">
              <i class="fas fa-sync-alt fa-spin-pulse"></i>
              Active Uploads
            </div>
            <div class="card-actions">
              <span class="active-uploads-badge">
                <i class="fas fa-arrow-up"></i>
                <span id="active-count-badge">0</span> active
              </span>
            </div>
          </div>
          <div class="card-body">
            <div class="table-responsive">
              <table id="uploadsTable" class="table">
                <thead>
                  <tr>
                    <th scope="col">Filename</th>
                    <th scope="col" class="d-none d-lg-table-cell">Folder</th>
                    <th scope="col" class="d-none d-lg-table-cell">Key</th>
                    <th scope="col">Progress</th>
                    <th scope="col" class="d-none d-lg-table-cell">Filesize</th>
                    <th scope="col">Time Left</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colspan="6" class="no-uploads-message">
                      <div class="empty-state">
                        <i class="fas fa-pause-circle fa-3x"></i>
                        <h3>No Active Uploads</h3>
                        <p>No files are currently being uploaded</p>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <template id="upload-row-template">
          <tr>
            <td data-title="Filename" class="truncate file-name">filename.mkv</td>
            <td data-title="Folder" class="d-none d-lg-table-cell folder-name">movies</td>
            <td data-title="Key" class="d-none d-lg-table-cell key-name">GDSA1</td>
            <td data-title="Progress">
              <div class="progress-container">
                <div class="progress-info">
                  <span class="progress-percentage">45%</span>
                </div>
                <div class="progress">
                  <div class="progress-bar bg-success" role="progressbar" style="width: 45%" aria-valuenow="45" aria-valuemin="0" aria-valuemax="100"></div>
                </div>
              </div>
            </td>
            <td data-title="Filesize" class="d-none d-lg-table-cell file-size">4.7 GB</td>
            <td data-title="Time Left" class="text-end">
              <span class="time-remaining">3m 24s</span>
              <span class="upload-speed"><i class="fas fa-tachometer-alt"></i> 24MB/s</span>
            </td>
          </tr>
        </template>

        <!-- Footer -->
        <div class="footer">
          <p>
            <i class="fa-brands fa-github"></i>
            <a href="https://github.com/dockserver" target="_blank" rel="noopener noreferrer">
              dockserver GitHub
            </a>
            |
            <i class="fa-brands fa-wikipedia-w"></i>
            <a href="https://dockserver.io" target="_blank" rel="noopener noreferrer">
              dockserver wiki
            </a>
          </p>
          <p>
            Copyrights <sup>&copy; &trade;</sup> 2021 - ${new Date().getFullYear()}
            Developed with
            <i class="fas fa-heart" style="color: var(--theme-primary)"></i> by
            dockserver.io
          </p>
        </div>
      </div>
    `,
    init: function () {
      try {
        // Load in-progress data
        if (typeof handleInProgressJobs === "function") {
          handleInProgressJobs();
        }
        if (typeof checkStatus === "function") {
          checkStatus();
        }

        // Set up auto-refresh
        if (window.inProgressRefreshInterval) {
          clearInterval(window.inProgressRefreshInterval);
        }
        window.inProgressRefreshInterval = setInterval(() => {
          try {
            if (router.currentRoute === "in-progress") {
              if (typeof handleInProgressJobs === "function")
                handleInProgressJobs();
              if (typeof checkStatus === "function") checkStatus();
            }
          } catch (error) {
            console.error("Error refreshing in-progress:", error);
          }
        }, 2000);
      } catch (error) {
        console.error("Error initializing in-progress view:", error);
      }
    },
  };
}
