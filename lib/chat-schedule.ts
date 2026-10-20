import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

export type ScheduledChatMessage = { id: string; username: string; message: string; scheduledAt: string };
const file = path.join(process.cwd(), "db", "chat-schedule.json");

export async function readSchedule(): Promise<ScheduledChatMessage[]> {
  try {
    const parsed = JSON.parse(await readFile(file, "utf8"));
    return Array.isArray(parsed.messages) ? parsed.messages : [];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}

export async function writeSchedule(messages: ScheduledChatMessage[]) {
  await mkdir(path.dirname(file), { recursive: true });
  const temp = `${file}.tmp`;
  await writeFile(temp, `${JSON.stringify({ messages }, null, 2)}\n`, "utf8");
  await rename(temp, file);
}
