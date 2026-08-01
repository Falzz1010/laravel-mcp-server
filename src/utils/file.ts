import fs from "node:fs";
import path from "node:path";

export async function findLogFile(laravelPath: string): Promise<string> {
  const logDir = path.join(laravelPath, "storage", "logs");
  if (!fs.existsSync(logDir)) {
    throw new Error(`Log directory does not exist: ${logDir}`);
  }

  // Check default laravel.log
  const defaultLog = path.join(logDir, "laravel.log");
  if (fs.existsSync(defaultLog)) {
    return defaultLog;
  }

  // Find daily log files laravel-YYYY-MM-DD.log
  const files = fs
    .readdirSync(logDir)
    .filter((f) => f.startsWith("laravel") && f.endsWith(".log"))
    .sort()
    .reverse();

  if (files.length > 0) {
    return path.join(logDir, files[0]);
  }

  throw new Error(`No log files found in ${logDir}`);
}

export async function readLastLines(filePath: string, lineCount: number = 100): Promise<string> {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File does not exist: ${filePath}`);
  }

  const limit = Math.min(Math.max(1, lineCount), 500);

  // Read file in chunks from the end for efficiency
  const stat = fs.statSync(filePath);
  const fileSize = stat.size;

  if (fileSize === 0) {
    return "(Log file is empty)";
  }

  const chunkSize = 64 * 1024; // 64KB
  const fd = fs.openSync(filePath, "r");

  let lines: string[] = [];
  let buffer = Buffer.alloc(chunkSize);
  let readPosition = fileSize;

  try {
    let leftover = "";
    while (readPosition > 0 && lines.length <= limit) {
      const bytesToRead = Math.min(chunkSize, readPosition);
      readPosition -= bytesToRead;

      fs.readSync(fd, buffer, 0, bytesToRead, readPosition);
      const chunkStr = buffer.toString("utf-8", 0, bytesToRead) + leftover;

      const chunkLines = chunkStr.split(/\r?\n/);
      leftover = chunkLines.shift() || "";

      lines = [...chunkLines, ...lines];
    }
    if (leftover) {
      lines.unshift(leftover);
    }
  } finally {
    fs.closeSync(fd);
  }

  return lines.slice(-limit).join("\n");
}

export async function readFileContent(filePath: string, maxSizeBytes: number = 1024 * 1024): Promise<string> {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File does not exist: ${filePath}`);
  }

  const stat = fs.statSync(filePath);
  if (stat.size > maxSizeBytes) {
    throw new Error(`File size (${(stat.size / 1024).toFixed(1)}KB) exceeds limit of ${(maxSizeBytes / 1024).toFixed(1)}KB.`);
  }

  return fs.readFileSync(filePath, "utf-8");
}

export async function createBackup(filePath: string, laravelPath: string): Promise<string | null> {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  const backupDir = path.join(laravelPath, ".laravel-mcp-backup");
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const relName = path.relative(laravelPath, filePath).replace(/[\\/]/g, "_");
  const timestamp = Date.now();
  const backupPath = path.join(backupDir, `${relName}.${timestamp}.bak`);

  fs.copyFileSync(filePath, backupPath);
  return backupPath;
}

export async function writeFileContent(
  filePath: string,
  content: string,
  laravelPath: string
): Promise<{ backupPath: string | null }> {
  // Ensure parent directory exists
  const parentDir = path.dirname(filePath);
  if (!fs.existsSync(parentDir)) {
    fs.mkdirSync(parentDir, { recursive: true });
  }

  // Create backup if target file exists
  const backupPath = await createBackup(filePath, laravelPath);

  // Write content
  fs.writeFileSync(filePath, content, "utf-8");

  return { backupPath };
}
