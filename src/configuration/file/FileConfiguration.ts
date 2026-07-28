import { MemoryConfiguration } from '../MemoryConfiguration';
import { promises as fs } from 'fs';
import { dirname } from 'path';

/**
 * FileConfiguration - Base class for file-based configurations
 * Mirrors Bukkit's FileConfiguration
 */
export abstract class FileConfiguration extends MemoryConfiguration {
    protected _file: string | null = null;
    protected _isDirty: boolean = false;

    /**
     * Sets the file path for this configuration
     */
    public setFile(file: string): void {
        this._file = file;
    }

    /**
     * Gets the file path
     */
    public getFile(): string | null {
        return this._file;
    }

    /**
     * Loads configuration from file
     */
    public async load(file: string): Promise<void> {
        this._file = file;
        await this.reload();
    }

    /**
     * Loads configuration from current file
     */
    public async reload(): Promise<void> {
        if (!this._file) {
            throw new Error('File is not set');
        }

        try {
            const content = await fs.readFile(this._file, 'utf-8');
            await this.loadFromString(content);
            this._isDirty = false;
        } catch (error: any) {
            if (error.code === 'ENOENT') {
                // File doesn't exist, initialize empty
                this.map.clear();
                this._isDirty = false;
            } else {
                throw new Error(`Failed to load configuration from ${this._file}: ${error.message}`);
            }
        }
    }

    /**
     * Saves configuration to file
     */
    public async save(file?: string): Promise<void> {
        const targetFile = file || this._file;

        if (!targetFile) {
            throw new Error('File is not set');
        }

        // Ensure directory exists
        await fs.mkdir(dirname(targetFile), { recursive: true });

        const content = await this.saveToString();
        await fs.writeFile(targetFile, content, 'utf-8');

        this._file = targetFile;
        this._isDirty = false;
    }

    /**
     * Saves configuration only if dirty
     */
    public async saveIfDirty(): Promise<boolean> {
        if (this._isDirty) {
            await this.save();
            return true;
        }
        return false;
    }

    /**
     * Checks if configuration has unsaved changes
     */
    public isDirty(): boolean {
        return this._isDirty;
    }

    /**
     * Marks configuration as dirty (needs save)
     */
    public markDirty(): void {
        this._isDirty = true;
    }

    /**
     * Clears dirty flag
     */
    public clearDirty(): void {
        this._isDirty = false;
    }

    /**
     * Override set to mark as dirty
     */
    public override set(path: string, value: any): void {
        super.set(path, value);
        this._isDirty = true;
    }

    /**
     * Loads configuration from string content
     */
    public abstract loadFromString(contents: string): Promise<void>;

    /**
     * Saves configuration to string
     */
    public abstract saveToString(): Promise<string>;

    /**
     * Creates a backup of the configuration file
     */
    public async backup(suffix: string = '.backup'): Promise<string> {
        if (!this._file) {
            throw new Error('File is not set');
        }

        const backupFile = this._file + suffix;
        await fs.copyFile(this._file, backupFile);
        return backupFile;
    }

    /**
     * Restores configuration from backup
     */
    public async restore(backupFile: string): Promise<void> {
        if (!this._file) {
            throw new Error('File is not set');
        }

        await fs.copyFile(backupFile, this._file);
        await this.reload();
    }
}
