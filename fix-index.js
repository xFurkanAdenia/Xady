const fs = require('fs');

let content = fs.readFileSync('src/index.ts', 'utf8');

// remove SettingsManager and XadyConfig definition
const typeXadyConfigIndex = content.indexOf('type XadyConfig = {');
const settingsProxyIndex = content.indexOf('(globalThis.Xady as any).settings = settingsProxy;');

if (typeXadyConfigIndex !== -1 && settingsProxyIndex !== -1) {
    const endOfSettingsProxy = settingsProxyIndex + '(globalThis.Xady as any).settings = settingsProxy;'.length;
    
    // Replace with initializing from imported SettingsManager
    const replacement = `const settingsManager = new SettingsManager(AppDataManager.getConfigFile());
const settingsProxy = createSettingsProxy(settingsManager.getApi());
(globalThis.Xady as any).settings = settingsProxy;
`;
    content = content.substring(0, typeXadyConfigIndex) + replacement + content.substring(endOfSettingsProxy);
}

// remove extractCompletionText to end of file, wait, no
// find function extractCompletionText
const extractCompletionTextIndex = content.indexOf('function extractCompletionText');
if (extractCompletionTextIndex !== -1) {
    // we should replace it until the end of the file except the ChatCommandListener
    const chatCommandListenerIndex = content.indexOf('// Built-in chat command listener');
    if (chatCommandListenerIndex !== -1) {
        content = content.substring(0, extractCompletionTextIndex) + '\n' + content.substring(chatCommandListenerIndex);
    }
}

// also remove setupConsoleUi
content = content.replace(/setupConsoleUi\(rl\);\n/, '');

// wait, rl was defined somewhere: `let rl: readline.Interface;`
content = content.replace(/let rl: readline\.Interface;\n/, '');

// and `rl = readline.createInterface...` this block was inside the removed section or not?
// wait, rl = readline... was after `let rl: readline.Interface;` but wait, in the new `CliManager` we pass `client` using `setClient` and we should do that.
// Let's just find where `rl` is used and replace with `CliManager` logic.

fs.writeFileSync('src/index.ts', content);
