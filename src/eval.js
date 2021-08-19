const { eval: evalExpression } = require("expression-eval")
const { KEYTAGS } = require("./constants")


function isReserved(word) {
    return KEYTAGS.includes(word);
}
module.exports = evalMain

function evalNode(node, scope) {
    // console.log(scope);
    switch (node.name) {
        // Attributes cant be empty
        // some tags need their sibling nodes
        // this is a tempoary solition
        // idealy, all needed siblings should be grouped into a single node
        case "main":
            throw new Error("There can only be one 'main' tag")
        case "var":
            evalVar(node, scope)
            break;

        case "if":
            evalIf(node, scope);
            break;

        case "else":
            // all else tags should be coupled with their appropiate is statements
            throw new Error("Misplaced else tag");

        case "print":
            evalPrint(node, scope);
            break;

        case "loop":
            evalLoop(node, scope);
            break;

        case "block":
            // console.log(node.children)
            evalBlock(node, scope);
            break;

        case "debug":
            evalDebug(node, scope);
            break;

        case "function":
            // console.log(node);
            // funtions are a type of block
            // differences
            //1) inherit scope
            //2) can receive params
            //3) can return results
            evalFunction(node, scope);
            break;
        default:
            checkScopeForBlock(node, scope); // scope?
            break;
    }
}



function evalFunction(node, scope) {

    if (!node.attributes.id) {
        throw new Error("function must have attribute name");
    }

    if (isReserved(node.attributes.id) || scope.hasOwnProperty(node.attributes.id)) {
        throw new Error("function must have a unique name")
    }
    scope[node.attributes.id] = node;


    // console.log(scope)
    // let params = node.attributes.params;

    // params = params.trim().split(/[\s,]+/);
    // console.log(params);
}

function evalDebug(node, scope) {

    // console.log(node)
    if (node.attributes.scope === "true") {
        print(scope);
    }
}

function checkScopeForBlock(node, scope) {
    
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
            let params = {};
            // gets the params from the callee
            Object.keys(node.attributes).forEach((key) => {
                let value = node.attributes[key];
                params[key] = evalExpression(value);
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
                evalNode(currentNode, newScope);
            }
         
        } else {
            let newScope = {}
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
                evalNode(currentNode, newScope);
            }
        }







    }
}

function evalBlock(node, scope) {
    // should blocks use name instead of id?
    if (!node.attributes.id) {
        throw new Error("block must have attribute name");
    }

    if (isReserved(node.attributes.id) || scope.hasOwnProperty(node.attributes.id)) {
        throw new Error("block must have a unique name")
    }
    scope[node.attributes.id] = node;

    // console.log(node)
}
function evalLoop(node, scope) {
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
            evalNode(childNode, newScope)
        }
    }

    // delete scope[node.attributes.index] // so it dosent leak to other places
    // this is better handles with scope
    // scope will then be deleted
}



function evalPrint(node, scope) {
    if (!node.attributes.content) {
        throw new Error("No content provided")
    }

    const content = evalExpression(node.attributes.content, scope);

    scope.print(content);
}

function evalIf(node, scope) {

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
            evalNode(currentNode, newScope);
        }
    } else {

        if (node.elseNode) {
            let elseNode = node.elseNode
            for (let k = 0; k < elseNode.children.length; k++) {
                let currentNode = elseNode.children[k];
                // console.log(currentNode) 

                // let siblingNode = elseNode.children[k + 1];
                evalNode(currentNode, newScope);
            }
        }
        // return;
    }
}

function evalVar(node, scope) {
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
        scope[node.attributes.id] = node.attributes.val.value;
    } else if (node.attributes.val.type === 'Identifier') {


        if (!scope.hasOwnProperty(node.attributes.val.name)) {
            throw new Error("No variable with id " + node.attributes.val.name);
        }
        // reassignment/ asignment of variable value
        const referenced_var_value = scope[node.attributes.val.name];


        scope[node.attributes.id] = referenced_var_value;



    } else { // might be other types i dont know
        scope[node.attributes.id] = evalExpression(node.attributes.val, scope);
    }





}

function evalMain(node) {

    const GLOBAl_SCOPE = {};

    GLOBAl_SCOPE.print = (value) => {
        console.log(value)
    }


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
            evalNode(currentNode, GLOBAl_SCOPE) // everything starts with the global scope
        }

        // console.log(GLOBAl_SCOPE)
    }

    return GLOBAl_SCOPE; // this is needed in the case of include tags

}

