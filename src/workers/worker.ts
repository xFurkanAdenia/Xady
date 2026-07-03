import { parentPort } from "worker_threads";

if (!parentPort) {
    process.exit(1);
}

parentPort.on("message", async (msg) => {
    if (!msg || typeof msg !== "object") return;
    const { type, id, fnString, args, cpuAffinity } = msg;

    if (type === "start") {
        try {
            // Reconstruct the function from string.
            // Note: Closures are NOT preserved. The function must be self-contained!
            const fn = new Function(`return (${fnString})`)();

            // Create progress emitter
            const progress = (data: any) => {
                parentPort?.postMessage({
                    type: "progress",
                    id,
                    progress: data
                });
            };

            // Execute the function
            const result = await fn(...args, progress);

            parentPort?.postMessage({
                type: "success",
                id,
                result
            });
        } catch (error) {
            parentPort?.postMessage({
                type: "failure",
                id,
                error: error instanceof Error ? error.message : String(error)
            });
        }
    }
});
