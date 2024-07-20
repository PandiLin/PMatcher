import type { matcher_callback, matcher_instance } from "../MatchCallback";
import type { MatchFailure } from "../MatchResult/MatchFailure";

export type MatchPartialSuccess = {
    succeedMatchers: matcher_instance[];
    succeedCount: number;
    results: any[];
    failure: MatchFailure | null;
}

export function isMatchPartialSuccess(x: any) : boolean{
    return x && typeof x === "object" && "succeedMatchers" in x && "succeedCount" in x && "results" in x && "failure" in x
}

export function createMatchPartialSuccess(succeedMatchers: matcher_instance[], succeedCount: number, results: any[], failure: MatchFailure | null) : MatchPartialSuccess{
    return {succeedMatchers, succeedCount, results, failure}
}

export function getSucceedMatchers(partialSuccess: MatchPartialSuccess) : matcher_instance[]{
    return partialSuccess.succeedMatchers
}

export function getSucceedMatchersNames(partialSuccess: MatchPartialSuccess) : string[]{
    return partialSuccess.succeedMatchers.map(matcher => matcher.name)
}

export function getSucceedCount(partialSuccess: MatchPartialSuccess) : number{
    return partialSuccess.succeedCount
}

export function getResults(partialSuccess: MatchPartialSuccess) : any[]{
    return partialSuccess.results
}