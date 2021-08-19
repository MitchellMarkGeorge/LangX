import { Parser } from "./Parser";
import fs from "fs";
import { Evaluator } from "./Evaluator";

export class Program {
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

    if (ast) {
      const evaluator = new Evaluator(ast, this.filePath);
      return evaluator.eval();
    }

    return null;
  }
}
