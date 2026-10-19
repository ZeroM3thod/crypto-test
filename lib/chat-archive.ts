import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

export type ArchivedChatMessage = {
  id: string;
  user_id: string | null;
  username: string;
  first_name: string;
  last_name: string;
  message: string;
  is_admin: boolean;
  pinned: boolean;
  deleted: boolean;
  deleted_reason: string | null;
  created_at: string;
  [key: string]: unknown;
};

const archivePath = path.join(process.cwd(), "db", "chat-archive.json");

export async function readChatArchive(): Promise<ArchivedChatMessage[]> {
  try {
    const data = JSON.parse(await readFile(archivePath, "utf8"));
    return Array.isArray(data.messages) ? data.messages : [];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}

export async function writeChatArchive(messages: ArchivedChatMessage[]) {
  await mkdir(path.dirname(archivePath), { recursive: true });
  const temp = `${archivePath}.tmp`;
  await writeFile(temp, `${JSON.stringify({ messages }, null, 2)}\n`, "utf8");
  await rename(temp, archivePath);
}
