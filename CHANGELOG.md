# Changelog

## [5.0.0] - 2025-12-17

### Added

- **Directory Column**: Added separate Directory column to all upload tables (Active Uploads, Queue, and History) in both dashboard and full pages
- **Auto-save Settings**: Implemented automatic settings save with 1-second debounce and visual feedback indicator
- **Enhanced Toggle Styling**: Added bordered boxes around toggle settings groups for better visual separation
- **Time Format Conversion**: Implemented proper DATETIME to Unix timestamp conversion in queue API for accurate time display

### Changed

- **Settings Page Layout**: Moved save button from bottom to top-right corner for better accessibility
- **Table Structure**: Standardized all tables to show consistent columns across dashboard and full pages
  - Active Uploads: Now shows Filename, Folder, Directory, Key, Progress, Filesize, Time Left, Speed (8 columns)
  - Queue: Now shows #, Filename, Folder, Directory, Filesize, Added (6 columns)
  - History: Now shows Filename, Folder, Directory, Key, Filesize, Time spent, Uploaded (7 columns)
- **Directory Display**: Directory column now shows only subdirectory path without folder prefix
- **Card Spacing**: Increased spacing between dashboard cards for better visual separation
- **Dashboard Card Values**: Reduced font size of colored values from 1.75rem to 1.5rem for better proportion
- **Speed Display**: Removed tachometer icon from speed column in Active Uploads full page table

### Fixed

- **Database Errors**: Fixed 500 Internal Server errors by adding busyTimeout(5000) and proper error handling to all database operations
- **Dashboard Data Display**: Corrected API property name mapping (filename→file_name, percentage→upload_percentage, etc.)
- **Upload Rate Issues**:
  - Fixed flickering transfer rate by removing redundant updates
  - Fixed Transfer Rate card not displaying data by correcting data flow from handleInProgressJobs
- **Queue Time Display**: Fixed "just now" timestamp issue by converting SQLite DATETIME strings to Unix timestamps
- **Table Formatting**:
  - Fixed filesize display in queue tables to show formatted values (e.g., "3.32 GB" instead of raw bytes)
  - Fixed colspan values in empty state messages for proper centering
- **Toggle Settings**: Added proper spacing and visual separation between toggle groups and other form fields

### Technical Improvements

- Enhanced database concurrency handling with SQLite busyTimeout
- Improved error handling across all PHP API endpoints
- Optimized JavaScript update intervals to prevent redundant operations
- Standardized table column structure across dashboard and full pages
- Added proper data formatting utilities for filesizes and timestamps

---

## Previous Versions

See [GitHub Releases](https://github.com/cyb3rgh05t/docker-uploader/releases) for older version history.
