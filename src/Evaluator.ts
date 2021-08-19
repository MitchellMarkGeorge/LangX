import { isKeyTag } from "./constants";
import { BlockNode, DebugNode, FunctionNode, IfNode, IncludeNode, LoopNode, PrintNode, VarNode } from "./types/nodes";
import { Scope } from "./types/types"
import { Node } from "./types/nodes";

import { eval as evalExpression, parse } from "expression-eval";
import path from "path";
import { existsSync } from "fs";
import { Program } from "./Program";

export class Evaluator {

    private ast: Node;
    private programPath: string // pro

    constructor(ast: Node, programPath: string) {
        this.ast = ast;
        this.programPath = programPath;
    }

    eval() {
        return this.evalMain(this.ast);
    }

    private evalNode(node: Node, scope: Scope) {
        // console.log(scope);
        switch (node.name) {
            // Attributes cant be empty
            // some tags need their sibling nodes
            // this is a tempoary solition
            // idealy, all needed siblings should be grouped into a single node
            case "main":
                throw new Error("There can only be one 'main' tag")
            case "var":
                this.evalVar(node as VarNode, scope)
                break;
    
            case "if":
                this.evalIf(node as IfNode, scope);
                break;
    
            case "else":
                // all else tags should be coupled with their appropiate is statements
                throw new Error("Misplaced else tag");
    
            case "print":
                this.evalPrint(node as PrintNode, scope);
                break;
    
            case "loop":
                this.evalLoop(node as LoopNode, scope);
                break;
    
            case "block":
                // console.log(node.children)
                this.evalBlock(node as BlockNode, scope);
                break;
    
            case "debug":
                this.evalDebug(node as DebugNode, scope);
                break;
    
            case "function":
                // console.log(node);
                // funtions are a type of block
                // differences
                //1) inherit scope
                //2) can receive params
                //3) can return results
                this.evalFunction(node as FunctionNode, scope);
                break;

            case "include":
                this.evalIncude(node as IncludeNode, scope);
                break;
            default:
                this.checkScopeForBlock(node as BlockNode, scope); // scope?
                break;
        }
    }
    
    
    private evalIncude(node: IncludeNode, scope: Scope) {
        console.log(node)
        if (!node.attributes.from) {
            throw new Error("include tag must have from attribute")
        }

       

        let fromPath: string; 
        if (node.attributes.from.endsWith(".xml")) {
            fromPath = node.attributes.from
        } else {
            fromPath = node.attributes.from.concat(".xml")
        }

        let rootPath = path.dirname(this.programPath);

        let modulePath = path.join(rootPath, fromPath);

        if (!existsSync(modulePath)) {
            throw new Error("There is no module with name " + node.attributes.from)
        }

        let program = new Program(modulePath);

        let importedScope = program.run();

        if (importedScope) {
            // right most should have preference right?
        // scope should be mutated
        Object.assign(scope, importedScope);
        } else {
            throw new Error("Unable to load module")
        }
        

        


    }
    private evalFunction(node: FunctionNode, scope: Scope) {
    
        if (!node.attributes.id) {
            throw new Error("function must have attribute name");
        }
    
        if (isKeyTag(node.attributes.id) || scope.hasOwnProperty(node.attributes.id)) {
            throw new Error("function must have a unique name")
        }
        scope[node.attributes.id] = node;
    
    
        // console.log(scope)
        // let params = node.attributes.params;
    
        // params = params.trim().split(/[\s,]+/);
        // console.log(params);
    }
    
    private evalDebug(node: DebugNode, scope: Scope) {
    
        // console.log(node)
        if (node.attributes.scope === "true") {
            scope.print(scope);
        }
    }
    
    private checkScopeForBlock(node: BlockNode, scope: Scope) {
        
        let blockName = node.name;
        // console.log(typeof blockName)
        // AS OF RIGHT NOW ONLY BLOCKS CREATE THEIR OWN SCOPE (soperate from encasulating scope)
        if (!scope.hasOwnProperty(blockName)) {
            throw new Error("Can't recognize tag or block")
        }
    
        let blockNode = scope[blockName];
    
        if (blockNode) {
            // this merges the previous global scope with  a new scope
            // this alowes global variables to be used in scoped blocks
    
            if (blockNode.name === "function") {
                let params: {[key:string]: any} = {};
                // gets the params from the callee
                Object.keys(node.attributes).forEach((key) => {
                    let value = node.attributes[key];
                    params[key] = evalExpression(value, scope);
                })
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
                    this.evalNode(currentNode, newScope);
                }
             
            } else {
                let newScope = this.newScope();
                //Object.assign({}, scope); 
                for (let i = 0; i < blockNode.children.length; i++) {
                    const currentNode = blockNode.children[i];
                    if (currentNode.name === "return") {
                        throw new Error("Can't return in block tag. Use function instead")
                    }
                    // let siblingNode = node.children[i + 1];
                    // // very hacky
                    // if (currentNode.name === "if" && siblingNode?.name === "else") {
                    //     node.children.splice(i + 1, 1);
                    // }
                    this.evalNode(currentNode, newScope);
                }
            }
    
    
    
    
    
    
    
        }
    }
    
    private evalBlock(node: BlockNode, scope: Scope) {
        // should blocks use name instead of id?
        if (!node.attributes.id) {
            throw new Error("block must have attribute name");
        }
    
        if (isKeyTag(node.attributes.id) || scope.hasOwnProperty(node.attributes.id)) {
            throw new Error("block must have a unique name")
        }
        scope[node.attributes.id] = node;
    
        // console.log(node)
    }
    private evalLoop(node: LoopNode, scope: Scope) {
        // loops should "technically" create their own scope
        // the only thing is that it shoudl take the nearest valible spope
        // using Object.assign right now, it inherit from all of the toppermost scopes (ingluding global
    
        // will leave it for now
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
            throw new Error("index variable in loop tag must be unique")
        }
    
        let count = evalExpression(node.attributes.count, scope);
    
        let newScope = Object.assign({}, scope);
    
        // let 
        for (let i = 0; i < count; i++) {
    
            newScope[node.attributes.index] = i;
            for (let k = 0; k < node.children.length; k++) {
    
                let childNode = node.children[k];
                this.evalNode(childNode, newScope)
            }
        }
    
        // delete scope[node.attributes.index] // so it dosent leak to other places
        // this is better handles with scope
        // scope will then be deleted
    }
    
    
    
     private evalPrint(node: PrintNode, scope: Scope) {
        if (!node.attributes.content) {
            throw new Error("No content provided")
        }
    
        const content = evalExpression(node.attributes.content, scope);
    
        scope.print(content);
    }
    
    private evalIf(node: IfNode, scope: Scope) {
    
        if (!node?.attributes.condition) {
            throw new Error("if tag must have 'condition' attribute")
        }
    
    
    
        // console.log(node?.attributes.condition)
    
        const result = evalExpression(node.attributes.condition, scope);
    
        let newScope = Object.assign({}, scope);
    
        // console.log(result)
        if (result) {
            // console.log(node.children)
            if (!node.children.length) {
                throw new Error("if tag must have a body")
            }
    
            // evalNode(node.children[0])
    
            // console.log(node.children.length)
            for (let j = 0; j < node.children.length; j++) {
                let currentNode = node.children[j];
                // console.log(currentNode) 
    
                // let siblingNode = node.children[j + 1];
                this.evalNode(currentNode, newScope);
            }
        } else {
    
            if (node.elseNode) {
                let elseNode = node.elseNode
                for (let k = 0; k < elseNode.children.length; k++) {
                    let currentNode = elseNode.children[k];
                    // console.log(currentNode) 
    
                    // let siblingNode = elseNode.children[k + 1];
                    this.evalNode(currentNode, newScope);
                }
            }
            // return;
        }
    }
    
    private evalVar(node: VarNode, scope: Scope) {
        // console.log(node)
        // validate
        // attributes c
        if (!node.attributes.id) {
            throw new Error("var tag must have attribute 'id'")
        }
    
        if (!node.attributes.val) {
            throw new Error("var tag must have attribute 'val'")
        }
    
        // IGNORE THE CHILDREN???
    
    
        if (node.attributes.val.type === "Literal") { // booleans, strings, numbers
            scope[node.attributes.id] = (node.attributes.val as parse.Literal).value;
        } else if (node.attributes.val.type === 'Identifier') {
    
            const identifierNode = node.attributes.val as parse.Identifier
            if (!scope.hasOwnProperty(identifierNode.name)) {
                throw new Error("No variable with id " + identifierNode.name);
            }
            // reassignment/ asignment of variable value
            const referenced_var_value = scope[identifierNode.name];
    
    
            scope[node.attributes.id] = referenced_var_value;
    
    
    
        } else { // might be other types i dont know
            scope[node.attributes.id] = evalExpression(node.attributes.val, scope);
        }
    
    
    
    
    
    }
    
    private evalMain(node: Node) {
    
        const GLOBAl_SCOPE: Scope = this.newScope()
        
    
        
    
    
        if (node.name !== "main") {
            throw new Error("Root node must be 'main'")
        }
    
        if (node.children.length) {
            for (let i = 0; i < node.children.length; i++) {
                const currentNode = node.children[i];
    
                // let siblingNode = node.children[i + 1];
                // // very hacky
                // if (currentNode.name === "if" && siblingNode?.name === "else") {
                //     node.children.splice(i + 1, 1);
                // }
                // top
                this.evalNode(currentNode, GLOBAl_SCOPE) // everything starts with the global scope
            }
    
            // console.log(GLOBAl_SCOPE)
        }
    
        return GLOBAl_SCOPE; // this is needed in the case of include tags
    
    }

    private newScope(): Scope {
        return {
            print: (value) => {
                console.log(value)
            }
        }
    }
}