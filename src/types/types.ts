export interface ParsedAttribute {
    name: string,
    value: string
}

export interface Scope {
    [key: string]: any,
    print: (value: any) => void;
}


