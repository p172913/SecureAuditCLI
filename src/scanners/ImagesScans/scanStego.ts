import { exec } from "child_process";
import { existsSync } from "fs";

const file = process.argv[2];
if (!file) {
  console.error("Usage: ts-node scanStego.ts <file>");
  process.exit(1);
}

console.log(`Scanning for steganography: ${file}`);

exec(`zsteg "${file}"`, (error, stdout, stderr) => {
  console.log("\n=== zsteg output ===");
  if (error) {
    if (stderr) {
      console.error(stderr);
    } else {
      console.error(error.message);
    }
  }
  console.log(stdout);

  // Stegseek (if wordlist.txt exists)
  if (existsSync("wordlist.txt")) {
    exec(`stegseek "${file}" wordlist.txt`, (stegError, stegStdout, stegStderr) => {
      console.log("\n=== stegseek output ===");
      if (stegError) {
        if (stegStderr) {
          console.error(stegStderr);
        } else {
          console.error(stegError.message);
        }
      }
      console.log(stegStdout);
    });
  } else {
    console.warn("wordlist.txt not found, skipping stegseek scan.");
  }
});
