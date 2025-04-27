/**
 * Docker log parser utilities
 * Provides functions for parsing and formatting Docker logs
 */
import { InstanceLogs } from '../core/instance.interface';
/**
 * Log entry structure
 */
export interface LogEntry {
    /**
     * Timestamp
     */
    timestamp: Date;
    /**
     * Log level
     */
    level: string;
    /**
     * Log message
     */
    message: string;
    /**
     * Source
     */
    source: string;
}
/**
 * Docker log parser class
 */
export declare class DockerLogParser {
    /**
     * Parse Docker logs
     * @param logs Raw logs
     * @param pattern Optional filter pattern
     * @returns Parsed log entries
     */
    parseDockerLogs(logs: string, pattern?: string): LogEntry[];
    /**
     * Format instance logs
     * @param instanceId Instance ID
     * @param entries Log entries
     * @param hasMore Whether there are more logs
     * @param nextToken Next token for pagination
     * @returns Formatted instance logs
     */
    formatInstanceLogs(instanceId: string, entries: LogEntry[], hasMore?: boolean, nextToken?: string): InstanceLogs;
    /**
     * Parse a log line
     * @param line Log line
     * @returns Parsed log entry
     */
    private parseLogLine;
    /**
     * Check if a log entry matches a pattern
     * @param entry Log entry
     * @param pattern Pattern to match
     * @returns True if entry matches pattern
     */
    private matchesPattern;
}
