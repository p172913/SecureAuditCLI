import { exec } from "child_process";

const file = process.argv[2];
if (!file) {
  console.error("Usage: ts-node scanIntegrity.ts <file>");
  process.exit(1);
}

console.log(`Checking integrity (sha256sum) for: ${file}`);

exec(`sha256sum "${file}"`, (error, stdout, stderr) => {
  console.log("\n=== sha256sum ===");
  if (error) {
    if (stderr) {
      console.error(stderr);
    } else {
      console.error(error.message);
    }
  }
  console.log(stdout);
});
