import { guard } from "../utility";
import { construct_simple_generic_procedure, define_generic_procedure_handler } from "generic-handler/GenericProcedure";
import {  inspect } from "bun";
import { get_value, extend } from "./DictInterface";
export type ScopeReference = Number;

export function is_scope_reference(ref: any): boolean{
    return typeof ref === "number"
}




export class DictValue{
    referenced_definition: Map<ScopeReference, any>

    constructor(){
        this.referenced_definition = new Map()
    }
}

export function is_dict_value(item: any): boolean{
    return item instanceof DictValue
}

export function empty_dict_value(): DictValue{
    return new DictValue
}

export function has_default_value(value: DictValue): boolean{
    return value.referenced_definition.size >= 1 && value.referenced_definition.has(0)
}

export function is_empty_dict_value(value: DictValue): boolean{
    return value.referenced_definition.size === 0
}

export function get_default_value(value: DictValue): any{
    if (has_default_value(value)){
        return value.referenced_definition.get(0)
    }
    else{
        throw Error("attempt to get default value from empty, v:" + value)
    }
}

export function construct_dict_value(num: ScopeReference, value: any): DictValue {
    const dict_item = empty_dict_value()
    dict_item.referenced_definition.set(num, value)
    return dict_item
}

export function has_multi_scope_definition(item: DictValue): boolean {
    return item.referenced_definition.size > 1;
}

export function has_scope_reference(ref: ScopeReference, item: DictValue): boolean{
    return item.referenced_definition.has(ref)
}

define_generic_procedure_handler(get_value,
    (A: any, B: any) => {
        return is_scope_reference(A) && is_dict_value(B)
    },
    (scope_ref: ScopeReference, value: DictValue) => {
        guard(() => {return has_scope_reference(scope_ref, value)},() => {
            throw Error("scope reference not existed in scope item, scope_ref: " + scope_ref + " dict: " + value)
        })

        return value.referenced_definition.get(scope_ref)
    }
)


define_generic_procedure_handler(extend,
    // extending default value
    (A: any, B: any) => {
        return is_dict_value(B)
    },
    (default_value: any, item: DictValue) => {
        guard(() => {return has_default_value(item)}, () => {
            throw Error("error! dict item already has a default value")
        })
            
        return extend({value: default_value, scopeRef: 0}, item)
    }
)

/// expected: Tuple (value: any, scopeRef: scopleReference)
export type NestedValue = {
    value: any,
    scopeRef: ScopeReference
}

function is_nested_value(A: any): A is NestedValue {
    return typeof A === 'object' 
        && A !== null 
        && 'value' in A 
        && 'scopeRef' in A 
        && is_scope_reference(A.scopeRef);
}


define_generic_procedure_handler(extend, 
    (A: any, B: any) => {
        return is_nested_value(A) && is_dict_value(B)
    },
    (nested_value: NestedValue, item: DictValue) => {
        item.referenced_definition.set(nested_value.scopeRef, nested_value.value)
        return item
    }
)

