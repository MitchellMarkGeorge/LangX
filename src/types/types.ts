export interface ParsedAttribute {
    name: string,
    value: string
}

export interface Scope {
    [key: string]: any,
    print: (value: any) => void;
}

export interface ReturnSignal {
    doesReturn: boolean // technically does not have to return a value (can be an early exit/ default value might be used)
    value?: any | undefined
}

export const DEFAULT_SIGNAL: ReturnSignal = {
    doesReturn: false,
    value: undefined
}

