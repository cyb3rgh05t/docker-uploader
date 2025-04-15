/**
 * Enhanced utility functions for the Uploader Dashboard
 * Version 1.3.0
 */

/**
 * Format file size to appropriate unit (Bytes, KB, MB, GB, TB)
 * @param {number} bytes - Size in bytes
 * @param {number} decimals - Number of decimal places to display
 * @returns {string} Formatted size with unit
 */
function formatFileSize(bytes, decimals = 2) {
  if (bytes === 0) return "0 Bytes";
  if (isNaN(bytes) || bytes < 0) return "Unknown";

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
  if (typeof sizeStr === "number") return sizeStr;

  // Extract numeric part and unit
  const match = String(sizeStr).match(/^([\d.]+)\s*([KMGTPEZY]?[i]?[B]?)$/i);
  if (!match) return 0;

  const num = parseFloat(match[1]);
  const unit = match[2].toUpperCase();

  // Convert based on unit
  const multipliers = {
    B: 1,
    KB: 1024,
    KIB: 1024,
    MB: 1024 ** 2,
    MIB: 1024 ** 2,
    GB: 1024 ** 3,
    GIB: 1024 ** 3,
    TB: 1024 ** 4,
    TIB: 1024 ** 4,
    PB: 1024 ** 5,
    PIB: 1024 ** 5,
    // Handle short forms
    K: 1024,
    M: 1024 ** 2,
    G: 1024 ** 3,
    T: 1024 ** 4,
    P: 1024 ** 5,
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

  // Handling edge cases
  if (isNaN(diff) || diff < 0) return "in the future";
  if (diff === 0) return "just now";

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
 * @param {boolean} includeTime - Whether to include the time
 * @returns {string} Formatted date string
 */
function formatDateTime(timestamp, includeTime = true) {
  if (!timestamp) return "N/A";

  try {
    const date = new Date(timestamp * 1000);
    const options = {
      year: "numeric",
      month: "short",
      day: "numeric",
    };

    if (includeTime) {
      options.hour = "2-digit";
      options.minute = "2-digit";
      options.second = "2-digit";
    }

    return date.toLocaleString(undefined, options);
  } catch (e) {
    console.error("Error formatting date:", e);
    return "Invalid date";
  }
}

/**
 * Check if a date is today
 * @param {Date|number|string} dateInput - Date to check
 * @returns {boolean} True if the date is today
 */
function isToday(dateInput) {
  if (!dateInput) return false;

  try {
    const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
    const today = new Date();

    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  } catch (e) {
    console.error("Error checking date:", e);
    return false;
  }
}

/**
 * Enhanced fetch with error handling, timeout, and retries
 * @param {string} url - URL to fetch
 * @param {Object} options - Fetch options
 * @param {number} retries - Number of retries
 * @param {number} timeout - Timeout in milliseconds
 * @returns {Promise<any>} Response data
 */
async function fetchWithErrorHandling(
  url,
  options = {},
  retries = 3,
  timeout = 10000
) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    options.signal = controller.signal;

    try {
      const response = await fetch(url, options);
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  } catch (error) {
    if (error.name === "AbortError") {
      console.warn(`Fetch timeout for ${url}`);
      showStatusMessage(`Request to ${url.split("/").pop()} timed out`, true);
    } else {
      console.error("Fetch error:", error);
    }

    if (retries > 0) {
      console.log(`Retrying fetch (${retries} attempts left)...`);
      return fetchWithErrorHandling(url, options, retries - 1, timeout);
    }

    showStatusMessage(`Failed to fetch data: ${error.message}`, true);
    throw error;
  }
}

/**
 * Show a status message with enhanced animation
 * @param {string} message - Message to display
 * @param {boolean} isError - Whether this is an error message
 * @param {number} duration - Duration in milliseconds
 */
function showStatusMessage(message, isError = false, duration = 3000) {
  const statusMessage = document.getElementById("status-message");
  if (!statusMessage) {
    console.error("Status message element not found");
    console.log(message);
    return;
  }

  // Clear any existing timeout
  if (statusMessage.hideTimeout) {
    clearTimeout(statusMessage.hideTimeout);
  }

  // Set message content and state
  statusMessage.textContent = message;
  statusMessage.classList.toggle("error", isError);

  // Add slide-in animation class and show
  statusMessage.style.display = "block";
  statusMessage.style.transform = "translateX(0)";
  statusMessage.style.opacity = "1";

  // Hide after specified duration
  statusMessage.hideTimeout = setTimeout(() => {
    statusMessage.style.transform = "translateX(50px)";
    statusMessage.style.opacity = "0";

    setTimeout(() => {
      statusMessage.style.display = "none";
    }, 300);
  }, duration);
}

/**
 * Improved debounce function to limit the rate at which a function can fire
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @param {boolean} immediate - Whether to call immediately on the leading edge
 * @returns {Function} Debounced function
 */
function debounce(func, wait, immediate = false) {
  let timeout;

  return function executedFunction(...args) {
    const context = this;

    const later = () => {
      timeout = null;
      if (!immediate) func.apply(context, args);
    };

    const callNow = immediate && !timeout;

    clearTimeout(timeout);
    timeout = setTimeout(later, wait);

    if (callNow) func.apply(context, args);
  };
}

/**
 * Throttle function to limit how often a function can execute
 * @param {Function} func - Function to throttle
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Throttled function
 */
function throttle(func, wait) {
  let timeout = null;
  let lastArgs = null;
  let lastThis = null;
  let lastCallTime = 0;

  return function (...args) {
    const now = Date.now();
    const remaining = wait - (now - lastCallTime);

    if (remaining <= 0) {
      // Immediate execution
      lastCallTime = now;
      return func.apply(this, args);
    } else {
      // Schedule for later
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        lastCallTime = Date.now();
        func.apply(lastThis, lastArgs);
        lastArgs = lastThis = null;
      }, remaining);

      // Store args for later
      lastArgs = args;
      lastThis = this;
    }
  };
}

/**
 * Get query parameters from URL with fallback values
 * @param {Object} defaults - Default values
 * @returns {Object} Object containing query parameters
 */
function getQueryParams(defaults = {}) {
  try {
    const params = new URLSearchParams(window.location.search);
    const result = { ...defaults };

    for (const [key, value] of params.entries()) {
      // Try to parse the value if it looks like a number or boolean
      if (value === "true") {
        result[key] = true;
      } else if (value === "false") {
        result[key] = false;
      } else if (/^-?\d+(\.\d+)?$/.test(value)) {
        result[key] = Number(value);
      } else {
        result[key] = value;
      }
    }

    return result;
  } catch (error) {
    console.error("Error parsing query parameters:", error);
    return defaults;
  }
}

/**
 * Save a user setting to localStorage with error handling
 * @param {string} key - Setting key
 * @param {any} value - Setting value
 * @returns {boolean} Success status
 */
function saveUserSetting(key, value) {
  try {
    localStorage.setItem(`uploader_${key}`, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error("Failed to save setting:", error);

    // Try to clear other items if storage is full
    if (error.name === "QuotaExceededError") {
      try {
        // Try to remove older items
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k.startsWith("uploader_") && k !== `uploader_${key}`) {
            localStorage.removeItem(k);
            break;
          }
        }

        // Try again
        localStorage.setItem(`uploader_${key}`, JSON.stringify(value));
        return true;
      } catch (e) {
        // Give up
        console.error("Failed to save setting after cleanup:", e);
        return false;
      }
    }

    return false;
  }
}

/**
 * Get a user setting from localStorage with better error handling
 * @param {string} key - Setting key
 * @param {any} defaultValue - Default value if setting doesn't exist
 * @returns {any} Setting value
 */
function getUserSetting(key, defaultValue) {
  try {
    const value = localStorage.getItem(`uploader_${key}`);
    if (value === null) return defaultValue;

    try {
      return JSON.parse(value);
    } catch (parseError) {
      console.warn(
        `Failed to parse setting ${key}, returning raw value:`,
        parseError
      );
      return value;
    }
  } catch (error) {
    console.error("Failed to retrieve setting:", error);
    return defaultValue;
  }
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

  // Save theme in a single place
  saveUserSetting("theme", theme);
}

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
    "modern",
    "cyberpunk",
    "forest",
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
      savedTheme = getUserSetting("theme", "orange");
    }
  } catch (error) {
    console.warn("Error loading theme, using default:", error);
    savedTheme = "orange";
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

      // Add a ripple effect
      const ripple = document.createElement("span");
      ripple.classList.add("theme-ripple");
      themeOption.appendChild(ripple);

      // Get position relative to the clicked element
      const rect = themeOption.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Set ripple position and animate
      ripple.style.top = `${y}px`;
      ripple.style.left = `${x}px`;

      // Apply the theme
      setTheme(theme);

      // Remove the ripple after animation
      setTimeout(() => {
        ripple.remove();
      }, 600);
    }
  });

  // Add ripple effect styling
  if (!document.getElementById("theme-ripple-style")) {
    const style = document.createElement("style");
    style.id = "theme-ripple-style";
    style.textContent = `
      .theme-option {
        position: relative;
        overflow: hidden;
      }
      
      .theme-ripple {
        position: absolute;
        background: rgba(255, 255, 255, 0.3);
        border-radius: 50%;
        transform: scale(0);
        animation: theme-ripple 0.6s linear;
        pointer-events: none;
        width: 100px;
        height: 100px;
        margin-top: -50px;
        margin-left: -50px;
      }
      
      @keyframes theme-ripple {
        to {
          transform: scale(4);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);
  }
}

/**
 * Get file extension from filename
 * @param {string} filename - Filename
 * @returns {string} File extension
 */
function getFileExtension(filename) {
  if (!filename) return "";
  return filename.slice(((filename.lastIndexOf(".") - 1) >>> 0) + 2);
}

/**
 * Check if a file is a video file based on extension
 * @param {string} filename - Filename
 * @returns {boolean} True if it's a video file
 */
function isVideoFile(filename) {
  const videoExtensions = [
    "mp4",
    "mkv",
    "avi",
    "mov",
    "wmv",
    "flv",
    "webm",
    "mpeg",
    "mpg",
    "m4v",
  ];
  const ext = getFileExtension(filename).toLowerCase();
  return videoExtensions.includes(ext);
}

/**
 * Check if a file is an audio file based on extension
 * @param {string} filename - Filename
 * @returns {boolean} True if it's an audio file
 */
function isAudioFile(filename) {
  const audioExtensions = ["mp3", "wav", "ogg", "flac", "aac", "m4a", "wma"];
  const ext = getFileExtension(filename).toLowerCase();
  return audioExtensions.includes(ext);
}

/**
 * Check if a file is an image file based on extension
 * @param {string} filename - Filename
 * @returns {boolean} True if it's an image file
 */
function isImageFile(filename) {
  const imageExtensions = [
    "jpg",
    "jpeg",
    "png",
    "gif",
    "bmp",
    "webp",
    "svg",
    "tiff",
  ];
  const ext = getFileExtension(filename).toLowerCase();
  return imageExtensions.includes(ext);
}

/**
 * Get appropriate icon for a file based on its extension
 * @param {string} filename - Filename
 * @returns {string} FontAwesome icon class
 */
function getFileIcon(filename) {
  if (!filename) return "fa-file";

  if (isVideoFile(filename)) return "fa-file-video";
  if (isAudioFile(filename)) return "fa-file-audio";
  if (isImageFile(filename)) return "fa-file-image";

  const extensionIcons = {
    pdf: "fa-file-pdf",
    doc: "fa-file-word",
    docx: "fa-file-word",
    xls: "fa-file-excel",
    xlsx: "fa-file-excel",
    ppt: "fa-file-powerpoint",
    pptx: "fa-file-powerpoint",
    zip: "fa-file-archive",
    rar: "fa-file-archive",
    "7z": "fa-file-archive",
    tar: "fa-file-archive",
    gz: "fa-file-archive",
    txt: "fa-file-alt",
    json: "fa-file-code",
    js: "fa-file-code",
    html: "fa-file-code",
    css: "fa-file-code",
    php: "fa-file-code",
    py: "fa-file-code",
    java: "fa-file-code",
    c: "fa-file-code",
    cpp: "fa-file-code",
    h: "fa-file-code",
    cs: "fa-file-code",
    rb: "fa-file-code",
    go: "fa-file-code",
    rs: "fa-file-code",
  };

  const ext = getFileExtension(filename).toLowerCase();
  return extensionIcons[ext] || "fa-file";
}

/**
 * Truncate text with ellipsis
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
function truncateText(text, maxLength = 25) {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 1) + "…";
}

/**
 * Generate a random ID
 * @param {string} prefix - Prefix for the ID
 * @returns {string} Random ID
 */
function generateId(prefix = "id_") {
  return prefix + Math.random().toString(36).substring(2, 9);
}

/**
 * Format bytes to bits per second
 * @param {number} bytesPerSecond - Bytes per second
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted bits per second
 */
function formatBitRate(bytesPerSecond, decimals = 2) {
  const bitsPerSecond = bytesPerSecond * 8;

  if (bitsPerSecond < 1000) {
    return bitsPerSecond.toFixed(decimals) + " bps";
  } else if (bitsPerSecond < 1000000) {
    return (bitsPerSecond / 1000).toFixed(decimals) + " Kbps";
  } else if (bitsPerSecond < 1000000000) {
    return (bitsPerSecond / 1000000).toFixed(decimals) + " Mbps";
  } else {
    return (bitsPerSecond / 1000000000).toFixed(decimals) + " Gbps";
  }
}

/**
 * Extract domain from URL
 * @param {string} url - URL
 * @returns {string} Domain
 */
function extractDomain(url) {
  if (!url) return "";

  try {
    const a = document.createElement("a");
    a.href = url;
    return a.hostname;
  } catch (e) {
    console.error("Error extracting domain:", e);
    return "";
  }
}

/**
 * Checks if document is in dark mode (OS preference)
 * @returns {boolean} True if in dark mode
 */
function isSystemDarkMode() {
  return (
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );
}

/**
 * Listen for system dark mode changes
 * @param {Function} callback - Callback when preference changes
 */
function listenForColorSchemeChanges(callback) {
  if (window.matchMedia) {
    const colorSchemeQuery = window.matchMedia("(prefers-color-scheme: dark)");

    // Check if modern API is available
    if (colorSchemeQuery.addEventListener) {
      colorSchemeQuery.addEventListener("change", callback);
    } else if (colorSchemeQuery.addListener) {
      // Fallback for older browsers
      colorSchemeQuery.addListener(callback);
    }
  }
}
