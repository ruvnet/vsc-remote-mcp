"use strict";
/**
 * Docker log parser utilities
 * Provides functions for parsing and formatting Docker logs
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DockerLogParser = void 0;
/**
 * Docker log parser class
 */
class DockerLogParser {
    /**
     * Parse Docker logs
     * @param logs Raw logs
     * @param pattern Optional filter pattern
     * @returns Parsed log entries
     */
    parseDockerLogs(logs, pattern) {
        if (!logs) {
            return [];
        }
        // Split logs by line
        const lines = logs.split('\n').filter(line => line.trim() !== '');
        // Parse each line
        const entries = [];
        for (const line of lines) {
            const entry = this.parseLogLine(line);
            // Apply pattern filter if provided
            if (pattern && !this.matchesPattern(entry, pattern)) {
                continue;
            }
            entries.push(entry);
        }
        return entries;
    }
    /**
     * Format instance logs
     * @param instanceId Instance ID
     * @param entries Log entries
     * @param hasMore Whether there are more logs
     * @param nextToken Next token for pagination
     * @returns Formatted instance logs
     */
    formatInstanceLogs(instanceId, entries, hasMore = false, nextToken) {
        return {
            instanceId,
            entries,
            hasMore,
            nextToken
        };
    }
    /**
     * Parse a log line
     * @param line Log line
     * @returns Parsed log entry
     */
    parseLogLine(line) {
        // Try to extract timestamp
        let timestamp = new Date();
        let message = line;
        let level = 'INFO';
        let source = 'container';
        // Try to match timestamp pattern: YYYY-MM-DD HH:MM:SS
        const timestampMatch = line.match(/^(\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?)/);
        if (timestampMatch) {
            timestamp = new Date(timestampMatch[1]);
            message = line.substring(timestampMatch[0].length).trim();
        }
        // Try to extract log level
        const levelMatch = message.match(/^(?:\[([A-Z]+)\]|\b(ERROR|WARN|INFO|DEBUG)\b)/i);
        if (levelMatch) {
            level = (levelMatch[1] || levelMatch[2]).toUpperCase();
            message = message.substring(levelMatch[0].length).trim();
        }
        // Try to extract source
        const sourceMatch = message.match(/^\[([^\]]+)\]/);
        if (sourceMatch) {
            source = sourceMatch[1];
            message = message.substring(sourceMatch[0].length).trim();
        }
        return {
            timestamp,
            level,
            message,
            source
        };
    }
    /**
     * Check if a log entry matches a pattern
     * @param entry Log entry
     * @param pattern Pattern to match
     * @returns True if entry matches pattern
     */
    matchesPattern(entry, pattern) {
        const regex = new RegExp(pattern, 'i');
        return (regex.test(entry.message) ||
            regex.test(entry.level) ||
            regex.test(entry.source));
    }
}
exports.DockerLogParser = DockerLogParser;
//# sourceMappingURL=log-parser.js.map