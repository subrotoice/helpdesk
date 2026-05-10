export { CLASSIFY_QUEUE } from "./classify-worker";
import { registerClassifyWorker } from "./classify-worker";
import { registerResolveWorker } from "./resolve-worker";

export async function registerWorkers() {
  await registerClassifyWorker();
  await registerResolveWorker();
}
