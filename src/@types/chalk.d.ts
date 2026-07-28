/**
 * Type declarations for chalk v5+
 * Terminal string styling library
 */

declare module 'chalk' {
    interface ChalkInstance {
        // Colors
        readonly black: this;
        readonly red: this;
        readonly green: this;
        readonly yellow: this;
        readonly blue: this;
        readonly magenta: this;
        readonly cyan: this;
        readonly white: this;
        readonly gray: this;
        readonly grey: this;
        
        readonly blackBright: this;
        readonly redBright: this;
        readonly greenBright: this;
        readonly yellowBright: this;
        readonly blueBright: this;
        readonly magentaBright: this;
        readonly cyanBright: this;
        readonly whiteBright: this;
        
        // Background colors
        readonly bgBlack: this;
        readonly bgRed: this;
        readonly bgGreen: this;
        readonly bgYellow: this;
        readonly bgBlue: this;
        readonly bgMagenta: this;
        readonly bgCyan: this;
        readonly bgWhite: this;
        
        readonly bgBlackBright: this;
        readonly bgRedBright: this;
        readonly bgGreenBright: this;
        readonly bgYellowBright: this;
        readonly bgBlueBright: this;
        readonly bgMagentaBright: this;
        readonly bgCyanBright: this;
        readonly bgWhiteBright: this;
        
        // Modifiers
        readonly reset: this;
        readonly bold: this;
        readonly dim: this;
        readonly italic: this;
        readonly underline: this;
        readonly overline: this;
        readonly inverse: this;
        readonly hidden: this;
        readonly strikethrough: this;
        
        readonly visible: this;
        
        // Methods
        (text: string | number): string;
        
        hex(color: string): this;
        rgb(r: number, g: number, b: number): this;
        bgHex(color: string): this;
        bgRgb(r: number, g: number, b: number): this;
        
        readonly level: 0 | 1 | 2 | 3;
    }
    
    const chalk: ChalkInstance;
    export default chalk;
}
