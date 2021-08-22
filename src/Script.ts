import { Parser } from "./Parser";
import fs from "fs";
import { Interpreter } from "./Interpreter";

export class Script {
  private filePath: string;
  private parser: Parser;
  constructor(filePath: string) {
    this.filePath = filePath;
    const xml = fs.readFileSync(filePath, "utf-8");
    // should it be parsed in the constructor
    this.parser = new Parser(xml);
  }

  run() {
    const ast = this.parser.parse();
    // console.log(ast?.children)
    if (ast) {
      const interpreter = new Interpreter(ast, this.filePath);
      return interpreter.eval();
    }

    return null;
  }
}
