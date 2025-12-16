/**
 * Queue View
 */

function queueView() {
  return {
    title: '<i class="fas fa-list"></i> Upload Queue',
    documentTitle: "Queue - Uploader",
    html: `
      <div class="content-container">
        <!-- Queue Stats -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-card-icon">
              <i class="fas fa-list"></i>
            </div>
            <div class="stat-card-content">
              <div class="stat-card-title">Total in Queue</div>
              <div class="stat-card-value" id="queue-count-display">0</div>
              <div class="stat-card-subtitle" id="queue-total-display">Total: 0 GB</div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-card-icon">
              <i class="fas fa-hourglass-half"></i>
            </div>
            <div class="stat-card-content">
              <div class="stat-card-title">Estimated Time</div>
              <div class="stat-card-value" id="queue-eta">-</div>
              <div class="stat-card-subtitle">Time to complete queue</div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-card-icon">
              <i class="fas fa-exchange-alt"></i>
            </div>
            <div class="stat-card-content">
              <div class="stat-card-title">Active Transfers</div>
              <div class="stat-card-value" id="active-transfers">0</div>
              <div class="stat-card-subtitle" id="max-transfers">Max: 2</div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-card-icon">
              <i class="fas fa-folder-open"></i>
            </div>
            <div class="stat-card-content">
              <div class="stat-card-title">Folders in Queue</div>
              <div class="stat-card-value" id="folders-count">0</div>
              <div class="stat-card-subtitle">Unique directories</div>
            </div>
          </div>
        </div>

        <!-- Queue Table Card -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">
              <i class="fas fa-list"></i>
              Queued Files
            </div>
            <div class="card-actions">
              <button class="action-button" id="refresh-queue">
                <i class="fas fa-sync"></i>
                Refresh
              </button>
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
        // Load queue data
        if (typeof handleQueuedJobs === "function") {
          handleQueuedJobs();
        }
        if (typeof updateRealTimeStats === "function") {
          updateRealTimeStats();
        }

        // Refresh button
        $("#refresh-queue").on("click", function () {
          if (typeof handleQueuedJobs === "function") {
            handleQueuedJobs();
          }
        });

        // Set up auto-refresh
        if (window.queueRefreshInterval) {
          clearInterval(window.queueRefreshInterval);
        }
        window.queueRefreshInterval = setInterval(() => {
          try {
            if (
              router.currentRoute === "queue" &&
              typeof handleQueuedJobs === "function"
            ) {
              handleQueuedJobs();
            }
          } catch (error) {
            console.error("Error refreshing queue:", error);
          }
        }, 5000);
      } catch (error) {
        console.error("Error initializing queue view:", error);
      }
    },
  };
}
