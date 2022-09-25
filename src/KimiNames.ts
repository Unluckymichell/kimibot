import { readFileSync, writeFileSync } from "fs";
import { randomInt } from "./util";

export class KimiNames {
  public kimiNames: string[] = [];
  filename: string;

  constructor(filename: string) {
    this.filename = filename;
    this.load();
  }

  load() {
    this.kimiNames = readFileSync(this.filename, { encoding: "utf-8" })
      .replace(/\r/g, "")
      .split("\n");
  }

  save() {
    writeFileSync(this.filename, this.kimiNames.join("\n"), {
      encoding: "utf-8",
    });
  }

  addName(name: string) {
    if (!this.hasName(name)) this.kimiNames.push(name);
  }

  deleteName(name: string) {
    let i = this.kimiNames.indexOf(name);
    if (i == -1) throw "Not in list";
    else this.kimiNames.splice(i, 1);
  }

  hasName(name: string) {
    return this.kimiNames.includes(name);
  }

  getRandom() {
    return this.kimiNames[randomInt(0, this.kimiNames.length - 1)];
  }
}
