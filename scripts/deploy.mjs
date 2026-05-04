import fs from "node:fs";
import path from "node:path";

const MODULE_NAME = "shards-core";
const target = `/mnt/c/Users/Shua/AppData/Local/FoundryVTT/Data/modules/${MODULE_NAME}`;

fs.rmSync(target, { recursive: true, force: true });
fs.mkdirSync(path.dirname(target), { recursive: true });
fs.cpSync("dist", target, { recursive: true });

console.log(`deployed -> ${target}`);