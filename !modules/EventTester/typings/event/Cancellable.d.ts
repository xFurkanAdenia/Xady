export interface Cancellable {
    isCancelled(): boolean;
    setCancelled(cancel: boolean): void;
}
