import Dexie, { type Table } from "dexie";

export interface OfflinePost {
  id?: number;
  postId: string;
  action: "update" | "delete" | "publish";
  payload: any;
  timestamp: number;
}

class EmberOfflineDB extends Dexie {
  offlineQueue!: Table<OfflinePost>;
  constructor() {
    super("ember-offline");
    this.version(1).stores({ offlineQueue: "++id, postId, timestamp" });
  }
}

export const offlineDB = new EmberOfflineDB();

export async function addToOfflineQueue(entry: Omit<OfflinePost, "timestamp">) {
  await offlineDB.offlineQueue.add({ ...entry, timestamp: Date.now() });
}

export async function drainOfflineQueue() {
  const items = await offlineDB.offlineQueue.orderBy("timestamp").toArray();
  for (const item of items) {
    try {
      let method = "PUT";
      let url = `/api/v1/calendar/posts/${item.postId}`;
      if (item.action === "delete") {
        method = "DELETE";
        url = `/api/v1/calendar/posts/${item.postId}`;
      } else if (item.action === "publish") {
        method = "POST";
        url = `/api/v1/publish/${item.postId}`;
      }
      await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item.payload),
      });
      await offlineDB.offlineQueue.delete(item.id!);
    } catch { break; }
  }
}

if (typeof window !== "undefined") {
  window.addEventListener("online", drainOfflineQueue);
}
