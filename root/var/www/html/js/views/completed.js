/**
 * Completed View
 */

function completedView() {
  return {
    title: '<i class="fas fa-check-circle"></i> Completed Uploads',
    documentTitle: "Completed - Uploader",
    html: `
      <div class="content-container">
        <!-- Today's Stats -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-card-icon">
              <i class="fas fa-check-circle"></i>
            </div>
            <div class="stat-card-content">
              <div class="stat-card-title">Completed Today</div>
              <div class="stat-card-value" id="completed-today">0</div>
              <div class="stat-card-subtitle" id="completed-today-size">0 GB uploaded</div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-card-icon">
              <i class="fas fa-calendar-week"></i>
            </div>
            <div class="stat-card-content">
              <div class="stat-card-title">This Week</div>
              <div class="stat-card-value" id="completed-week">0</div>
              <div class="stat-card-subtitle" id="completed-week-size">0 GB</div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-card-icon">
              <i class="fas fa-calendar-alt"></i>
            </div>
            <div class="stat-card-content">
              <div class="stat-card-title">This Month</div>
              <div class="stat-card-value" id="completed-month">0</div>
              <div class="stat-card-subtitle" id="completed-month-size">0 GB</div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-card-icon">
              <i class="fas fa-infinity"></i>
            </div>
            <div class="stat-card-content">
              <div class="stat-card-title">All Time</div>
              <div class="stat-card-value" id="completed-total">0</div>
              <div class="stat-card-subtitle" id="completed-total-size">0 TB</div>
            </div>
          </div>
        </div>

        <!-- Filter Controls -->
        <div class="card">
          <div class="card-body">
            <div class="completed-filters">
              <div class="filter-group">
                <label for="date-filter">
                  <i class="fas fa-calendar"></i> Date Range
                </label>
                <select id="date-filter" class="filter-select">
                  <option value="today">Today</option>
                  <option value="yesterday">Yesterday</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="all">All Time</option>
                </select>
              </div>

              <div class="filter-group">
                <label for="search-filter">
                  <i class="fas fa-search"></i> Search
                </label>
                <input type="text" id="search-filter" class="filter-input" placeholder="Search filename or folder...">
              </div>

              <div class="filter-group">
                <button class="action-button" id="clear-history">
                  <i class="fas fa-trash-alt"></i>
                  Clear History
                </button>
                <button class="action-button" id="refresh-completed">
                  <i class="fas fa-sync"></i>
                  Refresh
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Completed Uploads Table -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">
              <i class="fas fa-check-circle"></i>
              Completed Uploads
            </div>
            <div class="card-actions">
              <span class="completed-badge">
                <i class="fas fa-check"></i>
                <span id="total-count">0</span> total
              </span>
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

            <!-- Pagination -->
            <div class="pagination-container" id="pagination-container" style="display: none;">
              <div class="pagination-info">
                Showing <span id="page-start">1</span>-<span id="page-end">10</span> of <span id="page-total">0</span>
              </div>
              <div class="pagination">
                <button class="pagination-button" id="first-page" disabled>
                  <i class="fas fa-angle-double-left"></i>
                </button>
                <button class="pagination-button" id="prev-page" disabled>
                  <i class="fas fa-angle-left"></i>
                </button>
                <div class="pagination-pages" id="pagination-pages">
                  <!-- Page buttons will be inserted here -->
                </div>
                <button class="pagination-button" id="next-page">
                  <i class="fas fa-angle-right"></i>
                </button>
                <button class="pagination-button" id="last-page">
                  <i class="fas fa-angle-double-right"></i>
                </button>
              </div>
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

      <!-- Confirm Modal -->
      <div class="modal" id="confirm-clear-modal">
        <div class="modal-content modal-content-small">
          <div class="modal-header">
            <h2>Confirm Clear History</h2>
            <button class="modal-close" data-modal="confirm-clear-modal">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="modal-body">
            <p>Are you sure you want to clear the upload history?</p>
            <p><strong>This action cannot be undone.</strong></p>
          </div>
          <div class="modal-footer">
            <button class="button-secondary" data-modal="confirm-clear-modal">Cancel</button>
            <button class="button-danger" id="confirm-clear-btn">
              <i class="fas fa-trash-alt"></i>
              Clear History
            </button>
          </div>
        </div>
      </div>
    `,
    init: function () {
      try {
        // Load completed data
        loadCompletedStats();
        if (typeof handleCompletedJobs === "function") {
          handleCompletedJobs();
        }

        // Filter handlers
        $("#date-filter").on("change", function () {
          if (typeof handleCompletedJobs === "function") {
            handleCompletedJobs();
          }
        });

        $("#search-filter").on(
          "input",
          debounce(function () {
            filterCompletedTable();
          }, 300)
        );

        // Action handlers
        $("#refresh-completed").on("click", function () {
          if (typeof handleCompletedJobs === "function") {
            handleCompletedJobs();
          }
          loadCompletedStats();
        });

        $("#clear-history").on("click", function () {
          openModal("confirm-clear-modal");
        });

        $("#confirm-clear-btn").on("click", function () {
          clearHistory();
        });

        // Set up auto-refresh
        if (window.completedRefreshInterval) {
          clearInterval(window.completedRefreshInterval);
        }
        window.completedRefreshInterval = setInterval(() => {
          try {
            if (router.currentRoute === "completed") {
              loadCompletedStats();
            }
          } catch (error) {
            console.error("Error refreshing completed:", error);
          }
        }, 30000);
      } catch (error) {
        console.error("Error initializing completed view:", error);
      }

      // Helper functions
      function loadCompletedStats() {
        $.get("srv/api/jobs/completed_today_stats.php", function (data) {
          if (data && data.success) {
            $("#completed-today").text(data.today?.count || 0);
            $("#completed-today-size").text(
              (data.today?.size || 0) + " GB uploaded"
            );
            $("#completed-week").text(data.week?.count || 0);
            $("#completed-week-size").text((data.week?.size || 0) + " GB");
            $("#completed-month").text(data.month?.count || 0);
            $("#completed-month-size").text((data.month?.size || 0) + " GB");
            $("#completed-total").text(data.total?.count || 0);
            $("#completed-total-size").text((data.total?.size || 0) + " TB");
          }
        }).fail(function (error) {
          console.error("Error loading completed stats:", error);
        });
      }

      function filterCompletedTable() {
        const searchTerm = $("#search-filter").val().toLowerCase();
        $("#completedTable tbody tr").each(function () {
          const text = $(this).text().toLowerCase();
          $(this).toggle(text.includes(searchTerm));
        });
      }

      function clearHistory() {
        $.post("srv/api/system/clean_history.php", function (data) {
          if (data && data.success) {
            showStatusMessage("History cleared successfully", "success");
            closeModal("confirm-clear-modal");
            if (typeof handleCompletedJobs === "function") {
              handleCompletedJobs();
            }
            loadCompletedStats();
          } else {
            showStatusMessage("Failed to clear history", "error");
          }
        });
      }

      function debounce(func, wait) {
        let timeout;
        return function () {
          const context = this,
            args = arguments;
          clearTimeout(timeout);
          timeout = setTimeout(() => func.apply(context, args), wait);
        };
      }
    },
  };
}
