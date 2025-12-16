/**
 * Statistics View
 */

function statisticsView() {
  return {
    title: '<i class="fas fa-chart-line"></i> Statistics & Analytics',
    documentTitle: "Statistics - Uploader",
    html: `
      <div class="content-container">
        <!-- Time Period Selector -->
        <div class="card">
          <div class="card-body">
            <div class="stats-time-selector">
              <button class="time-selector-btn active" data-period="today">Today</button>
              <button class="time-selector-btn" data-period="week">This Week</button>
              <button class="time-selector-btn" data-period="month">This Month</button>
              <button class="time-selector-btn" data-period="year">This Year</button>
              <button class="time-selector-btn" data-period="all">All Time</button>
            </div>
          </div>
        </div>

        <!-- Overview Stats -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-card-icon">
              <i class="fas fa-file-upload"></i>
            </div>
            <div class="stat-card-content">
              <div class="stat-card-title">Total Uploads</div>
              <div class="stat-card-value" id="total-uploads">0</div>
              <div class="stat-card-subtitle">
                <span class="stat-trend up">
                  <i class="fas fa-arrow-up"></i> 12.5%
                </span>
                vs previous period
              </div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-card-icon">
              <i class="fas fa-database"></i>
            </div>
            <div class="stat-card-content">
              <div class="stat-card-title">Total Data</div>
              <div class="stat-card-value" id="total-data">0 GB</div>
              <div class="stat-card-subtitle">
                <span class="stat-trend up">
                  <i class="fas fa-arrow-up"></i> 8.3%
                </span>
                vs previous period
              </div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-card-icon">
              <i class="fas fa-tachometer-alt"></i>
            </div>
            <div class="stat-card-content">
              <div class="stat-card-title">Average Speed</div>
              <div class="stat-card-value" id="avg-speed-display">0 MB/s</div>
              <div class="stat-card-subtitle">
                <span class="stat-trend up">
                  <i class="fas fa-arrow-up"></i> 5.7%
                </span>
                vs previous period
              </div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-card-icon">
              <i class="fas fa-clock"></i>
            </div>
            <div class="stat-card-content">
              <div class="stat-card-title">Total Upload Time</div>
              <div class="stat-card-value" id="total-time">0h 0m</div>
              <div class="stat-card-subtitle">Active upload time</div>
            </div>
          </div>
        </div>

        <!-- Charts Row -->
        <div class="stats-charts-grid">
          <!-- Upload Trend Chart -->
          <div class="card">
            <div class="card-header">
              <div class="card-title">
                <i class="fas fa-chart-line"></i>
                Upload Trend
              </div>
              <div class="card-actions">
                <select class="chart-selector">
                  <option value="count">Upload Count</option>
                  <option value="size">Upload Size</option>
                </select>
              </div>
            </div>
            <div class="card-body">
              <div class="chart-placeholder">
                <i class="fas fa-chart-area fa-3x"></i>
                <p>Upload trend chart would be displayed here</p>
                <small>Integration with Chart.js or similar library recommended</small>
              </div>
            </div>
          </div>

          <!-- Speed Distribution Chart -->
          <div class="card">
            <div class="card-header">
              <div class="card-title">
                <i class="fas fa-chart-bar"></i>
                Speed Distribution
              </div>
            </div>
            <div class="card-body">
              <div class="chart-placeholder">
                <i class="fas fa-chart-bar fa-3x"></i>
                <p>Speed distribution chart would be displayed here</p>
                <small>Shows upload speed ranges and frequency</small>
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
    `,
    init: function () {
      // Load statistics
      $(".time-selector-btn").on("click", function () {
        $(".time-selector-btn").removeClass("active");
        $(this).addClass("active");
        const period = $(this).data("period");
        loadStatistics(period);
      });

      loadStatistics("today");

      function loadStatistics(period) {
        $.get("srv/api/jobs/queue_stats.php", function (data) {
          if (data) {
            // Update stats display based on data
          }
        });
      }
    },
  };
}
