/**
 * Utility functions for the Uploader Dashboard
 */

/**
 * Format file size to appropriate unit (Bytes, KB, MB, GB, TB)
 * @param {number} bytes - Size in bytes
 * @param {number} decimals - Number of decimal places to display
 * @returns {string} Formatted size with unit
 */
function formatFileSize(bytes, decimals = 2) {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

/**
 * Parse file size string to bytes
 * @param {string} sizeStr - Size string (e.g. "2.5 GB", "500 MB")
 * @returns {number} Size in bytes
 */
function parseFileSize(sizeStr) {
  if (!sizeStr) return 0;

  // Extract numeric part and unit
  const match = sizeStr.match(/^([\d.]+)\s*([KMGT]?B?)$/i);
  if (!match) return 0;

  const num = parseFloat(match[1]);
  const unit = match[2].toUpperCase();

  // Convert based on unit
  const multipliers = {
    B: 1,
    KB: 1024,
    MB: 1024 ** 2,
    GB: 1024 ** 3,
    TB: 1024 ** 4,
    // Handle short forms
    K: 1024,
    M: 1024 ** 2,
    G: 1024 ** 3,
    T: 1024 ** 4,
  };

  return num * (multipliers[unit] || 1);
}

/**
 * Format a timestamp to a human-readable relative time (e.g., "2 hours ago")
 * @param {number} timestamp - Unix timestamp
 * @returns {string} Relative time string
 */
function formatRelativeTime(timestamp) {
  const now = Math.floor(Date.now() / 1000);
  const diff = now - timestamp;

  // Time intervals in seconds
  const intervals = [
    { label: "year", seconds: 31536000 },
    { label: "month", seconds: 2592000 },
    { label: "week", seconds: 604800 },
    { label: "day", seconds: 86400 },
    { label: "hour", seconds: 3600 },
    { label: "minute", seconds: 60 },
    { label: "second", seconds: 1 },
  ];

  for (const interval of intervals) {
    const count = Math.floor(diff / interval.seconds);
    if (count >= 1) {
      return `${count} ${interval.label}${count !== 1 ? "s" : ""} ago`;
    }
  }

  return "just now";
}

/**
 * Format a timestamp to a date/time string
 * @param {number} timestamp - Unix timestamp
 * @returns {string} Formatted date string
 */
function formatDateTime(timestamp) {
  const date = new Date(timestamp * 1000);
  return date.toLocaleString();
}

/**
 * Check if a date is today
 * @param {Date|number|string} dateInput - Date to check
 * @returns {boolean} True if the date is today
 */
function isToday(dateInput) {
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  const today = new Date();

  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

/**
 * Fetch data with error handling
 * @param {string} url - URL to fetch
 * @param {Object} options - Fetch options
 * @returns {Promise<any>} Response data
 */
async function fetchWithErrorHandling(url, options = {}) {
  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Fetch error:", error);
    showStatusMessage(`Failed to fetch data: ${error.message}`, true);
    throw error;
  }
}

/**
 * Show a status message
 * @param {string} message - Message to display
 * @param {boolean} isError - Whether this is an error message
 */
function showStatusMessage(message, isError = false) {
  const statusMessage = document.getElementById("status-message");
  if (!statusMessage) {
    console.error("Status message element not found");
    console.log(message);
    return;
  }

  statusMessage.textContent = message;

  if (isError) {
    statusMessage.classList.add("error");
  } else {
    statusMessage.classList.remove("error");
  }

  statusMessage.style.display = "block";

  // Hide after 3 seconds
  setTimeout(() => {
    statusMessage.style.display = "none";
  }, 3000);
}

/**
 * Debounce function to limit the rate at which a function can fire
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
function debounce(func, wait) {
  let timeout;

  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };

    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Get query parameters from URL
 * @returns {Object} Object containing query parameters
 */
function getQueryParams() {
  const params = {};
  const searchParams = new URLSearchParams(window.location.search);

  for (const [key, value] of searchParams.entries()) {
    params[key] = value;
  }

  return params;
}

/**
 * Show a toast notification
 * @param {string} message - Message to display
 * @param {string} type - Type of toast (success, error, info, warning)
 * @param {number} duration - Duration in milliseconds (default: 3000)
 */
function showToast(message, type = "info", duration = 3000) {
  // Create toast container if it doesn't exist
  let container = document.querySelector(".toast-container");
  if (!container) {
    container = document.createElement("div");
    container.className = "toast-container";
    document.body.appendChild(container);
  }

  // Create toast element
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;

  // Set icon based on type
  const icons = {
    success: "fa-check-circle",
    error: "fa-exclamation-circle",
    info: "fa-info-circle",
    warning: "fa-exclamation-triangle",
  };

  toast.innerHTML = `
    <div class="toast-icon">
      <i class="fas ${icons[type] || icons.info}"></i>
    </div>
    <div class="toast-content">
      <div class="toast-message">${message}</div>
    </div>
    <button class="toast-close" aria-label="Close">
      <i class="fas fa-times"></i>
    </button>
  `;

  // Add to container
  container.appendChild(toast);

  // Close button handler
  const closeBtn = toast.querySelector(".toast-close");
  closeBtn.addEventListener("click", () => {
    removeToast(toast);
  });

  // Auto-remove after duration
  setTimeout(() => {
    removeToast(toast);
  }, duration);
}

/**
 * Remove a toast notification
 * @param {HTMLElement} toast - Toast element to remove
 */
function removeToast(toast) {
  toast.classList.add("removing");
  setTimeout(() => {
    if (toast.parentNode) {
      toast.parentNode.removeChild(toast);
    }
  }, 300);
}

/**
 * Save a user setting to localStorage
 * @param {string} key - Setting key
 * @param {any} value - Setting value
 */
function saveUserSetting(key, value) {
  try {
    localStorage.setItem(`uploader_${key}`, JSON.stringify(value));
  } catch (error) {
    console.error("Failed to save setting:", error);
  }
}

/**
 * Get a user setting from localStorage
 * @param {string} key - Setting key
 * @param {any} defaultValue - Default value if setting doesn't exist
 * @returns {any} Setting value
 */
function getUserSetting(key, defaultValue) {
  try {
    const value = localStorage.getItem(`uploader_${key}`);
    return value !== null ? JSON.parse(value) : defaultValue;
  } catch (error) {
    console.error("Failed to retrieve setting:", error);
    return defaultValue;
  }
}

/**
 * Creates a mock Chart.js chart for the upload history if Chart.js is loaded
 * @param {string} chartId - ID of the canvas element
 * @param {string} timeRange - Time range to display (day, week, month)
 */
function createMockUploadChart(chartId, timeRange = "week") {
  if (!window.Chart) {
    console.warn("Chart.js not loaded, skipping chart creation");
    return;
  }

  const ctx = document.getElementById(chartId);
  if (!ctx) return;

  // Clean up any existing chart
  if (window.uploadChart) {
    window.uploadChart.destroy();
  }

  // Generate mock data based on timeRange
  const labels = [];
  const uploadData = [];
  const completedData = [];

  const today = new Date();
  let days = 7;

  switch (timeRange) {
    case "day":
      days = 1;
      // Generate hourly data for the last 24 hours
      for (let i = 0; i < 24; i++) {
        const hour = new Date(today);
        hour.setHours(today.getHours() - 23 + i);
        labels.push(
          hour.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        );
        uploadData.push(Math.floor(Math.random() * 5) + 1); // 1-5 GB/hour
        completedData.push(Math.floor(Math.random() * 4) + 1); // 1-4 files/hour
      }
      break;

    case "month":
      days = 30;
      // Generate daily data for the last 30 days
      for (let i = 0; i < days; i++) {
        const day = new Date(today);
        day.setDate(today.getDate() - (days - 1) + i);
        labels.push(
          day.toLocaleDateString([], { month: "short", day: "numeric" })
        );
        uploadData.push(Math.floor(Math.random() * 20) + 5); // 5-25 GB/day
        completedData.push(Math.floor(Math.random() * 15) + 5); // 5-20 files/day
      }
      break;

    case "week":
    default:
      // Generate daily data for the last 7 days
      for (let i = 0; i < days; i++) {
        const day = new Date(today);
        day.setDate(today.getDate() - (days - 1) + i);
        labels.push(day.toLocaleDateString([], { weekday: "short" }));
        uploadData.push(Math.floor(Math.random() * 15) + 3); // 3-18 GB/day
        completedData.push(Math.floor(Math.random() * 10) + 2); // 2-12 files/day
      }
      break;
  }

  // Create chart
  window.uploadChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Upload Volume (GB)",
          data: uploadData,
          backgroundColor: getComputedStyle(
            document.documentElement
          ).getPropertyValue("--accent-transparent"),
          borderColor: getComputedStyle(
            document.documentElement
          ).getPropertyValue("--accent-color"),
          borderWidth: 1,
          yAxisID: "y",
        },
        {
          label: "Files Completed",
          data: completedData,
          type: "line",
          backgroundColor: "rgba(75, 192, 192, 0.2)",
          borderColor: "rgba(75, 192, 192, 1)",
          borderWidth: 2,
          pointRadius: 3,
          pointBackgroundColor: "rgba(75, 192, 192, 1)",
          yAxisID: "y1",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: "Upload Volume (GB)",
          },
          grid: {
            color: "rgba(255, 255, 255, 0.1)",
          },
          ticks: {
            color: "rgba(255, 255, 255, 0.7)",
          },
        },
        y1: {
          beginAtZero: true,
          position: "right",
          title: {
            display: true,
            text: "Files Completed",
          },
          grid: {
            drawOnChartArea: false,
          },
          ticks: {
            color: "rgba(75, 192, 192, 0.7)",
          },
        },
        x: {
          grid: {
            color: "rgba(255, 255, 255, 0.1)",
          },
          ticks: {
            color: "rgba(255, 255, 255, 0.7)",
          },
        },
      },
      plugins: {
        legend: {
          labels: {
            color: "rgba(255, 255, 255, 0.7)",
          },
        },
        tooltip: {
          mode: "index",
          intersect: false,
        },
      },
    },
  });
}

/**
 * Update the theme colors for the chart
 */
function updateChartThemeColors() {
  if (!window.uploadChart) return;

  const accentColor = getComputedStyle(document.documentElement)
    .getPropertyValue("--accent-color")
    .trim();
  const accentTransparent = getComputedStyle(document.documentElement)
    .getPropertyValue("--accent-transparent")
    .trim();

  window.uploadChart.data.datasets[0].borderColor = accentColor;
  window.uploadChart.data.datasets[0].backgroundColor = accentTransparent;
  window.uploadChart.update();
}

/**
 * Set the theme for the application
 * @param {string} theme - Theme name
 */
function setTheme(theme) {
  console.log("Applying theme:", theme);

  // Apply theme attributes
  document.documentElement.setAttribute("data-theme", theme);
  document.body.setAttribute("data-theme", theme);

  updateThemeBackground(theme);

  // Update active visual state
  const themeOptions = document.querySelectorAll(".theme-option");
  themeOptions.forEach((option) => {
    if (option.dataset.theme === theme) {
      option.classList.add("active");
    } else {
      option.classList.remove("active");
    }
  });

  updateChartThemeColors();

  // Save theme in a single place
  saveUserSetting("theme", theme);
}

// Alternative jQuery implementation
// $(".theme-option").removeClass("active");
// $(`.theme-option[data-theme="${theme}"]`).addClass("active");

// Update chart colors when theme changes

/**
 * Ensure theme backgrounds apply correctly
 * @param {string} theme - Theme name
 */
function updateThemeBackground(theme) {
  const themesWithBackgrounds = [
    "overseerr",
    "hotline",
    "maroon",
    "plex",
    "aquamarine",
    "dark",
    "nord",
    "dracula",
    "space-gray",
    "hotpink",
  ];

  // Clear any existing background properties
  document.body.style.background = "";
  document.body.style.backgroundImage = "none";
  document.body.style.backgroundColor = "";

  // Apply the theme data attribute which will activate the CSS rules
  document.documentElement.setAttribute("data-theme", theme);
  document.body.setAttribute("data-theme", theme);

  // For themes with custom backgrounds, we need to ensure they get applied
  if (themesWithBackgrounds.includes(theme)) {
    // Force a repaint to ensure background styles apply correctly
    void document.body.offsetWidth;
  }
}

/**
 * Initialize theme on page load
 */
function initializeTheme() {
  console.log("Initializing theme...");

  // Try both storage methods for backward compatibility
  let savedTheme;

  try {
    // First try direct localStorage (used in index.html)
    const directTheme = localStorage.getItem("uploader_theme");
    if (directTheme) {
      savedTheme = JSON.parse(directTheme);
    } else {
      // Fallback to getUserSetting method
      savedTheme = getUserSetting("theme", "dark");
    }
  } catch (error) {
    console.warn("Error loading theme, using default:", error);
    savedTheme = "dark";
  }

  setTheme(savedTheme);
  saveUserSetting("theme", savedTheme);
}

/**
 * Setup event listeners for theme switching
 */
function setupThemeEventListeners() {
  // Theme selection using event delegation for better performance
  document.addEventListener("click", function (e) {
    const themeOption = e.target.closest(".theme-option");
    if (themeOption) {
      const theme = themeOption.dataset.theme;
      setTheme(theme);
      saveUserSetting("theme", theme);
    }
  });

  // Alternative jQuery implementation
  // $(".theme-option").on("click", function () {
  //   const theme = $(this).data("theme");
  //   setTheme(theme);
  //   saveUserSetting("theme", theme);
  // });
}

/**
 * Escape HTML special characters to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
  if (!text) return "";
  const map = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return String(text).replace(/[&<>"']/g, function (m) {
    return map[m];
  });
}
