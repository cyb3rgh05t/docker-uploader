/**
 * About View
 */

function aboutView() {
  return {
    title: '<i class="fas fa-info-circle"></i> About',
    documentTitle: "About - Uploader",
    html: `
      <div class="content-container">
        <!-- About Header -->
        <div class="page-header">
          <div class="page-header-content">
            <h2>About Docker Uploader</h2>
            <p>Automated Google Drive upload manager with rclone</p>
          </div>
        </div>

        <!-- Version Info Card -->
        <div class="card">
          <div class="card-body">
            <div class="info-grid">
              <div class="info-item">
                <i class="fas fa-code-branch"></i>
                <div class="info-content">
                  <div class="info-label">Version</div>
                  <div class="info-value" id="app-version">loading...</div>
                </div>
              </div>
              <div class="info-item">
                <i class="fas fa-clock"></i>
                <div class="info-content">
                  <div class="info-label">Released</div>
                  <div class="info-value" id="release-date">loading...</div>
                </div>
              </div>
              <div class="info-item">
                <i class="fas fa-user"></i>
                <div class="info-content">
                  <div class="info-label">Developer</div>
                  <div class="info-value">dockserver.io</div>
                </div>
              </div>
              <div class="info-item">
                <i class="fas fa-file-code"></i>
                <div class="info-content">
                  <div class="info-label">License</div>
                  <div class="info-value">MIT</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Features Card -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">
              <i class="fas fa-star"></i>
              Key Features
            </div>
          </div>
          <div class="card-body">
            <div class="features-grid">
              <div class="feature-item">
                <div class="feature-icon">
                  <i class="fas fa-cloud-upload-alt"></i>
                </div>
                <div class="feature-content">
                  <h4>Automated Uploads</h4>
                  <p>Automatically upload files to Google Drive using rclone</p>
                </div>
              </div>
              <div class="feature-item">
                <div class="feature-icon">
                  <i class="fas fa-sync-alt"></i>
                </div>
                <div class="feature-content">
                  <h4>Real-time Monitoring</h4>
                  <p>Track upload progress with live status updates</p>
                </div>
              </div>
              <div class="feature-item">
                <div class="feature-icon">
                  <i class="fas fa-list"></i>
                </div>
                <div class="feature-content">
                  <h4>Queue Management</h4>
                  <p>Organize and prioritize upload tasks efficiently</p>
                </div>
              </div>
              <div class="feature-item">
                <div class="feature-icon">
                  <i class="fas fa-chart-line"></i>
                </div>
                <div class="feature-content">
                  <h4>Statistics</h4>
                  <p>Detailed analytics and upload history tracking</p>
                </div>
              </div>
              <div class="feature-item">
                <div class="feature-icon">
                  <i class="fas fa-cogs"></i>
                </div>
                <div class="feature-content">
                  <h4>Customizable</h4>
                  <p>Configure bandwidth, transfers, and notifications</p>
                </div>
              </div>
              <div class="feature-item">
                <div class="feature-icon">
                  <i class="fas fa-palette"></i>
                </div>
                <div class="feature-content">
                  <h4>Modern UI</h4>
                  <p>Beautiful interface with 8 theme options</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Links Card -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">
              <i class="fas fa-link"></i>
              Resources & Links
            </div>
          </div>
          <div class="card-body">
            <div class="links-grid">
              <a href="https://github.com/cyb3rgh05t/docker-uploader" target="_blank" rel="noopener noreferrer" class="link-item">
                <div class="link-icon">
                  <i class="fab fa-github"></i>
                </div>
                <div class="link-content">
                  <h4>GitHub Repository</h4>
                  <p>Source code and documentation</p>
                </div>
                <i class="fas fa-external-link-alt link-arrow"></i>
              </a>
              <a href="https://dockserver.io" target="_blank" rel="noopener noreferrer" class="link-item">
                <div class="link-icon">
                  <i class="fas fa-book"></i>
                </div>
                <div class="link-content">
                  <h4>Documentation</h4>
                  <p>User guides and tutorials</p>
                </div>
                <i class="fas fa-external-link-alt link-arrow"></i>
              </a>
              <a href="https://github.com/cyb3rgh05t/docker-uploader/issues" target="_blank" rel="noopener noreferrer" class="link-item">
                <div class="link-icon">
                  <i class="fas fa-bug"></i>
                </div>
                <div class="link-content">
                  <h4>Report Issues</h4>
                  <p>Bug reports and feature requests</p>
                </div>
                <i class="fas fa-external-link-alt link-arrow"></i>
              </a>
              <a href="https://github.com/dockserver" target="_blank" rel="noopener noreferrer" class="link-item">
                <div class="link-icon">
                  <i class="fas fa-users"></i>
                </div>
                <div class="link-content">
                  <h4>Community</h4>
                  <p>Join the dockserver community</p>
                </div>
                <i class="fas fa-external-link-alt link-arrow"></i>
              </a>
            </div>
          </div>
        </div>

        <!-- Credits Card -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">
              <i class="fas fa-heart"></i>
              Credits & Technologies
            </div>
          </div>
          <div class="card-body">
            <div class="credits-content">
              <p class="credits-text">
                Built with <i class="fas fa-heart" style="color: var(--theme-primary)"></i> by
                <a href="https://github.com/cyb3rgh05t" target="_blank" rel="noopener noreferrer">cyb3rgh05t</a>
                and the <a href="https://dockserver.io" target="_blank" rel="noopener noreferrer">dockserver.io</a> team
              </p>
              <div class="tech-badges">
                <span class="tech-badge">
                  <i class="fab fa-php"></i>
                  PHP
                </span>
                <span class="tech-badge">
                  <i class="fab fa-js"></i>
                  JavaScript
                </span>
                <span class="tech-badge">
                  <i class="fab fa-html5"></i>
                  HTML5
                </span>
                <span class="tech-badge">
                  <i class="fab fa-css3-alt"></i>
                  CSS3
                </span>
                <span class="tech-badge">
                  <i class="fab fa-docker"></i>
                  Docker
                </span>
                <span class="tech-badge">
                  <i class="fas fa-cloud"></i>
                  Rclone
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- License Card -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">
              <i class="fas fa-file-contract"></i>
              License
            </div>
          </div>
          <div class="card-body">
            <div class="license-content">
              <p>
                This project is licensed under the MIT License. You are free to use, modify, and distribute this software
                in accordance with the license terms.
              </p>
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
      // Load version info
      fetch("srv/api/system/version.php")
        .then((response) => response.json())
        .then((data) => {
          if (data && data.version) {
            document.getElementById("app-version").textContent = data.version;
          }
        })
        .catch((err) => console.error("Error loading version:", err));

      // Load release date
      fetch("release.json")
        .then((response) => response.json())
        .then((data) => {
          if (data && data.release_date) {
            document.getElementById("release-date").textContent =
              data.release_date;
          }
        })
        .catch((err) => console.error("Error loading release date:", err));
    },
  };
}
