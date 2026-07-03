export default class Response {
    success: boolean;
    message: string;
    constructor(success: boolean, message: string);
    toJson(): {
        success: boolean;
        message: string;
    };
    toString(): string;
    valueOf(): {
        success: boolean;
        message: string;
    };
}
