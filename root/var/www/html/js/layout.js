/**
 * Layout JavaScript for Uploader Dashboard
 * Handles sidebar, theme switcher, and layout interactions
 */

(function () {
  "use strict";

  // Initialize on document ready
  $(document).ready(function () {
    initializeSidebar();
    initializeThemeSwitcher();
    initializeModal();
    syncTopNavStats();
    loadAppVersionSidebar();
  });

  /**
   * Initialize Sidebar Toggle
   */
  function initializeSidebar() {
    const sidebar = document.getElementById("sidebar");
    const sidebarToggle = document.getElementById("sidebar-toggle");
    const mainWrapper = document.querySelector(".main-wrapper");

    if (!sidebar || !sidebarToggle) return;

    // Toggle sidebar on button click
    sidebarToggle.addEventListener("click", function () {
      sidebar.classList.toggle("active");

      // Add overlay on mobile
      if (window.innerWidth <= 1024) {
        toggleOverlay();
      }
    });

    // Close sidebar when clicking outside on mobile
    document.addEventListener("click", function (e) {
      if (window.innerWidth <= 1024 && sidebar.classList.contains("active")) {
        if (!sidebar.contains(e.target) && !sidebarToggle.contains(e.target)) {
          sidebar.classList.remove("active");
          removeOverlay();
        }
      }
    });

    // Handle window resize
    let resizeTimer;
    window.addEventListener("resize", function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        if (window.innerWidth > 1024) {
          sidebar.classList.remove("active");
          removeOverlay();
        }
      }, 250);
    });

    // Sidebar settings button
    const sidebarSettingsBtn = document.getElementById("sidebar-settings-btn");
    if (sidebarSettingsBtn) {
      sidebarSettingsBtn.addEventListener("click", function (e) {
        e.preventDefault();
        openSettings();
      });
    }
  }

  /**
   * Toggle/Remove Overlay for Mobile
   */
  function toggleOverlay() {
    let overlay = document.querySelector(".sidebar-overlay");
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.className = "sidebar-overlay";
      overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        z-index: 150;
        backdrop-filter: blur(2px);
      `;
      document.body.appendChild(overlay);

      overlay.addEventListener("click", function () {
        document.getElementById("sidebar").classList.remove("active");
        removeOverlay();
      });
    }
  }

  function removeOverlay() {
    const overlay = document.querySelector(".sidebar-overlay");
    if (overlay) {
      overlay.remove();
    }
  }

  /**
   * Initialize Theme Switcher
   */
  function initializeThemeSwitcher() {
    const themeSwitcherBtn = document.getElementById("theme-switcher-btn");
    const themeDropdown = document.getElementById("theme-dropdown");
    const themeItems = document.querySelectorAll(".theme-item");

    if (!themeSwitcherBtn || !themeDropdown) return;

    // Toggle theme dropdown
    themeSwitcherBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      themeDropdown.classList.toggle("active");
    });

    // Close dropdown when clicking outside
    document.addEventListener("click", function (e) {
      if (
        !themeDropdown.contains(e.target) &&
        !themeSwitcherBtn.contains(e.target)
      ) {
        themeDropdown.classList.remove("active");
      }
    });

    // Apply theme on click
    themeItems.forEach(function (item) {
      item.addEventListener("click", function () {
        const theme = this.getAttribute("data-theme");
        applyTheme(theme);

        // Update active state
        themeItems.forEach((t) => t.classList.remove("active"));
        this.classList.add("active");

        // Close dropdown
        themeDropdown.classList.remove("active");
      });
    });

    // Load saved theme
    loadSavedTheme();
  }

  /**
   * Apply Theme
   */
  function applyTheme(theme) {
    console.log("Applying theme:", theme);

    // Apply to document
    document.documentElement.setAttribute("data-theme", theme);
    document.body.setAttribute("data-theme", theme);

    // Save to localStorage
    try {
      localStorage.setItem("uploader_theme", JSON.stringify(theme));
      console.log("Theme saved:", theme);
    } catch (error) {
      console.error("Failed to save theme:", error);
    }
  }

  /**
   * Load Saved Theme
   */
  function loadSavedTheme() {
    try {
      const savedTheme = localStorage.getItem("uploader_theme");
      const theme = savedTheme ? JSON.parse(savedTheme) : "dark"; // Default to dark theme
      console.log("Loading theme:", theme);

      // Apply theme
      applyTheme(theme);

      // Update active state
      const themeItems = document.querySelectorAll(".theme-item");
      themeItems.forEach((item) => {
        if (item.getAttribute("data-theme") === theme) {
          item.classList.add("active");
        }
      });
    } catch (error) {
      console.error("Error loading theme:", error);
      // Apply dark theme as fallback
      applyTheme("dark");
    }
  }

  /**
   * Initialize Modal Handlers
   */
  function initializeModal() {
    const settingsToggle = document.getElementById("settings-toggle");
    const settingsModal = document.getElementById("settings-modal");
    const modalClose = document.getElementById("modal-close");
    const modalOverlay = document.getElementById("modal-overlay");

    if (!settingsToggle || !settingsModal) return;

    // Open modal
    settingsToggle.addEventListener("click", openSettings);

    // Close modal
    if (modalClose) {
      modalClose.addEventListener("click", closeSettings);
    }

    if (modalOverlay) {
      modalOverlay.addEventListener("click", closeSettings);
    }

    // Close on Escape key
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && settingsModal.classList.contains("active")) {
        closeSettings();
      }
    });
  }

  /**
   * Open Settings Modal
   */
  function openSettings() {
    const settingsModal = document.getElementById("settings-modal");
    const modalOverlay = document.getElementById("modal-overlay");

    if (settingsModal) {
      settingsModal.classList.add("active");
    }
    if (modalOverlay) {
      modalOverlay.classList.add("active");
    }

    // Prevent body scroll
    document.body.style.overflow = "hidden";
  }

  /**
   * Close Settings Modal
   */
  function closeSettings() {
    const settingsModal = document.getElementById("settings-modal");
    const modalOverlay = document.getElementById("modal-overlay");

    if (settingsModal) {
      settingsModal.classList.remove("active");
    }
    if (modalOverlay) {
      modalOverlay.classList.remove("active");
    }

    // Restore body scroll
    document.body.style.overflow = "";
  }

  /**
   * Sync Top Nav Stats
   * Update top navbar stats from main stats cards
   */
  function syncTopNavStats() {
    // Create a MutationObserver to watch for changes in the stats
    const observeElement = function (elementId, targetId) {
      const element = document.getElementById(elementId);
      const target = document.getElementById(targetId);

      if (!element || !target) return;

      // Initial sync
      target.textContent = element.textContent;

      // Watch for changes
      const observer = new MutationObserver(function (mutations) {
        target.textContent = element.textContent;
      });

      observer.observe(element, {
        childList: true,
        characterData: true,
        subtree: true,
      });
    };

    // Sync rate
    observeElement("current-rate", "topnav-rate");

    // Sync queue count
    observeElement("queue-count", "topnav-queue");

    // Sync active count
    observeElement("active-count", "topnav-active");

    // Also sync navigation badges
    const syncBadge = function (sourceId, targetId) {
      const source = document.getElementById(sourceId);
      const target = document.getElementById(targetId);

      if (!source || !target) return;

      const observer = new MutationObserver(function () {
        target.textContent = source.textContent;
      });

      observer.observe(source, {
        childList: true,
        characterData: true,
        subtree: true,
      });
    };

    syncBadge("queue-count", "nav-queue-count");
    syncBadge("active-count-badge", "nav-progress-count");
  }

  /**
   * Load App Version for Sidebar
   */
  function loadAppVersionSidebar() {
    const sidebarVersion = document.getElementById("sidebar-version");
    if (!sidebarVersion) return;

    // Try dedicated API endpoint first
    fetch("srv/api/system/version.php")
      .then((response) => response.json())
      .then((data) => {
        if (data && data.version) {
          sidebarVersion.textContent = "v" + data.version;
        }
      })
      .catch((error) => {
        // Fallback to direct file access
        fetch("release.json")
          .then((response) => response.json())
          .then((data) => {
            if (data && data.newversion) {
              sidebarVersion.textContent = "v" + data.newversion;
            }
          })
          .catch(() => {
            sidebarVersion.textContent = "v5.0.0";
          });
      });
  }

  /**
   * Update Active Navigation Item
   */
  function updateActiveNav() {
    const currentPath = window.location.pathname;
    const navItems = document.querySelectorAll(".sidebar-menu-item");

    navItems.forEach((item) => {
      const link = item.querySelector(".sidebar-menu-link");
      if (link && link.getAttribute("href") === currentPath) {
        item.classList.add("active");
      } else {
        item.classList.remove("active");
      }
    });
  }

  // Expose functions globally if needed
  window.uploaderLayout = {
    openSettings: openSettings,
    closeSettings: closeSettings,
    applyTheme: applyTheme,
  };
})();
