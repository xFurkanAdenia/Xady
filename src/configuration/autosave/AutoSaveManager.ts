import { FileConfiguration } from '../file/FileConfiguration';

/**
 * AutoSaveManager - Manages automatic saving with debouncing
 */
export class AutoSaveManager {
    private readonly config: FileConfiguration;
    private saveTimer: NodeJS.Timeout | null = null;
    private readonly debounceDelay: number;
    private enabled: boolean = false;
    private pendingChanges: number = 0;

    constructor(config: FileConfiguration, debounceDelay: number = 1000) {
        this.config = config;
        this.debounceDelay = debounceDelay;
    }

    /**
     * Enables auto-save
     */
    public enable(): void {
        this.enabled = true;
    }

    /**
     * Disables auto-save
     */
    public disable(): void {
        this.enabled = false;
        this.cancelPending();
    }

    /**
     * Checks if auto-save is enabled
     */
    public isEnabled(): boolean {
        return this.enabled;
    }

    /**
     * Schedules a save (debounced)
     */
    public scheduleSave(): void {
        if (!this.enabled) {
            return;
        }

        this.pendingChanges++;

        if (this.saveTimer) {
            clearTimeout(this.saveTimer);
        }

        this.saveTimer = setTimeout(async () => {
            await this.executeSave();
        }, this.debounceDelay);
    }

    /**
     * Forces immediate save
     */
    public async forceSave(): Promise<void> {
        this.cancelPending();
        await this.executeSave();
    }

    /**
     * Cancels pending save
     */
    public cancelPending(): void {
        if (this.saveTimer) {
            clearTimeout(this.saveTimer);
            this.saveTimer = null;
        }
        this.pendingChanges = 0;
    }

    /**
     * Gets number of pending changes
     */
    public getPendingChanges(): number {
        return this.pendingChanges;
    }

    /**
     * Checks if save is pending
     */
    public hasPending(): boolean {
        return this.saveTimer !== null;
    }

    private async executeSave(): Promise<void> {
        this.saveTimer = null;
        const changes = this.pendingChanges;
        this.pendingChanges = 0;

        try {
            await this.config.save();
        } catch (error) {
            // Re-schedule on error
            this.pendingChanges = changes;
            throw error;
        }
    }

    /**
     * Cleanup
     */
    public dispose(): void {
        this.disable();
    }
}
