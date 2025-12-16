/**
 * Dashboard View
 */

function dashboardView() {
  return {
    title: '<i class="fas fa-tachometer-alt"></i> Dashboard',
    documentTitle: "Dashboard - Uploader",
    html: `
      <div class="content-container">
        <!-- Stats Grid -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-card-icon">
              <i class="fas fa-tachometer-alt"></i>
            </div>
            <div class="stat-card-content">
              <div class="stat-card-title">Current Upload Rate</div>
              <div class="stat-card-value" id="upload-rate">0.00 MB/s</div>
              <div class="stat-card-subtitle">Live transfer speed</div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-card-icon">
              <i class="fas fa-list"></i>
            </div>
            <div class="stat-card-content">
              <div class="stat-card-title">Files in Queue</div>
              <div class="stat-card-value" id="queue-count">0</div>
              <div class="stat-card-subtitle">Waiting to be uploaded</div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-card-icon">
              <i class="fas fa-sync-alt"></i>
            </div>
            <div class="stat-card-content">
              <div class="stat-card-title">Active Uploads</div>
              <div class="stat-card-value" id="active-uploads">0</div>
              <div class="stat-card-subtitle">Currently uploading</div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-card-icon">
              <i class="fas fa-check-circle"></i>
            </div>
            <div class="stat-card-content">
              <div class="stat-card-title">Completed Today</div>
              <div class="stat-card-value" id="completed-today">0</div>
              <div class="stat-card-subtitle">Successfully uploaded</div>
            </div>
          </div>
        </div>

        <!-- In Progress Uploads -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">
              <i class="fas fa-sync-alt fa-spin-pulse"></i>
              In Progress
            </div>
            <div class="card-actions">
              <a href="#in-progress" class="action-link">
                View All <i class="fas fa-arrow-right"></i>
              </a>
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

        <!-- Queue -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">
              <i class="fas fa-list"></i>
              Queue
            </div>
            <div class="card-actions">
              <a href="#queue" class="action-link">
                View All <i class="fas fa-arrow-right"></i>
              </a>
            </div>
          </div>
          <div class="card-body">
            <div class="table-responsive">
              <table id="queueTable" class="table">
                <thead>
                  <tr>
                    <th scope="col">Position</th>
                    <th scope="col">Filename</th>
                    <th scope="col" class="d-none d-lg-table-cell">Folder</th>
                    <th scope="col" class="d-none d-lg-table-cell">Key</th>
                    <th scope="col">Filesize</th>
                    <th scope="col" class="d-none d-lg-table-cell">Added</th>
                    <th scope="col">Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colspan="7" class="no-uploads-message">
                      <div class="empty-state">
                        <i class="fas fa-inbox fa-3x"></i>
                        <h3>Queue is Empty</h3>
                        <p>No files waiting to be uploaded</p>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Completed Today -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">
              <i class="fas fa-check-circle"></i>
              Completed Today
            </div>
            <div class="card-actions">
              <a href="#completed" class="action-link">
                View All <i class="fas fa-arrow-right"></i>
              </a>
            </div>
          </div>
          <div class="card-body">
            <div class="table-responsive">
              <table id="completedTable" class="table">
                <thead>
                  <tr>
                    <th scope="col">Filename</th>
                    <th scope="col" class="d-none d-lg-table-cell">Folder</th>
                    <th scope="col" class="d-none d-lg-table-cell">Key</th>
                    <th scope="col">Filesize</th>
                    <th scope="col" class="d-none d-lg-table-cell">Uploaded</th>
                    <th scope="col">Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colspan="6" class="no-uploads-message">
                      <div class="empty-state">
                        <i class="fas fa-clipboard-check fa-3x"></i>
                        <h3>No Completed Uploads</h3>
                        <p>Completed uploads will appear here</p>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div id="page" class="pagination-wrapper"></div>
          </div>
        </div>

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
      // Initialize dashboard data loading with error handling
      try {
        if (typeof handleInProgressJobs === "function") {
          handleInProgressJobs();
        }
        if (typeof handleQueuedJobs === "function") {
          handleQueuedJobs();
        }
        if (typeof handleCompletedJobList === "function") {
          handleCompletedJobList();
        }
        if (typeof updateRealTimeStats === "function") {
          updateRealTimeStats();
        }
        if (typeof checkStatus === "function") {
          checkStatus();
        }
      } catch (error) {
        console.error("Error initializing dashboard:", error);
      }

      // Set up auto-refresh
      if (window.dashboardRefreshInterval) {
        clearInterval(window.dashboardRefreshInterval);
      }
      window.dashboardRefreshInterval = setInterval(() => {
        if (router.currentRoute === "dashboard") {
          try {
            if (typeof handleInProgressJobs === "function")
              handleInProgressJobs();
            if (typeof updateRealTimeStats === "function")
              updateRealTimeStats();
          } catch (error) {
            console.error("Error refreshing dashboard:", error);
          }
        }
      }, 3000);
    },
  };
}
