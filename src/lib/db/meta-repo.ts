import type {
  MetaRecord,
  PinLockMeta,
  TreeAtmosphere,
  VaultDocument,
} from "@/types/models";
import { db, type GhiChuDatabase } from "./database";

export type MetaValueMap = {
  pinLock: PinLockMeta;
  vaultSnapshot: VaultDocument;
  deviceLinked: boolean;
  lastPurgeAt: number;
  preferredAtmosphere: TreeAtmosphere;
};

export async function getMetaValue(
  key: "pinLock",
  database?: GhiChuDatabase,
): Promise<PinLockMeta | undefined>;
export async function getMetaValue(
  key: "vaultSnapshot",
  database?: GhiChuDatabase,
): Promise<VaultDocument | undefined>;
export async function getMetaValue(
  key: "deviceLinked",
  database?: GhiChuDatabase,
): Promise<boolean | undefined>;
export async function getMetaValue(
  key: "lastPurgeAt",
  database?: GhiChuDatabase,
): Promise<number | undefined>;
export async function getMetaValue(
  key: "preferredAtmosphere",
  database?: GhiChuDatabase,
): Promise<TreeAtmosphere | undefined>;
export async function getMetaValue(
  key: keyof MetaValueMap,
  database: GhiChuDatabase = db,
): Promise<MetaValueMap[keyof MetaValueMap] | undefined> {
  const entry = await database.meta.get(key);
  return entry?.value;
}

export async function setMetaValue<K extends keyof MetaValueMap>(
  key: K,
  value: MetaValueMap[K],
  database: GhiChuDatabase = db,
): Promise<void> {
  await database.meta.put({ key, value } as MetaRecord);
}

export async function deleteMetaKey(
  key: keyof MetaValueMap,
  database: GhiChuDatabase = db,
): Promise<void> {
  await database.meta.delete(key);
}
