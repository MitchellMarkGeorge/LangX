import chalk from "chalk";


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
  "include",
  "return",
  "input",
  "export"
];

export const EXPRESSION_ATTRIBUTES = ["condition", "val", "content", "count"];

export function isExpressionAttribute(attrName: string) {
  return EXPRESSION_ATTRIBUTES.includes(attrName);
}

export function isKeyTag(tagName: string) {
  return KEYTAGS.includes(tagName);
}

export function error(message: string) {
  const ERROR = chalk.bold("Error:");
  console.log(chalk.red(`${ERROR} ${message}`));
    // console.log(chalk.green(ndo))
  process.exit();
}

