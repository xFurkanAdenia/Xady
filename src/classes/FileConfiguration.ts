/**
 * Legacy FileConfiguration export
 * 
 * This file re-exports the new Configuration system for backward compatibility.
 * New code should import from '../configuration' instead.
 * 
 * @deprecated Use YamlConfiguration from '../configuration' instead
 */

export { YamlConfiguration as FileConfiguration } from '../configuration';
