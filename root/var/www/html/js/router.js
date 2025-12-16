/**
 * SPA Router
 * Handles client-side routing without page reloads
 */

class Router {
  constructor() {
    this.routes = {};
    this.currentRoute = null;
    this.defaultRoute = "dashboard";

    // Initialize router on page load
    window.addEventListener("load", () => this.navigate(this.getRoute()));
    window.addEventListener("hashchange", () => this.navigate(this.getRoute()));
  }

  /**
   * Register a route with its view loader function
   * @param {string} path - Route path (e.g., 'dashboard', 'queue')
   * @param {function} viewLoader - Function that returns the view HTML
   */
  register(path, viewLoader) {
    this.routes[path] = viewLoader;
  }

  /**
   * Get current route from URL hash
   * @returns {string} Current route path
   */
  getRoute() {
    const hash = window.location.hash.slice(1) || this.defaultRoute;
    return hash.split("?")[0]; // Remove query params if any
  }

  /**
   * Navigate to a route
   * @param {string} path - Route path to navigate to
   */
  async navigate(path) {
    // Check if route exists
    if (!this.routes[path]) {
      console.warn(`Route '${path}' not found, redirecting to default`);
      path = this.defaultRoute;
    }

    // Update hash without triggering hashchange if already on this route
    if (window.location.hash.slice(1) !== path) {
      window.location.hash = path;
    }

    // Update current route
    this.currentRoute = path;

    // Update active nav item
    this.updateActiveNav(path);

    // Load the view
    try {
      const view = await this.routes[path]();
      this.render(view);
    } catch (error) {
      console.error("Error loading view:", error);
      this.render({
        html: `
          <div class="content-container">
            <div class="card">
              <div class="card-body">
                <div class="empty-state">
                  <i class="fas fa-exclamation-triangle fa-3x"></i>
                  <h3>Error Loading Page</h3>
                  <p>${error.message}</p>
                </div>
              </div>
            </div>
          </div>
        `,
        title: "Error",
        init: null,
      });
    }
  }

  /**
   * Render view content
   * @param {object} view - View object with html, title, and init function
   */
  render(view) {
    const mainContent = document.getElementById("main-content");
    const pageTitle = document.getElementById("page-title");

    if (mainContent) {
      // Clean up any existing intervals before loading new view
      this.cleanup();

      mainContent.innerHTML = view.html;
    }

    if (pageTitle && view.title) {
      pageTitle.innerHTML = view.title;
    }

    // Update document title
    document.title = view.documentTitle || `${view.title} - Uploader Dashboard`;

    // Scroll to top
    if (mainContent) {
      mainContent.scrollTop = 0;
    }

    // Run view-specific initialization
    if (view.init && typeof view.init === "function") {
      // Wait for DOM to be ready
      setTimeout(() => view.init(), 0);
    }
  }

  /**
   * Cleanup function to clear all intervals before loading new view
   */
  cleanup() {
    // Clear all known intervals
    if (window.dashboardRefreshInterval) {
      clearInterval(window.dashboardRefreshInterval);
      window.dashboardRefreshInterval = null;
    }
    if (window.queueRefreshInterval) {
      clearInterval(window.queueRefreshInterval);
      window.queueRefreshInterval = null;
    }
    if (window.inProgressRefreshInterval) {
      clearInterval(window.inProgressRefreshInterval);
      window.inProgressRefreshInterval = null;
    }
    if (window.completedRefreshInterval) {
      clearInterval(window.completedRefreshInterval);
      window.completedRefreshInterval = null;
    }
  }

  /**
   * Update active navigation item
   * @param {string} path - Current route path
   */
  updateActiveNav(path) {
    // Remove active class from all nav items
    document.querySelectorAll(".sidebar-menu-item").forEach((item) => {
      item.classList.remove("active");
    });

    // Add active class to current nav item
    const navLink = document.querySelector(
      `.sidebar-menu-link[href="#${path}"]`
    );
    if (navLink) {
      navLink.closest(".sidebar-menu-item").classList.add("active");
    }
  }

  /**
   * Navigate to a route programmatically
   * @param {string} path - Route path
   */
  go(path) {
    window.location.hash = path;
  }

  /**
   * Go back in history
   */
  back() {
    window.history.back();
  }
}

// Create global router instance
const router = new Router();
