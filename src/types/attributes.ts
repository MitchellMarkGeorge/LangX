import { parse } from "expression-eval";


export interface Attributes {
    [key: string] : any 
}

export interface InputAttributes extends Attributes {
    content: parse.Expression;
}

export interface VarAttributes extends Attributes {
    id: string,
    val: parse.Expression
}

export interface IfAttributes extends Attributes {
    condition: parse.Expression;
}

export interface PrintAttributes extends Attributes {
    content: parse.Expression;
}

export interface LoopAttributes extends Attributes {
    index: string
    count: parse.Expression
}

export interface BlockAttributes extends Attributes {
    id: string
}

export interface FunctionAttributes extends BlockAttributes {
    params: string;
}

export interface DebugAttributes extends Attributes {
    scope: string;
}

export interface IncludeAttributes extends Attributes {
    from: string;
}

export interface ExportAttributes extends Attributes {
    namespace: string;
}