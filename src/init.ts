import { spawn } from "child_process";
import { createWriteStream, existsSync, mkdirSync } from "fs";
import { readFile } from "fs/promises";
import { dirname } from "path";
import { get } from "https";
import { Ollama } from "ollama";

const WHISPER_MODEL_URL =
  "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v3-turbo-q5_0.bin";
const DEFAULT_MODEL_PATH = "./models/ggml-large-v3-turbo-q5_0.bin";
const DEFAULT_OLLAMA_MODEL = "gemma3:1b";

async function checkCommandExists(command: string): Promise<boolean> {
  return new Promise((resolve) => {
    const check = spawn("which", [command]);
    check.on("close", (code) => {
      resolve(code === 0);
    });
    check.on("error", () => {
      resolve(false);
    });
  });
}

async function checkWhisperInstallation(): Promise<string | null> {
  const commands = ["whisper", "whisper-cli", "whisper.cpp"];
  for (const cmd of commands) {
    if (await checkCommandExists(cmd)) {
      return cmd;
    }
  }
  return null;
}

async function checkOllamaServer(): Promise<boolean> {
  try {
    const ollama = new Ollama({ host: "http://localhost:11434" });
    await ollama.list();
    return true;
  } catch {
    return false;
  }
}

async function checkSoxInstallation(): Promise<boolean> {
  return checkCommandExists("sox");
}

async function downloadFile(
  url: string,
  destPath: string,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const dir = dirname(destPath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    const file = createWriteStream(destPath);

    const request = (currentUrl: string) => {
      get(currentUrl, (response) => {
        if (
          response.statusCode === 301 ||
          response.statusCode === 302 ||
          response.statusCode === 303 ||
          response.statusCode === 307 ||
          response.statusCode === 308
        ) {
          const redirectUrl = response.headers.location;
          if (redirectUrl) {
            request(redirectUrl);
            return;
          }
        }

        if (response.statusCode !== 200) {
          reject(new Error(`Failed to download: HTTP ${response.statusCode}`));
          return;
        }

        const totalSize = parseInt(response.headers["content-length"] || "0", 10);
        let downloaded = 0;
        let lastPercent = 0;

        response.on("data", (chunk) => {
          downloaded += chunk.length;
          if (totalSize > 0) {
            const percent = Math.floor((downloaded / totalSize) * 100);
            if (percent !== lastPercent && percent % 10 === 0) {
              console.error(`  Downloading... ${percent}%`);
              lastPercent = percent;
            }
          }
        });

        response.pipe(file);

        file.on("finish", () => {
          file.close();
          resolve();
        });
      }).on("error", (err) => {
        reject(err);
      });
    };

    request(url);
  });
}

async function pullOllamaModel(modelName: string): Promise<void> {
  const ollama = new Ollama({ host: "http://localhost:11434" });

  const models = await ollama.list();
  const exists = models.models.some((m) => m.name.startsWith(modelName.split(":")[0]));

  if (exists) {
    console.error(`  Ollama model ${modelName} already exists, skipping...`);
    return;
  }

  console.error(`  Pulling Ollama model ${modelName}...`);
  const stream = await ollama.pull({ model: modelName, stream: true });

  for await (const chunk of stream) {
    if (chunk.status) {
      console.error(`  ${chunk.status}`);
    }
  }
}

export async function init(): Promise<void> {
  console.error("Checking dependencies...");

  console.error("  Checking whisper.cpp...");
  const whisperBin = await checkWhisperInstallation();
  if (!whisperBin) {
    console.error("  ✗ whisper.cpp not found");
    console.error(
      "    Install: git clone https://github.com/ggerganov/whisper.cpp.git && cd whisper.cpp && make",
    );
    process.exit(1);
  }
  console.error(`  ✓ Found: ${whisperBin}`);

  console.error("  Checking ollama server...");
  const ollamaRunning = await checkOllamaServer();
  if (!ollamaRunning) {
    console.error("  ✗ Ollama server not running");
    console.error("    Start: ollama serve");
    process.exit(1);
  }
  console.error("  ✓ Ollama server running");

  console.error("  Checking sox...");
  const soxInstalled = await checkSoxInstallation();
  if (!soxInstalled) {
    console.error("  ✗ sox not found");
    console.error("    Install: brew install sox (macOS) or apt install sox (Linux)");
    process.exit(1);
  }
  console.error("  ✓ Found: sox");

  console.error("\nDownloading Whisper model...");
  if (existsSync(DEFAULT_MODEL_PATH)) {
    console.error(`  Model already exists at ${DEFAULT_MODEL_PATH}, skipping...`);
  } else {
    await downloadFile(WHISPER_MODEL_URL, DEFAULT_MODEL_PATH);
    console.error(`  ✓ Downloaded to ${DEFAULT_MODEL_PATH}`);
  }

  console.error("\nPulling Ollama model...");
  await pullOllamaModel(DEFAULT_OLLAMA_MODEL);
  console.error(`  ✓ Model ${DEFAULT_OLLAMA_MODEL} ready`);

  console.error("\n✓ Initialization complete!");
}
