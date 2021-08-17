const fs = require("fs");

// const { parse, eval } = require('expression-eval');

const parseXML = require("./src/parser.js");
const evalMain = require("./src/eval.js");
const xml = fs.readFileSync("example.xml", "utf-8");

// console.log(parseXML(xml).children[1])

const ast = parseXML(xml);
// console.log(ast)
evalMain(ast)
// const ast = parse("true")

// console.log(ast)

// console.log(eval(ast))