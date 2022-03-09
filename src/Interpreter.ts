import { error, isKeyTag } from "./constants";
import {
  BlockNode,
  DebugNode,
  FunctionNode,
  IfNode,
  InputNode,
  LoopNode,
  PrintNode,
  VarNode,
} from "./types/nodes";
import { Scope, ReturnSignal, DEFAULT_SIGNAL } from "./types/types";
import { Node } from "./types/nodes";

import { eval as evalExpression, parse } from "expression-eval";
import PromptSync from "prompt-sync";
import { CallStack } from "./CallStack";

export class Interpreter {
  private ast: Node;
  private scriptPath: string; // path of the current script that is running
  private exported!: Scope | null;
  private callStack: CallStack;
  constructor(ast: Node, programPath: string) {
    this.ast = ast;
    this.scriptPath = programPath;
    this.callStack = new CallStack(programPath);
  }

  eval() {
    this.evalMain(this.ast);
  }

  private evalNode(node: Node, scope: Scope): ReturnSignal {
    // default return value for non returning tags is undefined

    // removed import functionality for now
    switch (node.name) {
      case "main":
        this.callStack.push({ tagName: node.name})
        error("There can only be one 'main' tag", this.callStack);
      case "var":
        // rerun the alue assigned?
        return this.evalVar(node as VarNode, scope); // cant return

      // break;

      case "if":
        return this.evalIf(node as IfNode, scope); // can return
      // break;

      case "else":
        this.callStack.push({ tagName: node.name})
        // all else tags should be coupled with their appropiate if statements
        error("Misplaced else tag", this.callStack);

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
        //3) can return results

        // should a a function declaration return that function node
        return this.evalFunction(node as FunctionNode, scope); // can return

      // case "include":
      //   // only mutates given scope, no return
      //   return this.evalIncude(node as IncludeNode, scope);

      case "return":
        // returns work through a bubling system
        // each eval returns a signal and depending on the tag, the signal can either be ignured
        // or returned (going higher up/bubbles)
        return this.evalReturn(node, scope);

      case "input":
        return this.evalInput(node as InputNode, scope);

      // case "export":
      //     return this.evalExport(node as ExportNode, scope)
      default:
        return this.checkScopeForBlock(node as BlockNode, scope); // scope?
    }
  }

  // removing module support for now

  // private evalExport(node: ExportNode, scope: Scope): ReturnSignal {
  //   if (!node.attributes.namespace) {
  //     error("export tag must have namespace attribute")
  //   }
  //   const newScope = this.newScope(); // should it be a new scope? if itt extends the surrounding scope, it still is an issue
  //   // extending the scope lets imported code to leak in
  //   for (let i = 0; i < node.children.length; i++) {
  //     const currentNode = node.children[i];
  //     if (currentNode.name === "return") {
  //       error("export tag can't return");
  //     }
  //     this.evalNode(currentNode, newScope); // ignore any returns?
  //   }

  //   Object.entries(newScope).forEach((entry) => {
  //     const [key, value] = entry;
  //     // will leave the print and input incase it is overriden
  //     newScope[`${node.attributes.namespace}:${key}`] = value; // namespace the items
  //     delete newScope[key]; // remove the non-namespaced items
  //   });

  //   this.exported = newScope;
  //   // namespace it
  //   return DEFAULT_SIGNAL
  // }

  private evalInput(node: InputNode, scope: Scope): ReturnSignal {
    this.callStack.push({ tagName: node.name})
    if (!node.attributes.content) {
      error("input tag must have attribute content", this.callStack);
    }

    const promptText = evalExpression(node.attributes.content, scope);

    const value = PromptSync()(promptText);
    this.callStack.pop();
    return { doesReturn: false, value }; // think about this
  }

  private evalReturn(node: Node, scope: Scope): ReturnSignal {
    this.callStack.push({tagName: node.name})
    if (node.attributes.val) {
      const value = evalExpression(node.attributes.val, scope);
      return { doesReturn: true, value };
    } else if (node.children.length) {
      if (node.children.length > 1) {
        error("return tag can't have more than one child", this.callStack);
      }

      const [child] = node.children;
      this.callStack.pop()
      return this.evalNode(child, scope); // does this leave the posibility of returning nuthing? // in this case, the default retuned value should be null
    } else {
      this.callStack.pop();
      return { doesReturn: true, value: undefined }; // has to return -> defaukt return
      // throw new Error(
      //   "either val attribute or single child returning tag must be provided"
      // );
    }
  }

  // removing module support for now

  // private evalIncude(node: IncludeNode, scope: Scope): ReturnSignal {
  //   // console.log(node);
  //   if (!node.attributes.from) {
  //     error("include tag must have from attribute");
  //   }

  //   let fromPath: string;
  //   if (node.attributes.from.endsWith(".xml")) {
  //     fromPath = node.attributes.from;
  //   } else {
  //     fromPath = node.attributes.from.concat(".xml");
  //   }

  //   let rootPath = path.dirname(this.scriptPath);

  //   let modulePath = path.join(rootPath, fromPath);

  //   if (!existsSync(modulePath)) {
  //     error("There is no module with name " + node.attributes.from);
  //   }

  //   let script = new Script(modulePath);

  //   let importedScope = script.run();
  //   // IMPORTANT
  //   // Only takes global scope of imported module
  //   if (importedScope) {
  //     // right most should have preference right?
  //     // scope should be mutated with global scope values of imported file

  //     // if other file imports a module, the scope of the other file is added

  //     console.log(importedScope);
  //     Object.assign(scope, importedScope);
  //   } else {
  //     error("Unable to load module");
  //   }

  //   return { doesReturn: false };
  // }
  private evalFunction(node: FunctionNode, scope: Scope): ReturnSignal {
    // should i acctually 
    // to show the the problem occured at a function definition and not invocation
    this.callStack.push({ tagName: node.name + "_def"})
    if (!node.attributes.id) {
      error("function must have attribute name", this.callStack);
    }

    if (
      isKeyTag(node.attributes.id) ||
      scope.hasOwnProperty(node.attributes.id)
    ) {
      error(`function must have a unique name: "${node.attributes.id}" is already in scope"`, this.callStack);
    }
    scope[node.attributes.id] = node;

    // console.log(scope)
    // let params = node.attributes.params;

    // params = params.trim().split(/[\s,]+/);
    // console.log(params);
    this.callStack.pop();
    return DEFAULT_SIGNAL;
  }

  private evalDebug(node: DebugNode, scope: Scope): ReturnSignal {
    
    this.callStack.push({ tagName: node.name})
    if (node.attributes.scope === "true") {
      console.log(scope);
    }

    if (node.attributes.error === "true") {
      error("DEBUG", this.callStack);
    }

    return { doesReturn: false };
  }

  private checkScopeForBlock(node: BlockNode, scope: Scope): ReturnSignal {
    // console.log(node)
    let blockName = node.name;
    // console.log(typeof blockName)
    // AS OF RIGHT NOW ONLY BLOCKS CREATE THEIR OWN SCOPE (soperate from encasulating scope)
    this.callStack.push({ name: blockName, tagName: blockName})
    if (!scope.hasOwnProperty(blockName)) {
      error(`Can't recognize tag or block "${blockName}"`, this.callStack);
    }

    let blockNode = scope[blockName] as BlockNode;

    //  first check was unneeded due to the hasOwnProperty check above
    if (blockNode?.name === "function" || blockNode?.name === "block") {
      // this merges the previous global scope with  a new scope
      // this alowes global variables to be used in scoped blocks

      if (blockNode.name === "function") {
        this.callStack.peek().tagName = "function"
        let params: { [key: string]: any } = {};
        // console.log(node.attributes)
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
            this.callStack.pop(); // should this be here?
            return signal;
          }
        }
      } else {
        this.callStack.peek().tagName = "block"
        let newScope = this.newScope();
        //Object.assign({}, scope);
        for (let i = 0; i < blockNode.children.length; i++) {
          const currentNode = blockNode.children[i];
          if (currentNode.name === "return") {
            error("Can't return in block tag. Use function instead", this.callStack);
          }
          this.evalNode(currentNode, newScope);
        }
      }
    } else {
      error("Can only call functions or blocks", this.callStack);
    }
    this.callStack.pop();
    return DEFAULT_SIGNAL;
  }

  private evalBlock(node: BlockNode, scope: Scope): ReturnSignal {
    // should blocks use name instead of id?
    this.callStack.push({ tagName: node.name+"_def"})
    if (!node.attributes.id) {
      error("block must have attribute id", this.callStack);
    }

    if (
      isKeyTag(node.attributes.id) ||
      scope.hasOwnProperty(node.attributes.id)
    ) {
      error(`block must have a unique name: "${node.attributes.id}" is already in scope`, this.callStack);
    }
    scope[node.attributes.id] = node;

    // console.log(node)
    this.callStack.pop();
    return { doesReturn: false };
  }

  private evalLoop(node: LoopNode, scope: Scope): ReturnSignal {
    this.callStack.push({ tagName: node.name});
    if (!node.attributes.count) {
      error("loop tag must have attribute count", this.callStack);
    }

    if (!node.attributes.index) {
      error("loop tag must have attribute index", this.callStack);
    }

    if (!node.children.length) {
      error("loop tag must have children", this.callStack);
    }

    if (scope.hasOwnProperty(node.attributes.index)) {
      error("index variable in loop tag must be unique", this.callStack);
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
          this.callStack.pop(); // should this be here?
          return signal;
        }
      }
    }
    this.callStack.pop();
    return DEFAULT_SIGNAL;
  }

  private evalPrint(node: PrintNode, scope: Scope): ReturnSignal {
    // if (!node.attributes.content) {
    //   throw new Error("No content provided");
    // }

    this.callStack.push({ tagName: node.name})

    if (node.attributes.content) {
      // use val unstead

      const content = evalExpression(node.attributes.content, scope);

      console.log(content);
    } else if (node.children.length) {
      if (node.children.length > 1) {
        error("must have child", this.callStack);
      }

      const [child] = node.children;
      const signal = this.evalNode(child, scope);
      console.log(signal.value);
      // if (signal.doesReturn) {
      //     scope.print(signal.value);
      // }
    } else {
      error("print tag must have content attribute or single child", this.callStack);
    }
    this.callStack.pop();
    return DEFAULT_SIGNAL;
  }

  private evalIf(node: IfNode, scope: Scope): ReturnSignal {
    this.callStack.push({ tagName: node.name});
    if (!node?.attributes.condition) {
      error("if tag must have 'condition' attribute", this.callStack);
    }

    const result = evalExpression(node.attributes.condition, scope);

    let newScope = Object.assign({}, scope);

    if (result) {
      if (!node.children.length) {
        error("if tag must have a body", this.callStack);
      }

      for (let j = 0; j < node.children.length; j++) {
        let currentNode = node.children[j];

        let signal = this.evalNode(currentNode, newScope);
        if (signal.doesReturn) {
          this.callStack.pop(); // should this be here?
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
            this.callStack.pop(); // should this be here?
            return signal;
          }
        }
      }
    }

    this.callStack.pop();
    return DEFAULT_SIGNAL;
  }

  private evalVar(node: VarNode, scope: Scope): ReturnSignal {
    this.callStack.push({ tagName: node.name, name: node.attributes.id});
    if (!node.attributes.id) {
      error("var tag must have attribute 'id'", this.callStack);
    }

    // if (!node.attributes.val) {
    //   throw new Error("var tag must have attribute 'val'");
    // }
    
    if (node.attributes.val) {
      if (node.attributes.val.type === "Literal") {
        // booleans, strings, numbers
        scope[node.attributes.id] = (
          node.attributes.val as parse.Literal
        ).value;
      } else if (node.attributes.val.type === "Identifier") {
        const identifierNode = node.attributes.val as parse.Identifier;
        if (!scope.hasOwnProperty(identifierNode.name)) {
          error("No variable with id " + identifierNode.name, this.callStack);
        }
        // reassignment/ asignment of variable value
        const referenced_var_value = scope[identifierNode.name];

        scope[node.attributes.id] = referenced_var_value;
      } else {
        // might be other types i dont know
        scope[node.attributes.id] = evalExpression(node.attributes.val, scope);
      }
    } else if (node.children.length) {
      if (node.children.length > 1) {
        error("var tag can only have one child", this.callStack);
      }

      const [child] = node.children;

      const signal = this.evalNode(child, scope);
      scope[node.attributes.id] = signal.value; // if the child node does not return, it will be
    } else {
      error("var must have val attribute or single child", this.callStack);
    }

    this.callStack.pop();

    return DEFAULT_SIGNAL;
  }

  private evalMain(node: Node) {
    // no need to return global scope now
    const GLOBAl_SCOPE = this.newScope();
    

    if (node.name !== "main") {
      this.callStack.push({ tagName: node.name})
      error("Root tag must be 'main'", this.callStack);
    }

    this.callStack.push({ tagName: node.name})
    if (node.children.length) {
      for (let i = 0; i < node.children.length; i++) {
        const currentNode = node.children[i];

        this.evalNode(currentNode, GLOBAl_SCOPE); // everything starts with the global scope
        // handle return?? (value of the script)
      }
    }

    this.callStack.pop();

    
    // return GLOBAl_SCOPE; // this is needed in the case of include tags
  }

  getExported() {
    return this.exported;
  }

  private newScope(): Scope {
    return {};
  }
}
