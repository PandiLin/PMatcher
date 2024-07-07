# pmatcher

To install this library, run:
```bash
bun install pmatcher
```

or 

```bash
npm install pmatcher
```
 # Using MatchBuilder

The `match_builder` function allows you to build and run custom pattern matchers. Here's a basic example of how to use it:

```typescript
// Example usage of match_builder
import { build , P, run_matcher } from 'pmatcher/MatchBuilder';
import { MatchDict } from 'pmatcher/MatchDict';
// Define patterns using the builder function
const matcher = match_builder(["Hello", ["John",[P.segment, "details"], "Unrelated"]]);
// Example data array
const data = ["Hello", ["John", "age:30", "location:NY", "Unrelated"]];

// Define a success callback

// Run the matcher on the data
const result = run_matcher(matcher, data, {result: (matchDict, nEaten) => {
  return {matchDict, nEaten}
}});
console.log(result);
```

output:
```
Matched Dictionary: {
  "details": ["age:30", "location:NY"]
}
Number of elements processed: 2
```


This example demonstrates how to use the `match_builder` and `run_matcher` functions to create a matcher that matches a constant string "Hello" followed by a segment containing details. The `onSuccess` callback is called when the matcher successfully matches the data, and it logs the matched dictionary and the number of elements processed.

## Using "..." Pattern

The `"..."` pattern is used to match any remaining elements in the data array. Here's an example:
```typescript
// Example usage of "..." pattern
import { build, P, run_matcher } from 'pmatcher/MatchBuilder';
import { MatchDict } from 'pmatcher/MatchDict';
// Define patterns using the builder function
const matcher = build(["start","...", [P.element, "e"]]);
// Example data array
const data = ["start", 1, 2, 3, "end"];

// Define a success callback

// Run the matcher on the data
const result = run_matcher(matcher, data, {result: (matchDict, nEaten) => {
  return {matchDict, nEaten}
}});
console.log(result);
```
output:
```
Matched Dictionary: {
  "e": "end" 
}
Number of elements processed: 5
```


## Matching Nested Array
```typescript
// Example usage of matching nested arrays with match element
import { build, P, run_matcher } from 'pmatcher/MatchBuilder';
import { MatchDict } from 'pmatcher/MatchDict';
// Define patterns using the builder function
const nestedMatcherWithElement = build(["start", [ "subStart", [P.element, "key"], "subEnd"], "end"]);
// Example data array
const nestedDataWithElement = ["start", ["subStart", "actualValue", "subEnd"], "end"];

// Define a success callback
// Run the matcher on the data
const nestedResultWithElement = run_matcher(nestedMatcherWithElement, nestedDataWithElement, {result: (matchDict, nEaten) => {
  return {matchDict, nEaten}
}});
console.log(nestedResultWithElement);
```
output:
```
Matched Dictionary: {
  "key": "actualValue"
}
Number of elements processed: 3
```



## Tail Recursion with match_letrec

The `match_letrec` function allows you to define recursive patterns. Here's an example demonstrating how to handle tail recursive patterns:

```typescript
// Example usage of match_letrec with tail recursion
import { build, P, run_matcher } from 'pmatcher/MatchBuilder';
import { emptyEnvironment, MatchEnvironment } from 'pmatcher/MatchEnvironment';
// Define recursive patterns using match_letrec
const matcher = build([P.letrec,
  [["a", [P.choose, [], [ "1", [P.ref, "b"]]]],
  ["b", [P.choose, [], [ "2", [P.ref, "a"]]]]],
  [P.ref, "a"]])
// Example data array
const data = ["1", ["2", ["1", ["2", []]]]];


const result = run_matcher(test_matcher, data, (dict, nEaten) => {
  return {dict, nEaten}
})

console.log(inspect(result, {showHidden: true, depth: 10}))

```


```
output:
{
  dict: MatchDict {
    dict: Map(2) {
      'a' => DictValue {
        referenced_definition: Map(1) {
          1 => [Function (anonymous)] { [length]: 4, [name]: '' }
        }
      },
      'b' => DictValue {
        referenced_definition: Map(1) {
          1 => [Function (anonymous)] { [length]: 4, [name]: '' }
        }
      }
    }
  },
  nEaten: 1
}

```

## The Power Of Lexical Scoping
The variable assignment in 'match_letrec' function is lexical scoped, Here is an example 
demonstrate how to use tail recursion to match complex recursive pattern such as palindrome



```typescript
const test_matcher = build([
    [P.letrec,
        [["palindrome",
        [P.new, ["x"],
            [P.choose, 
                [],
                [[P.element, "x"],
                [P.ref, "palindrome"],
                [P.element, "x"]]
            ]]]],
        [P.ref, "palindrome"]
    ]])


const result = run_matcher(test_matcher, [["a", ["b", ["c" , [], "c" ], "b"], "a"]], (env, nEaten) => {
    return {env, nEaten}
})

console.log(inspect(result, {showHidden: true, depth: 10}))
```

output:
```
{
  env: MatchDict {
    dict: Map(2) {
      'palindrome' => DictValue {
        referenced_definition: Map(1) {
          1 => [Function (anonymous)] { [length]: 4, [name]: '' }
        }
      },
      'x' => DictValue {
        referenced_definition: Map(4) { 2 => 'a', 3 => 'b', 4 => 'c', 5 => '$$$_&&&' }
      }
    }
  },
  nEaten: 1
}
```



## Detailed Explanation for MatchCallback.ts and MatchCombinator.ts in MatchBuilder.ts


In MatchBuilder.ts, we utilize functions from MatchCallback.ts and MatchCombinator.ts to construct complex pattern matchers.

1. MatchCallback.ts:
   - This module provides basic building blocks for pattern matching, including:
     - `match_constant`: Matches a specific constant value in the data array.
     - `match_element`: Matches and binds a variable to a value in the data array based on a restriction function.
     - `match_segment`: Matches a sequence of elements in the data array and binds them to a variable.
     - `match_all_other_element`: Matches all remaining elements in the data array.
     - `match_segment_independently`: Matches a segment of the data array where each element satisfies a given restriction independently(means without element or segment or all_other_element in front ).
   


   These functions return a `matcher_callback`, which is a function that takes the data array, a match dictionary, and a success callback, and either succeeds (calling the success callback) or fails (returning a match failure).

2. MatchCombinator.ts:
   - This module provides functions to combine basic matchers into more complex ones:
     - `match_array`: Takes an array of matchers and applies them sequentially to the data array.
     - `match_choose`: Takes an array of matchers and tries each one until one succeeds.

   These combinators allow for building complex matching logic by combining simpler matchers from MatchCallback.ts.

3. Usage in MatchBuilder.ts:
   - `match_builder` function uses these building blocks and combinators to construct a matcher from a pattern array. It interprets the pattern array, converts patterns to matchers using a recursive `loop` function, and combines them using `match_array` or other combinators as needed.
   - `run_matcher` function takes a matcher and data array, and executes the matcher, handling the match result.

By leveraging the functions from MatchCallback.ts and MatchCombinator.ts, MatchBuilder.ts provides a flexible and powerful way to define and execute complex matching rules on data arrays.
*/
