//https://github.com/segmentio/xml-parser/blob/master/index.js
const { parse: parseExpression } = require('expression-eval');

module.exports = parse;
/**
 * Parse the given string of `xml`.
 *
 * @param {String} xml
 * @return {Object}
 * @api public
 */


function parse(xml) {
  xml = xml.trim();

  // strip comments
  xml = xml.replace(/<!--[\s\S]*?-->/g, '');

  // return {
  //     root: tag()
  // }
  return tag();
  /**
   * XML document.
   */

  // function document() {
  //   return {
  //     declaration: declaration(),
  //     root: tag()
  //   }
  // }

  /**
   * Declaration.
   */

  // function declaration() {
  //   var m = match(/^<\?xml\s*/);
  //   if (!m) return;

  //   // tag
  //   var node = {
  //     attributes: {}
  //   };

  //   // attributes
  //   while (!(eos() || is('?>'))) {
  //     var attr = attribute();
  //     if (!attr) return node;
  //     node.attributes[attr.name] = attr.value;
  //   }

  //   match(/\?>\s*/);

  //   return node;
  // }

  /**
   * Tag.
   */
  // create sperate functions for each tag type
  function tag() {
    //   debug('tag %j', xml);
    var m = match(/^<([\w-:.]+)\s*/);
    if (!m) return null;

    // name
    var node = {
      name: m[1].toLowerCase(), // can now use uppercase variations
      attributes: {},
      children: []
    };

    // call tag based method here

    // attributes
    while (!(eos() || is('>') || is('?>') || is('/>'))) {
      var attr = attribute();
      if (!attr) return node;
      let value;

      // only certain attributes and nodes can have expressions
      if (attr.name === "condition" || attr.name === "val" || attr.name === "content" || attr.name === "count") {
        value = parseExpression(attr.value);
      } else {
        value = attr.value
      }
      node.attributes[attr.name] = value
    }

    // self closing tag
    if (match(/^\s*\/>\s*/)) {
      return node;
    }

    match(/\??>\s*/);

    // content
    node.content = content(); // use this

    // children
    let child = tag();
    while (child) {
      // find way to tidy this up
      if (child.name === "if") {
        // get next child block
        let nextChild = tag();
        // if the child block is not null
        if (nextChild) { 
          // check if it is an else tag
          if (nextChild.name === "else") {
            // if it is, instead of adding it as a child, 
            // save it to the if block
            child.elseNode = nextChild;
          } else {
            // if the next child is not an else block, add it to the children
            // and move to the next one
            node.children.push(child, nextChild);
            child = tag()
          }
        } else {
          // if next child is null, add if blocl
          node.children.push(child);
          child = tag()
        }

        
      } else {
        // if not if-block, just add the block and move to the next one
        node.children.push(child);
        child = tag()
      }


    }

    // closing
    match(/^<\/[\w-:.]+>\s*/);

    return node;
  }

  /**
   * Text content.
   */

  function content() {
    //   debug('content %j', xml);
    var m = match(/^([^<]*)/);
    if (m) return m[1];
    return '';
  }

  /**
   * Attribute.
   */

  function attribute() {
    //   debug('attribute %j', xml);
    // edited it to allow ()
    // https://www.regextester.com/1969
    // var m = match(/([\w:-]+)\s*=\s*("[^"]*"|'[^']*'|\w+)\s*/);
    var m = match(/([\w:-]+)\s*=\s*("[^"]*"|'[^']*'|\(([^)]*)\)|\w+)\s*/);
    if (!m) return;
    // console.log(m[2])
    return { name: m[1].toLowerCase(), value: strip(m[2]) }
  }

  /**
   * Strip quotes from `val`.
   * @param {String} val
   */

  function strip(val) {
    return val.replace(/^['"\(]|['"\)]$/g, '');
  }

  /**
   * Match `re` and advance the string.
   */

  function match(re) {
    var m = xml.match(re);
    if (!m) return;
    xml = xml.slice(m[0].length);
    return m;
  }

  /**
   * End-of-source.
   */

  function eos() {
    return 0 == xml.length;
  }

  /**
   * Check for `prefix`.
   */

  function is(prefix) {
    return 0 == xml.indexOf(prefix);


  }
}