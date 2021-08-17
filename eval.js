const { eval: evalExpression } = require("expression-eval")

let GLOBAl_SCOPE = {
    
}

let print = (value) => {
    console.log(value)
}

let BLOCK_MAP = {};
let KEYTAGS = ["main", "var", "if", "else", "print", "loop", "block", "debug"]
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
        default:
            checkBlockMap(node, scope); // scope?
            break;
    }
}

function evalDebug(node, scope) {
    // console.log(node)
    if (node.attributes.scope === "true") {
        print(scope);
    }
}

function checkBlockMap(node, scope) { 
    let blockName = node.name;
    // console.log(typeof blockName)
    // AS OF RIGHT NOW OLY BLOCKS CREATE THEIR OWN SCOPE
    if (!BLOCK_MAP.hasOwnProperty(blockName)) {
        throw new Error("Can't recognize tag or block")
    }

    let blockNode = BLOCK_MAP[blockName];

    if (blockNode) {
        // this merges the previous global scope with  a new scope
        // this alowes global variables to be used in scoped blocks
        let newScope = {}
        //Object.assign({}, scope); 
        for (let i = 0; i < blockNode.children.length; i++) {
            const currentNode = blockNode.children[i];

            // let siblingNode = node.children[i + 1];
            // // very hacky
            // if (currentNode.name === "if" && siblingNode?.name === "else") {
            //     node.children.splice(i + 1, 1);
            // }
            evalNode(currentNode, newScope);
        }

    }
}

function evalBlock(node, scope) {
    if (!node.attributes.name) {
        throw new Error("loop block must have attribute name");
    }

    if (isReserved(node.attributes.name) || scope.hasOwnProperty(node.attributes.name)) {
        throw new Error("block must have a unique name")
    }
    BLOCK_MAP[node.attributes.name] = node;

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

    print(content);
}

function evalIf(node, scope) {

    if (!node?.attributes.condition) {
        throw new Error("if tag must have 'condition' attribute")
    }



    // console.log(node?.attributes.condition)

    const result = evalExpression(node.attributes.condition, scope);
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
            evalNode(currentNode, scope);
        }
    } else {

        if (node.elseNode) {
            let elseNode = node.elseNode
            for (let k = 0; k < elseNode.children.length; k++) {
                let currentNode = elseNode.children[k];
                // console.log(currentNode) 

                // let siblingNode = elseNode.children[k + 1];
                evalNode(currentNode, scope);
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
        // reassignment
        const referenced_var_value = scope[node.attributes.val.name];


        scope[node.attributes.id] = referenced_var_value;



    } else { // might be other types i dont know
        scope[node.attributes.id] = evalExpression(node.attributes.val, scope);
    }





}

function evalMain(node) {
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

}

