export function isJson(obj: unknown) {
    try {
        JSON.parse(obj as string);
        return true;
    } 
    catch {
        return false;
    }
}