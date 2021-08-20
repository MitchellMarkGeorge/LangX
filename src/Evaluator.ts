import { isKeyTag } from "./constants";
import {
  BlockNode,
  DebugNode,
  FunctionNode,
  IfNode,
  IncludeNode,
  LoopNode,
  PrintNode,
  VarNode,
} from "./types/nodes";
import { Scope, Signal } from "./types/types";
import { Node } from "./types/nodes";

import { eval as evalExpression, parse } from "expression-eval";
import path from "path";
import { existsSync } from "fs";
import { Script } from "./Script";

export class Evaluator {
  private ast: Node;
  private programPath: string; // pro

  constructor(ast: Node, programPath: string) {
    this.ast = ast;
    this.programPath = programPath;
  }

  eval() {
    return this.evalMain(this.ast);
  }

  private evalNode(node: Node, scope: Scope): Signal {
    switch (node.name) {
      case "main":
        throw new Error("There can only be one 'main' tag");
      case "var":
        return this.evalVar(node as VarNode, scope); // cant return
        
        // break;

      case "if":
        return this.evalIf(node as IfNode, scope); // can return
        // break;

      case "else":
        // all else tags should be coupled with their appropiate if statements
        throw new Error("Misplaced else tag");

      case "print":
        return this.evalPrint(node as PrintNode, scope); // cant return // can use val
        // break;

      case "loop":
        return this.evalLoop(node as LoopNode, scope); // can?
        // break;

      case "block":
        return this.evalBlock(node as BlockNode, scope); // cant returrn
        // break;

      case "debug":
        return this.evalDebug(node as DebugNode, scope); // cant retirn
        // break;

      case "function":
        // funtions are a type of block
        // differences
        //1) inherit scope
        //2) can receive params
        //3) can return results (not right now though)
        return this.evalFunction(node as FunctionNode, scope); // can return
        // break;

      case "include":
        return this.evalIncude(node as IncludeNode, scope);
        // break;

        case "return":
            // returns work through a bubling system
            // each eval returns a signal and depending on the tag, the signal can either be ignured
            // or returned (going higher up/bubbles)
            return this.evalReturn(node, scope);
      default:
        return this.checkScopeForBlock(node as BlockNode, scope); // scope?
        // break;
    }
  }

  private evalReturn(node: Node, scope: Scope): Signal {
    // this should bubble up hopefully
    if (node.attributes.val) {
      const value = evalExpression(node.attributes.val, scope);
      return { doesReturn: true, value };
    } else if (node.children.length) {
      if (node.children.length > 1) {
        throw new Error("return tag cant have more than one child");
      }

      const [child] = node.children;
      return this.evalNode(child, scope); // does this leave the posibility of returning nuthing? // in this case, the default retuned value should be null
    } else {
      throw new Error(
        "either val attribute or single child returning tag must be provided"
      );
    }
  }

  private evalIncude(node: IncludeNode, scope: Scope): Signal {
    console.log(node);
    if (!node.attributes.from) {
      throw new Error("include tag must have from attribute");
    }

    let fromPath: string;
    if (node.attributes.from.endsWith(".xml")) {
      fromPath = node.attributes.from;
    } else {
      fromPath = node.attributes.from.concat(".xml");
    }

    let rootPath = path.dirname(this.programPath);

    let modulePath = path.join(rootPath, fromPath);

    if (!existsSync(modulePath)) {
      throw new Error("There is no module with name " + node.attributes.from);
    }

    let script = new Script(modulePath);

    let importedScope = script.run();
    // IMPORTANT
    // Only takes global scope of imported module
    if (importedScope) {
      // right most should have preference right?
      // scope should be mutated with global scope values of imported file
      Object.assign(scope, importedScope);
    } else {
      throw new Error("Unable to load module");
    }

    return { doesReturn: false }
  }
  private evalFunction(node: FunctionNode, scope: Scope): Signal {
    if (!node.attributes.id) {
      throw new Error("function must have attribute name");
    }

    if (
      isKeyTag(node.attributes.id) ||
      scope.hasOwnProperty(node.attributes.id)
    ) {
      throw new Error("function must have a unique name");
    }
    scope[node.attributes.id] = node;

    // console.log(scope)
    // let params = node.attributes.params;

    // params = params.trim().split(/[\s,]+/);
    // console.log(params);

    return { doesReturn: false}
  }

  private evalDebug(node: DebugNode, scope: Scope): Signal {
    // console.log(node)
    if (node.attributes.scope === "true") {
      scope.print(scope);
    }

    return { doesReturn: false }
  }

  private checkScopeForBlock(node: BlockNode, scope: Scope): Signal {
    let blockName = node.name;
    // console.log(typeof blockName)
    // AS OF RIGHT NOW ONLY BLOCKS CREATE THEIR OWN SCOPE (soperate from encasulating scope)
    if (!scope.hasOwnProperty(blockName)) {
      throw new Error("Can't recognize tag or block");
    }

    let blockNode = scope[blockName];

    if (blockNode) {
      // this merges the previous global scope with  a new scope
      // this alowes global variables to be used in scoped blocks

      if (blockNode.name === "function") {
        let params: { [key: string]: any } = {};
        // gets the params from the callee
        Object.keys(node.attributes).forEach((key) => {
          let value = node.attributes[key];
          params[key] = evalExpression(value, scope);
        });
        // creates a new scope using the params
        // and "calls" the function // evals its children
        //copy scope
        // let scopeCopy = Object.assign()
        // using blank object so scope variable is not mutated
        // order is importatn as in function, the inner scope should be prefered to the outer scope
        // meaning that you can have a variable with same name in a outer scope anmd in the inner scope,
        // and when referenced, the value of the inner variable will be used
        let newScope = Object.assign({}, scope, params);
        for (let i = 0; i < blockNode.children.length; i++) {
          const currentNode = blockNode.children[i];
          let signal = this.evalNode(currentNode, newScope);
          if (signal.doesReturn) {
            return signal;
          }
        }
      } else {
        let newScope = this.newScope();
        //Object.assign({}, scope);
        for (let i = 0; i < blockNode.children.length; i++) {
          const currentNode = blockNode.children[i];
          if (currentNode.name === "return") {
            throw new Error("Can't return in block tag. Use function instead");
          }
          this.evalNode(currentNode, newScope);
          
        }
      }
    }

    return { doesReturn: false };
  }

  private evalBlock(node: BlockNode, scope: Scope): Signal {
    // should blocks use name instead of id?
    if (!node.attributes.id) {
      throw new Error("block must have attribute name");
    }

    if (
      isKeyTag(node.attributes.id) ||
      scope.hasOwnProperty(node.attributes.id)
    ) {
      throw new Error("block must have a unique name");
    }
    scope[node.attributes.id] = node;

    // console.log(node)
    return { doesReturn: false };
  }
  private evalLoop(node: LoopNode, scope: Scope): Signal {
    if (!node.attributes.count) {
      throw new Error("loop tag must have attribute count");
    }

    if (!node.attributes.index) {
      throw new Error("loop tag must have attribute index");
    }

    if (!node.children.length) {
      throw new Error("loop tag must have children");
    }

    if (scope.hasOwnProperty(node.attributes.index)) {
      throw new Error("index variable in loop tag must be unique");
    }

    let count = evalExpression(node.attributes.count, scope);

    let newScope = Object.assign({}, scope);

    // let
    for (let i = 0; i < count; i++) {
      newScope[node.attributes.index] = i;
      for (let k = 0; k < node.children.length; k++) {
        let childNode = node.children[k];
        let signal = this.evalNode(childNode, newScope);
        if (signal.doesReturn) {
          return signal;
        }
      }
    }

    return { doesReturn: false };
  }

  private evalPrint(node: PrintNode, scope: Scope): Signal {
    // if (!node.attributes.content) {
    //   throw new Error("No content provided");
    // }

    if (node.attributes.content) {
        const content = evalExpression(node.attributes.content, scope);

        scope.print(content);

    } else if (node.children.length) {
        if (node.children.length > 1) {
            throw new Error("must have child");  
        }

        const [child] = node.children;
      const signal =  this.evalNode(child, scope);

      if (signal.doesReturn) {
          scope.print(signal.value);
      }
    } else {
        throw new Error("print tag must have content attribute  or single child ")
    }

    

    return { doesReturn: false };
  }

  private evalIf(node: IfNode, scope: Scope): Signal {
    if (!node?.attributes.condition) {
      throw new Error("if tag must have 'condition' attribute");
    }

    const result = evalExpression(node.attributes.condition, scope);

    let newScope = Object.assign({}, scope);

    if (result) {
      if (!node.children.length) {
        throw new Error("if tag must have a body");
      }

      for (let j = 0; j < node.children.length; j++) {
        let currentNode = node.children[j];

        let signal = this.evalNode(currentNode, newScope);
        if (signal.doesReturn) {
          return signal;
        }
      }
    } else {
      if (node.elseNode) {
        let elseNode = node.elseNode;
        for (let k = 0; k < elseNode.children.length; k++) {
          let currentNode = elseNode.children[k];

          let signal = this.evalNode(currentNode, newScope);
          if (signal.doesReturn) {
            return signal;
          }
        }
      }
    }

    return { doesReturn: false };
  }

  private evalVar(node: VarNode, scope: Scope): Signal {
    if (!node.attributes.id) {
      throw new Error("var tag must have attribute 'id'");
    }

    if (!node.attributes.val) {
      throw new Error("var tag must have attribute 'val'");
    }

    if (node.attributes.val.type === "Literal") {
      // booleans, strings, numbers
      scope[node.attributes.id] = (node.attributes.val as parse.Literal).value;
    } else if (node.attributes.val.type === "Identifier") {
      const identifierNode = node.attributes.val as parse.Identifier;
      if (!scope.hasOwnProperty(identifierNode.name)) {
        throw new Error("No variable with id " + identifierNode.name);
      }
      // reassignment/ asignment of variable value
      const referenced_var_value = scope[identifierNode.name];

      scope[node.attributes.id] = referenced_var_value;
    } else {
      // might be other types i dont know
      scope[node.attributes.id] = evalExpression(node.attributes.val, scope);
    }

    return { doesReturn: false };
  }

  private evalMain(node: Node) {
    const GLOBAl_SCOPE = this.newScope();

    if (node.name !== "main") {
      throw new Error("Root node must be 'main'");
    }

    if (node.children.length) {
      for (let i = 0; i < node.children.length; i++) {
        const currentNode = node.children[i];

        this.evalNode(currentNode, GLOBAl_SCOPE); // everything starts with the global scope
        // handle return?? (value of the script)
      }
    }

    return GLOBAl_SCOPE; // this is needed in the case of include tags
  }

  private newScope(): Scope {
    return {
      print: (value) => {
        console.log(value);
      },
    };
  }
}
