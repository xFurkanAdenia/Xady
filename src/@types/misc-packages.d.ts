/**
 * Type declarations for miscellaneous packages
 */

declare module 'socks-proxy-agent' {
    import { Agent } from 'http';
    import { URL } from 'url';
    
    interface SocksProxyAgentOptions {
        host?: string;
        port?: number;
        username?: string;
        password?: string;
        tls?: boolean;
        timeout?: number;
    }
    
    class SocksProxyAgent extends Agent {
        constructor(uri: string | URL, options?: SocksProxyAgentOptions);
        constructor(options: SocksProxyAgentOptions & { host: string; port: number });
    }
    
    export { SocksProxyAgent };
    export default SocksProxyAgent;
}

declare module 'reflect-metadata' {
    // Reflect Metadata API
    namespace Reflect {
        function decorate(
            decorators: ClassDecorator[],
            target: Function
        ): Function;
        function decorate(
            decorators: (PropertyDecorator | MethodDecorator)[],
            target: object,
            propertyKey: string | symbol,
            attributes?: PropertyDescriptor | null
        ): PropertyDescriptor | undefined;
        
        function metadata(
            metadataKey: unknown,
            metadataValue: unknown
        ): {
            (target: Function): void;
            (target: object, propertyKey: string | symbol): void;
        };
        
        function defineMetadata(
            metadataKey: unknown,
            metadataValue: unknown,
            target: object
        ): void;
        function defineMetadata(
            metadataKey: unknown,
            metadataValue: unknown,
            target: object,
            propertyKey: string | symbol
        ): void;
        
        function hasMetadata(metadataKey: unknown, target: object): boolean;
        function hasMetadata(
            metadataKey: unknown,
            target: object,
            propertyKey: string | symbol
        ): boolean;
        
        function hasOwnMetadata(metadataKey: unknown, target: object): boolean;
        function hasOwnMetadata(
            metadataKey: unknown,
            target: object,
            propertyKey: string | symbol
        ): boolean;
        
        function getMetadata(metadataKey: unknown, target: object): unknown;
        function getMetadata(
            metadataKey: unknown,
            target: object,
            propertyKey: string | symbol
        ): unknown;
        
        function getOwnMetadata(metadataKey: unknown, target: object): unknown;
        function getOwnMetadata(
            metadataKey: unknown,
            target: object,
            propertyKey: string | symbol
        ): unknown;
        
        function getMetadataKeys(target: object): unknown[];
        function getMetadataKeys(target: object, propertyKey: string | symbol): unknown[];
        
        function getOwnMetadataKeys(target: object): unknown[];
        function getOwnMetadataKeys(target: object, propertyKey: string | symbol): unknown[];
        
        function deleteMetadata(metadataKey: unknown, target: object): boolean;
        function deleteMetadata(
            metadataKey: unknown,
            target: object,
            propertyKey: string | symbol
        ): boolean;
    }
    
    export = Reflect;
}

declare module 'axios' {
    export interface AxiosRequestConfig<D = unknown> {
        url?: string;
        method?: 'get' | 'GET' | 'delete' | 'DELETE' | 'head' | 'HEAD' | 'options' | 'OPTIONS' | 'post' | 'POST' | 'put' | 'PUT' | 'patch' | 'PATCH';
        baseURL?: string;
        headers?: Record<string, string>;
        params?: Record<string, unknown>;
        data?: D;
        timeout?: number;
        timeoutErrorMessage?: string;
        withCredentials?: boolean;
        auth?: { username: string; password: string };
        responseType?: 'arraybuffer' | 'blob' | 'document' | 'json' | 'text' | 'stream';
        responseEncoding?: string;
        maxRedirects?: number;
        maxContentLength?: number;
        maxBodyLength?: number;
        validateStatus?: (status: number) => boolean;
        proxy?: false | {
            host: string;
            port: number;
            auth?: { username: string; password: string };
            protocol?: string;
        };
        decompress?: boolean;
        signal?: AbortSignal;
    }
    
    export interface AxiosResponse<T = unknown, D = unknown> {
        data: T;
        status: number;
        statusText: string;
        headers: Record<string, string>;
        config: AxiosRequestConfig<D>;
        request?: unknown;
    }
    
    export interface AxiosError<T = unknown, D = unknown> extends Error {
        config: AxiosRequestConfig<D>;
        code?: string;
        request?: unknown;
        response?: AxiosResponse<T, D>;
        isAxiosError: true;
        toJSON(): object;
    }
    
    export interface AxiosInstance {
        <T = unknown, D = unknown>(config: AxiosRequestConfig<D>): Promise<AxiosResponse<T, D>>;
        <T = unknown, D = unknown>(url: string, config?: AxiosRequestConfig<D>): Promise<AxiosResponse<T, D>>;
        
        defaults: AxiosRequestConfig;
        
        request<T = unknown, D = unknown>(config: AxiosRequestConfig<D>): Promise<AxiosResponse<T, D>>;
        get<T = unknown, D = unknown>(url: string, config?: AxiosRequestConfig<D>): Promise<AxiosResponse<T, D>>;
        delete<T = unknown, D = unknown>(url: string, config?: AxiosRequestConfig<D>): Promise<AxiosResponse<T, D>>;
        head<T = unknown, D = unknown>(url: string, config?: AxiosRequestConfig<D>): Promise<AxiosResponse<T, D>>;
        options<T = unknown, D = unknown>(url: string, config?: AxiosRequestConfig<D>): Promise<AxiosResponse<T, D>>;
        post<T = unknown, D = unknown>(url: string, data?: D, config?: AxiosRequestConfig<D>): Promise<AxiosResponse<T, D>>;
        put<T = unknown, D = unknown>(url: string, data?: D, config?: AxiosRequestConfig<D>): Promise<AxiosResponse<T, D>>;
        patch<T = unknown, D = unknown>(url: string, data?: D, config?: AxiosRequestConfig<D>): Promise<AxiosResponse<T, D>>;
    }
    
    export interface AxiosStatic extends AxiosInstance {
        create(config?: AxiosRequestConfig): AxiosInstance;
        isAxiosError(payload: unknown): payload is AxiosError;
        CancelToken: unknown;
        Cancel: unknown;
        isCancel(value: unknown): boolean;
    }
    
    const axios: AxiosStatic;
    export default axios;
}
