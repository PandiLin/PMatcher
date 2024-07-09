import type { matcher_callback } from "./MatchCallback";
import { MatchDict } from "./MatchDict/MatchDict";
import { match_constant, match_element, match_empty, match_segment } from "./MatchCallback";
import {  match_choose, match_letrec, match_reference, match_new_var, match_compose } from "./MatchCombinator";
import { empty_match_dict } from "./MatchDict/MatchDict";
import { first, rest, isPair, isEmptyArray, isArray, isString, isMatcher } from "./utility";
import  { match_array } from "./MatchCombinator";
import { inspect } from "util";
import type { MatchFailure } from "./MatchResult";
import { match_all_other_element } from "./MatchCallback";

import { define_generic_procedure_handler } from "generic-handler/GenericProcedure";

import { construct_simple_generic_procedure } from "generic-handler/GenericProcedure";
import { default_match_env } from "./MatchEnvironment";


export const build = construct_simple_generic_procedure("build", 1,
    (matchers: any[]) => {
        throw Error(`unrecognized pattern in the build procedure: ${inspect(matchers)}`)
    }
)



export const enum P { // Stands for Pattern
    letrec = "$.letrec.$", 
    choose = "$.choose.$", 
    new = "$.new.$", 
    element = "$.element.$",
    segment = "$.segment.$",
    ref = "$.ref.$",
    constant = "$.constant.$",
    repeated = "$.repeated.$",
    compose = "$.compose.$",
    empty = "$.empty.$"
}



define_generic_procedure_handler(build, 
    (pattern: any[]) => isArray(pattern),
    (pattern: any[]) => {
        return match_array(pattern.map((item: any) => build(item)))
    }
)


define_generic_procedure_handler(build,
    (pattern: any) => is_match_constant(pattern),
    (pattern: any) => {
        if ((isPair(pattern)) && (pattern.length == 2)){
            return match_constant(pattern[1])
        }
        else if (isString(pattern)){
            return match_constant(pattern)
        }
        else{
            throw Error(`unrecognized constant pattern in the build procedure: ${inspect(pattern)}`)
        }
    }
)

// define_generic_procedure_handler(build, 
//     (pattern: any[]) => is_match_repeated_pattern(pattern),
//     (pattern: any[]) => {
//         console.log("matched")
//         if (pattern.length !== 2) {
//             throw Error(`unrecognized pattern in the repeated procedure: ${inspect(pattern)}`)
//         }
//         const built_pattern = build(pattern[1])
//         console.log("build(pattern[1])", built_pattern.toString() )
//         return match_repeated_patterns(built_pattern)
//     }
// )


export function is_match_constant(pattern: any): boolean {
    return first_equal_with(pattern, P.constant) || isString(pattern)
}

export function first_equal_with(pattern: any, value: any): boolean {
    return isPair(pattern) && isString(first(pattern)) && first(pattern) === value
}



function is_all_other_element(pattern: any): boolean {
    return isString(pattern) && pattern === "..."
}

define_generic_procedure_handler(build, 
    (pattern: any[]) => is_all_other_element(pattern),
    (pattern: any[]) => {
        return match_all_other_element()
    }
)


function is_empty(pattern: any): boolean{
    return  pattern === P.empty
}

define_generic_procedure_handler(build,
    (pattern: any) => is_empty(pattern),
    (pattern: any) => {
        return match_empty()
    }
)


export function is_Letrec(pattern: any): boolean {
    return first_equal_with(pattern, P.letrec)
}

define_generic_procedure_handler(build, 
    (pattern: any[]) => is_Letrec(pattern),
    (pattern: any[]) => {
        if (pattern.length !== 3) {
            throw Error(`unrecognized pattern in the letrec procedure: ${inspect(pattern)}`)
        }

        const bindings = pattern[1].map((item: any[]) => ({ key: item[0], value: build(item[1]) }));

        return match_letrec(bindings, build(pattern[2]))
    }
)


export function is_compose(pattern: any[]): boolean{
    return first_equal_with(pattern, P.compose) && pattern.length == 2
}

define_generic_procedure_handler(build,
    (pattern: any[]) => is_compose(pattern),
    (pattern: any[]) => {
        return match_compose(pattern[1].map((item: any) => build(item)))
    }
)





export function is_select(pattern: any): boolean {
    return first_equal_with(pattern, P.choose)
}

define_generic_procedure_handler(build, 
    (pattern: any[]) => is_select(pattern),
    (pattern: any[]) => {
        return match_choose(pattern.slice(1).map((item: any) => build(item)))
    }
)


export function is_new_var(pattern: any): boolean {
    return first_equal_with(pattern, P.new)
}

define_generic_procedure_handler(build, 
    (pattern: any[]) => is_new_var(pattern),
    (pattern: any[]) => {
        return match_new_var(pattern[1], build(pattern[2]))
    }
)


function is_match_element(pattern: any): boolean {
   return first_equal_with(pattern, P.element)
}

define_generic_procedure_handler(build, 
    (pattern: any[]) => is_match_element(pattern),
    (pattern: any[]) => {
        return match_element(pattern[1], pattern[2])
    }
)


function is_match_segment(pattern: any): boolean {
    return first_equal_with(pattern, P.segment)
}

define_generic_procedure_handler(build, 
    (pattern: any[]) => is_match_segment(pattern),
    (pattern: any[]) => {
        return match_segment(pattern[1], pattern[2])
    }
)


export function is_match_reference(pattern: any): boolean {

    return first_equal_with(pattern, P.ref)
}

define_generic_procedure_handler(build, 
    (pattern: any[]) => is_match_reference(pattern),
    (pattern: any[]) => {
        return match_reference(pattern[1])
    }
)

function is_match_repeated_pattern(pattern: any): boolean {
    return first_equal_with(pattern, P.repeated)
}



export function run_matcher(matcher: matcher_callback, data: any[], succeed: (dict: MatchDict, nEaten: number) => any): MatchDict | MatchFailure {

    return matcher([data], empty_match_dict(), default_match_env(), (dict, nEaten) => {
        return succeed(dict, nEaten)
    })
}

// const match_builder_test = build(["new", [P.element, "x"], "...", "sep", [P.segment, "seg"]]) 
                                        


// const result = run_matcher(match_builder_test, ["new", "c", "a", "b", "sep", "segabcdefg"], (environment, nEaten) => {
// })


// const test_matcher = build([P.letrec,
//     [["a", [P.choose, [], [ "1", [P.ref, "b"]]]],
//     ["b", [P.choose, [], [ "2", [P.ref, "a"]]]]],
//     [P.ref, "a"]]
// )
//   // Example data array

//   const data = ["1", ["2", ["1", ["2", []]]]];
  
//   const result = run_matcher(test_matcher, data, (dict, nEaten) => {
//     return {dict, nEaten}
//   })

//   console.log(inspect(result, {showHidden: true, depth: 10}))

// const test_matcher = build([
//     [P.letrec,
//         [["palindrome",
//         [P.new, ["x"],
//             [P.choose, 
//                 [],
//                 [[P.element, "x"],
//                 [P.ref, "palindrome"],
//                 [P.element, "x"]]
//             ]]]],
//         [P.ref, "palindrome"]
//     ]])


// const result = run_matcher(test_matcher, [["a", ["b", ["c" , [], "c" ], "b"], "a"]], (env, nEaten) => {
//     return {env, nEaten}
// })

// console.log(inspect(result, {showHidden: true, depth: 10}))


// const t = build(P.empty)

// const r = run_matcher(t, ["a"], (dict, e) => {return dict})
// console.log(r)

const t = build(
    [P.letrec,
        [["repeat", 
            [P.new, ["x"],
                [P.choose,
                    P.empty,
                    [P.compose,
                        [[P.constant, "a"],
                        [P.element, "x"],
                         [P.ref, "repeat"]]]]]]],
        [[P.ref, "repeat"]]])

const r = run_matcher(t, ["a", "b", "a", "d"], (dict, e) => {return dict})


console.log(inspect(r, {showHidden: true}))
// const t = build(
//     ["a", [P.choose,"c",  P.empty],  "a"]
// )

// const r = run_matcher(t, ["a","c", "a"], (dict, e) => {return dict})


// const t = build(
//     [P.letrec,
//         [["repeat", 
//             [P.new, ["x"],
//                 [P.choose,
//                     P.empty,
//                     "c",
//                     [P.compose,
//                         [[P.element, "x"],
//                         [P.ref, "repeat"],
//                         [P.element, "x"]]],
//                      ]]]],
//         [[P.ref, "repeat"]]])

// const r = run_matcher(t, ["a", "b", "c", "b", "a"], (dict, e) => {return dict})

// console.log(r)

// console.log("r=" + inspect(r, {showHidden: true, depth:40}))

// const t = build([P.compose, [[P.constant, "a"], [P.constant, "a"], ["b", "b"] ]] )

// const r = run_matcher(t, ["a", "a", ["b", "b"]], (dict: MatchDict, eaten: number) => {
//     return dict
// })
