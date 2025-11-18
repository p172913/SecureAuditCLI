import { exec } from "child_process";

const file = process.argv[2];
if (!file) {
  console.error("Usage: ts-node scanNSFW.ts <file>");
  process.exit(1);
}

console.log(`Scanning for NSFW content: ${file}`);

exec(`python classify_nsfw.py --image "${file}"`, (error, stdout, stderr) => {
  console.log("\n=== OpenSFw2 NSFW Scan ===");
  if (error) {
    if (stderr) {
      console.error(stderr);
    } else {
      console.error(error.message);
    }
  }
  console.log(stdout);
});
