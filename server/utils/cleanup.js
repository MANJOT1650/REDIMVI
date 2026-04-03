const fs = require('fs');
const path = require('path');

/**
 * Periodically cleans up files in the uploads directory that are older than a certain age.
 * @param {string} uploadsDir - Absolute path to the uploads directory.
 * @param {number} maxAgeMs - Maximum age of files in milliseconds (default: 30 mins).
 * @param {number} intervalMs - How often to run the cleanup in milliseconds (default: 1 hour).
 */
const startCleanupJob = (uploadsDir, maxAgeMs = 30 * 60 * 1000, intervalMs = 60 * 60 * 1000) => {
    console.log(`[Cleanup Job] Initialized. Monitoring: ${uploadsDir}`);

    const cleanup = () => {
        fs.readdir(uploadsDir, (err, files) => {
            if (err) {
                console.error('[Cleanup Job] Error reading directory:', err);
                return;
            }

            const now = Date.now();
            let deletedCount = 0;

            files.forEach(file => {
                // Never delete .gitkeep
                if (file === '.gitkeep') return;

                const filePath = path.join(uploadsDir, file);

                fs.stat(filePath, (statErr, stats) => {
                    if (statErr) return;

                    if (stats.isFile() && (now - stats.mtimeMs) > maxAgeMs) {
                        fs.unlink(filePath, (unlinkErr) => {
                            if (!unlinkErr) {
                                deletedCount++;
                            }
                        });
                    }
                });
            });
        });
    };

    // Run once on startup
    cleanup();

    // Set interval to run periodically
    setInterval(cleanup, intervalMs);
};

module.exports = { startCleanupJob };
