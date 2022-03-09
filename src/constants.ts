import chalk from "chalk";
import { CallStack } from "./CallStack";


export const KEYTAGS = [
  "main",
  "var",
  "if",
  "else",
  "print",
  "loop",
  "block",
  "debug",
  "function",
  // "include",
  "return",
  "input",
  // "export"
];

// attributes that contain exppressions
export const EXPRESSION_ATTRIBUTES = ["condition", "val", "content", "count"];

export function isExpressionAttribute(attrName: string) {
  return EXPRESSION_ATTRIBUTES.includes(attrName);
}

export function isKeyTag(tagName: string) {
  return KEYTAGS.includes(tagName);
}

export function error(message: string, callStack: CallStack) {
  console.log(chalk.red(`Error: ${message}`));
  callStack.print();
  process.exit();
}

