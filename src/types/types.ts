export interface ParsedAttribute {
    name: string,
    value: string
}

export interface Scope {
    [key: string]: any,
}

export interface ReturnSignal {
    doesReturn: boolean // technically does not have to return a value (can be an early exit/ default value might be used)
    //return here means that it breaks the flow and returns to the upper scope
    value?: any | undefined
}

export const DEFAULT_SIGNAL: ReturnSignal = {
    doesReturn: false,
    value: undefined
}

