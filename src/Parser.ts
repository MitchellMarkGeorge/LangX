// based on
//https://github.com/segmentio/xml-parser/blob/master/index.js
// https://github.com/chrisbottin/xml-parser/blob/master/index.js

import { parse as parseExpression } from "expression-eval";
import {
  isExpressionAttribute,
  isKeyTag,
} from "./constants";
import { IfNode, Node } from "./types/nodes";
import { ParsedAttribute } from "./types/types";

export class Parser {
  private xml: string;

  constructor(xml: string) {
    this.xml = xml;
    this.xml = this.xml.trim();

    // strip comments
    this.xml = this.xml.replace(/<!--[\s\S]*?-->/g, "");
  }

  public parse() {
    return this.tag();
  }

  private tag() {
    //   debug('tag %j', xml);
    let m = this.match(/^<([\w-:.]+)\s*/);
    if (!m) return null;

    // name
    let node: Node = { // if it is a key tag make it lowercase else leave as is
      name: isKeyTag(m[1]) ? m[1].toLowerCase() : m[1], // can now use uppercase variations // this also alows blocks and functions to have camelCase names
      attributes: {},
      children: [],
      content: null,
    };

    // call tag based method here

    // attributes
    while (!(this.eos() || this.is(">") || this.is("?>") || this.is("/>"))) {
      let attr = this.attribute();
      if (!attr) return node;
      let value: string | parseExpression.Expression;

      // only certain attributes and nodes can have expressions
      // or if it is a custom attribute (could be a block or function)

      if (isExpressionAttribute(attr.name) || !isKeyTag(node.name)) {
        value = parseExpression(attr.value);
      } else {
        value = attr.value;
      }
      node.attributes[attr.name] = value;
    }

    // self closing tag
    if (this.match(/^\s*\/>\s*/)) {
      return node;
    }

    this.match(/\??>\s*/);

    // content
    node.content = this.content(); // use this

    // children
    let child = this.tag();
    while (child) {
      // find way to tidy this up
      if (child.name === "if") { // this parses neighbouring else block
        // get next child block
        let nextChild = this.tag();
        // if the child block is not null
        if (nextChild) {
          // check if it is an else tag
          if (nextChild.name === "else") {
            // if it is, instead of adding it as a child,
            // save it to the if block
            (child as IfNode).elseNode = nextChild;
          } else {
            // if the next child is not an else block, add it to the children
            // and move to the next one
            node.children.push(child, nextChild);
            child = this.tag();
          }
        } else {
          // if next child is null, add if block
          node.children.push(child);
          child = this.tag();
        }
      } else {
        // if not an if-block, just add the block and move to the next one
        node.children.push(child);
        child = this.tag();
      }
    }

    // closing
    this.match(/^<\/[\w-:.]+>\s*/);

    return node;
  }


  private content() {
   
    let m = this.match(/^([^<]*)/);
    if (m) return m[1];
    return "";
  }

  /**
   * Attribute
   * @api private
   */
  private attribute(): ParsedAttribute | null {
    //   debug('attribute %j', xml);
    // edited it to allow ()
    // https://www.regextester.com/1969
    // let m = match(/([\w:-]+)\s*=\s*("[^"]*"|'[^']*'|\w+)\s*/);
    let m = this.match(/([\w:-]+)\s*=\s*("[^"]*"|'[^']*'|\(([^)]*)\)|\w+)\s*/);
    if (!m) return null;
    return { name: m[1].toLowerCase(), value: this.strip(m[2]) };
  }

  /**
   * Strip quotes from `val`.
   * @param {String} val
   * @api private
   */

  private strip(val: string) {
    // /^['"\(]|['"\)]$/g
    return val.replace(/^['"\(]|['"\)]$/g, "");
  }

  /**
   * Match `re` and advance the string.
   *
   */

  private match(re: RegExp) {
    let m = this.xml.match(re);
    if (!m) return null;
    this.xml = this.xml.slice(m[0].length);
    return m;
  }

  /**
   * End-of-source.
   *
   */

  private eos() {
    return 0 == this.xml.length;
  }

  /**
   * Check for `prefix`.
   *
   */

  private is(prefix: string) {
    return 0 == this.xml.indexOf(prefix);
  }
}
