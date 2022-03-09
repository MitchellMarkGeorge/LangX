import { Parser } from "./Parser";
import fs from "fs";
import { Interpreter } from "./Interpreter";

export class Script {
  private filePath: string;
  private parser: Parser;
  constructor(filePath: string) {
    this.filePath = filePath;
    const xml = fs.readFileSync(filePath, "utf-8");
    this.parser = new Parser(xml);
  }

  run() {
    const ast = this.parser.parse();
    if (ast) {
      const interpreter = new Interpreter(ast, this.filePath);
      interpreter.eval();
    }

    return null;
  }
}
