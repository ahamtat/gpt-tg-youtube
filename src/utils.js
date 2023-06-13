import { unlink } from "fs/promises";

export async function removeFile(path) {
    try {
        await unlink(path);
    } catch (error) {
        console.error("error while removing file", error.message);
    }
}