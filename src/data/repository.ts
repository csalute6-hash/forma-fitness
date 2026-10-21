import { withWriteLock } from "./write-lock";
import seed from "../../fixtures/seed.json";
import {
  type Data,
  parseBackup,
  validate,
  clearPersonal,
} from "../domain/model";
export const KEY = "forma.app.v1";
export type StorageCode =
  | "READ_FAILED"
  | "CORRUPT_DATA"
  | "UNSUPPORTED_VERSION"
  | "QUOTA_EXCEEDED"
  | "CONFLICT"
  | "VALIDATION_FAILED"
  | "WRITE_FAILED";
export class StorageFailure extends Error {
  constructor(
    public code: StorageCode,
    message: string,
  ) {
    super(message);
  }
}
const conflict = () =>
  new StorageFailure(
    "CONFLICT",
    "Data changed in another tab. Reload to continue.",
  );
const browserStorage: Storage = {
  getItem: (key) => window.localStorage.getItem(key),
  setItem: (key, value) => window.localStorage.setItem(key, value),
  removeItem: (key) => window.localStorage.removeItem(key),
  clear: () => window.localStorage.clear(),
  key: (index) => window.localStorage.key(index),
  get length() {
    return window.localStorage.length;
  },
};
export class Repository {
  data: Data | null = null;
  error = "";
  private serialized: string | null = null;
  private recoveryRaw: string | null | undefined;
  errorCode: StorageCode | null = null;
  conflict = false;
  listeners = new Set<() => void>();
  constructor(private storage: Storage = browserStorage) {}
  subscribe = (f: () => void) => {
    this.listeners.add(f);
    return () => {
      this.listeners.delete(f);
    };
  };
  emit() {
    this.listeners.forEach((f) => f());
  }
  async load() {
    this.conflict = false;
    this.recoveryRaw = undefined;
    let stage: "read" | "parse" | "write" = "read";
    try {
      let raw = this.storage.getItem(KEY);
      this.recoveryRaw = raw;
      if (raw === null) {
        stage = "write";
        await withWriteLock(() => {
          // Re-read inside exclusion: another tab may have initialized meanwhile.
          stage = "read";
          raw = this.storage.getItem(KEY);
          this.recoveryRaw = raw;
          stage = "parse";
          const data =
            raw === null ? validate(structuredClone(seed)) : parseBackup(raw);
          if (raw === null) {
            stage = "write";
            raw = JSON.stringify(data);
            this.storage.setItem(KEY, raw);
          }
          this.data = data;
        });
      } else {
        stage = "parse";
        this.data = parseBackup(raw);
      }
      this.serialized = raw;
      this.conflict = false;
      this.error = "";
      this.errorCode = null;
    } catch (e) {
      this.errorCode =
        stage === "read"
          ? "READ_FAILED"
          : stage === "write"
            ? "WRITE_FAILED"
            : e instanceof Error && e.message.includes("unsupported")
              ? "UNSUPPORTED_VERSION"
              : "CORRUPT_DATA";
      this.error =
        stage === "write"
          ? "We couldn't initialize local storage. Enable browser storage and try again."
          : e instanceof Error && e.message.includes("unsupported")
            ? e.message
            : "We couldn't read your saved data. Download a backup before resetting.";
      this.data = null;
    }
    this.emit();
  }
  raw() {
    return this.storage.getItem(KEY);
  }
  async commit(mutate: (d: Data) => void) {
    if (this.conflict) throw conflict();
    if (!this.data)
      throw new StorageFailure("READ_FAILED", "Saved data is unavailable.");
    const revision = this.data.revision;
    return withWriteLock(() => {
      let raw: string | null;
      try {
        raw = this.storage.getItem(KEY);
      } catch {
        throw new StorageFailure(
          "READ_FAILED",
          "We couldn't read your saved data. Export a backup and try again.",
        );
      }
      const current =
        raw === null
          ? null
          : raw === this.serialized
            ? this.data
            : parseBackup(raw);
      if (!current || current.revision !== revision) {
        this.conflict = true;
        this.emit();
        throw conflict();
      }
      const next = structuredClone(current);
      mutate(next);
      next.revision = current.revision + 1;
      if (next.plans.length > 50)
        throw new StorageFailure(
          "VALIDATION_FAILED",
          "50 plan limit reached. Export a backup, then delete a custom plan.",
        );
      if (next.bodyWeights.length > 730)
        throw new StorageFailure(
          "VALIDATION_FAILED",
          "730 weight entry limit reached. Export a backup, then delete an old entry.",
        );
      let validated: Data;
      try {
        validated = validate(next);
      } catch {
        throw new StorageFailure(
          "VALIDATION_FAILED",
          "Some values are invalid. Check your inputs, ranges and references.",
        );
      }
      const serialized = JSON.stringify(validated);
      if (new TextEncoder().encode(serialized).length > 2 * 1024 * 1024)
        throw new StorageFailure(
          "VALIDATION_FAILED",
          "The local dataset has reached the 2 MiB backup limit. Export a backup and delete older records before saving more.",
        );
      try {
        this.storage.setItem(KEY, serialized);
      } catch (e) {
        throw new StorageFailure(
          e instanceof DOMException && e.name === "QuotaExceededError"
            ? "QUOTA_EXCEEDED"
            : "WRITE_FAILED",
          "We couldn't save your changes. Your previous data is safe. Retry or export your data.",
        );
      }
      this.serialized = serialized;
      this.data = validated;
      this.emit();
    });
  }
  async resetCorrupt() {
    if (this.conflict) throw conflict();
    const expectedRaw = this.recoveryRaw;
    if (expectedRaw === undefined)
      throw new StorageFailure(
        "READ_FAILED",
        "Try again before resetting so the current data can be checked.",
      );
    await withWriteLock(() => {
      if (this.storage.getItem(KEY) !== expectedRaw)
        throw Error("Data changed in another tab. Reload to continue.");
      const next = validate(structuredClone(seed));
      clearPersonal(next);
      this.storage.setItem(KEY, JSON.stringify(validate(next)));
      this.data = next;
      this.error = "";
      this.conflict = false;
      this.emit();
    });
  }
  watch() {
    const f = (e: StorageEvent) => {
      if (e.key === KEY) {
        try {
          if (
            !e.newValue ||
            parseBackup(e.newValue).revision > (this.data?.revision ?? -1)
          ) {
            this.conflict = true;
            this.emit();
          }
        } catch {
          this.conflict = true;
          this.emit();
        }
      }
    };
    window.addEventListener("storage", f);
    return () => window.removeEventListener("storage", f);
  }
  exportBackup() {
    if (!this.data) throw Error("Saved data is unavailable.");
    return JSON.stringify(this.data);
  }
}
export const repository = new Repository();
