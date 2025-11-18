import { exec } from "child_process";

const file = process.argv[2];
if (!file) {
  console.error("Usage: ts-node scanMetadata.ts <file>");
  process.exit(1);
}

console.log(`Scanning metadata for: ${file}`);

exec(`exiftool "${file}"`, (error, stdout, stderr) => {
  console.log("\n=== Exiftool Metadata ===");
  if (error) {
    if (stderr) {
      console.error(stderr);
    } else {
      console.error(error.message);
    }
  }
  console.log(stdout);

  exec(`mat2 --check "${file}"`, (matError, matStdout, matStderr) => {
    console.log("\n=== MAT2 Metadata Check ===");
    if (matError) {
      if (matStderr) {
        console.error(matStderr);
      } else {
        console.error(matError.message);
      }
    }
    console.log(matStdout);
  });
});
