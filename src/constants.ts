

export const KEYTAGS = ["main", "var", "if", "else", "print", "loop", "block", "debug", "function", "include", "return"];

export const EXPRESSION_ATTRIBUTES = ["condition", "val" ,"content", "count"];

export function isExpressionAttribute(attrName: string) {
    return EXPRESSION_ATTRIBUTES.includes(attrName);
}

export function isKeyTag(tagName: string) {
    return KEYTAGS.includes(tagName);
}