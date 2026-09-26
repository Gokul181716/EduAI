/**
 * Built-in CODING question generator for the Admin Assessment Studio.
 *
 * The "Auto / AI Generate" option for the Data Structures & Algorithms (Coding)
 * domain uses this module. Instead of concept MCQs it produces real coding
 * problems with:
 *   - a visible problem statement,
 *   - a sample stdin test case (shown in the student test UI),
 *   - starter code for C++ / Java / Python,
 *   - several AUTO-GENERATED HIDDEN test cases (edge cases derived from the
 *     problem spec — single element, negatives, duplicates, large inputs…).
 *
 * Hidden test cases are computed deterministically by running the reference
 * solver on each generated edge input, so they always match the schema that
 * AssessmentEvaluationService grades against (studentId, date, session style
 * unittest: sample case + every hidden case must pass).
 */

/* ------------------------------------------------------------------ *
 * Deterministic PRNG so generated tests are reproducible per seed.
 * ------------------------------------------------------------------ */
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randInt(rng, min, max) {
  return Math.floor(rng() * (max - min + 1)) + min;
}

function shuffle(rng, arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const fmt = (arr) => arr.join(' ');

/* ------------------------------------------------------------------ *
 * Reference starter-code builders. Each problem defines its own input
 * shape; the starter code reads stdin exactly like the hidden test inputs.
 * Java class must be `Main` (CodeExecutionService compiles Main.java).
 * ------------------------------------------------------------------ */
const STARTER_JAVA = (body) => `import java.util.*;
public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
${body.split('\n').map((l) => '        ' + l).join('\n')}
    }
}`;

const STARTER_CPP = (body) => `#include <bits/stdc++.h>
using namespace std;

int main() {
${body.split('\n').map((l) => '    ' + l).join('\n')}
    return 0;
}`;

const STARTER_PY = (body) => body;

/* Larger deterministic array families for hidden edge cases. */
function edgeArrays(rng) {
  const single = [randInt(rng, -50, 50)];
  const negatives = Array.from({ length: 5 }, () => randInt(rng, -100, -1));
  const duplicates = [7, 7, 7, 7, 7];
  const big = Array.from({ length: 2500 }, () => randInt(rng, -1000, 1000));
  return { single, negatives, duplicates, big };
}

/* ------------------------------------------------------------------ *
 * Problem library. Each entry:
 *   key, title, category, statement, kind
 *   sample()             -> { n?:int, arr?:[int], ... problem params } template INPUT fields
 *   inputOf(params)      -> raw STDIN string for the student program
 *   solve(params)        -> expected OUTPUT string (reference solver)
 *   hiddenInputs(rng)    -> array of parsed-params edge cases
 *   starter(java/cpp/py) -> starter code
 * ------------------------------------------------------------------ */
const PROBLEMS = [
  {
    key: 'two-sum',
    title: 'Two Sum',
    category: 'Arrays',
    description: 'Given an array of N integers arr and a target value, return the 0-based indices of the two distinct numbers that add up to target, separated by a space. If no such pair exists, print -1.',
    sample: (rng) => ({ n: 5, target: 9, arr: [2, 7, 11, 15, 3] }),
    inputOf: (p) => `${p.n} ${p.target}\n${fmt(p.arr)}`,
    solve: (p) => {
      for (let i = 0; i < p.arr.length; i++) {
        for (let j = i + 1; j < p.arr.length; j++) {
          if (p.arr[i] + p.arr[j] === p.target) return `${i} ${j}`;
        }
      }
      return '-1';
    },
    hiddenInputs: (rng) => {
      const { single, negatives, duplicates, big } = edgeArrays(rng);
      return [
        { n: 1, target: 6, arr: single },
        { n: 5, target: -3, arr: negatives },
        { n: 5, target: 14, arr: duplicates },
        { n: big.length, target: 1999, arr: big },
        { n: 4, target: 100, arr: [1, 2, 3, 4] },
      ];
    },
    starter: {
      java: STARTER_JAVA(`int n = sc.nextInt();
int target = sc.nextInt();
int[] arr = new int[n];
for (int i = 0; i < n; i++) arr[i] = sc.nextInt();

// TODO: print "i j" (space separated) for the two distinct indices
// whose values sum to target, or -1 if no such pair exists`),
      cpp: STARTER_CPP(`int n, target;
cin >> n >> target;
vector<int> arr(n);
for (int i = 0; i < n; i++) cin >> arr[i];

// TODO: print "i j" (space separated) for the two distinct indices
// whose values sum to target, or -1 if no such pair exists`),
      python: STARTER_PY(`n, target = map(int, input().split())
arr = list(map(int, input().split()))

# TODO: print "i j" (space separated) for the two distinct indices
# whose values sum to target, or -1 if no such pair exists`),
    },
  },
  {
    key: 'max-element',
    title: 'Maximum Element',
    category: 'Arrays',
    description: 'Given an array of N integers, print the largest element in the array.',
    sample: (rng) => ({ n: 5, arr: [3, -1, 7, 2, 9] }),
    inputOf: (p) => `${p.n}\n${fmt(p.arr)}`,
    solve: (p) => String(Math.max(...p.arr)),
    hiddenInputs: (rng) => {
      const { single, negatives, duplicates, big } = edgeArrays(rng);
      return [
        { n: 1, arr: single },
        { n: 5, arr: negatives },
        { n: 5, arr: duplicates },
        { n: big.length, arr: big },
      ];
    },
    starter: {
      java: STARTER_JAVA(`int n = sc.nextInt();
int[] arr = new int[n];
for (int i = 0; i < n; i++) arr[i] = sc.nextInt();

// TODO: print the largest element in arr`),
      cpp: STARTER_CPP(`int n;
cin >> n;
vector<int> arr(n);
for (int i = 0; i < n; i++) cin >> arr[i];

// TODO: print the largest element in arr`),
      python: STARTER_PY(`n = int(input())
arr = list(map(int, input().split()))

# TODO: print the largest element in arr`),
    },
  },
  {
    key: 'reverse-array',
    title: 'Reverse the Array',
    category: 'Arrays',
    description: 'Given an array of N integers, print the array in reverse order, space separated.',
    sample: (rng) => ({ n: 5, arr: [1, 2, 3, 4, 5] }),
    inputOf: (p) => `${p.n}\n${fmt(p.arr)}`,
    solve: (p) => fmt([...p.arr].reverse()),
    hiddenInputs: (rng) => {
      const { single, negatives, duplicates, big } = edgeArrays(rng);
      return [
        { n: 1, arr: single },
        { n: 5, arr: negatives },
        { n: 5, arr: duplicates },
        { n: big.length, arr: big },
      ];
    },
    starter: {
      java: STARTER_JAVA(`int n = sc.nextInt();
int[] arr = new int[n];
for (int i = 0; i < n; i++) arr[i] = sc.nextInt();

// TODO: print the array in reverse order, space separated`),
      cpp: STARTER_CPP(`int n;
cin >> n;
vector<int> arr(n);
for (int i = 0; i < n; i++) cin >> arr[i];

// TODO: print the array in reverse order, space separated`),
      python: STARTER_PY(`n = int(input())
arr = list(map(int, input().split()))

# TODO: print the array in reverse order, space separated`),
    },
  },
  {
    key: 'sort-array',
    title: 'Sort the Array',
    category: 'Sorting',
    description: 'Given an array of N integers, print them sorted in non-decreasing order, space separated.',
    sample: (rng) => ({ n: 6, sorted: false, arr: [5, 2, -1, 8, 0, 3] }),
    inputOf: (p) => `${p.n}\n${fmt(p.arr)}`,
    solve: (p) => fmt([...p.arr].sort((a, b) => a - b)),
    hiddenInputs: (rng) => {
      const { single, negatives, duplicates, big } = edgeArrays(rng);
      return [
        { n: 1, arr: single },
        { n: 5, arr: negatives },
        { n: 5, arr: duplicates },
        { n: big.length, arr: big },
      ];
    },
    starter: {
      java: STARTER_JAVA(`int n = sc.nextInt();
int[] arr = new int[n];
for (int i = 0; i < n; i++) arr[i] = sc.nextInt();

// TODO: print the array sorted in non-decreasing order, space separated`),
      cpp: STARTER_CPP(`int n;
cin >> n;
vector<int> arr(n);
for (int i = 0; i < n; i++) cin >> arr[i];

// TODO: print the array sorted in non-decreasing order, space separated`),
      python: STARTER_PY(`n = int(input())
arr = list(map(int, input().split()))

# TODO: print the array sorted in non-decreasing order, space separated`),
    },
  },
  {
    key: 'sum-of-digits',
    title: 'Sum of Digits',
    category: 'Math',
    description: 'Given a non-negative integer N, print the sum of its digits.',
    sample: (rng) => ({ num: 12345 }),
    inputOf: (p) => `${p.num}`,
    solve: (p) => String(String(p.num).split('').reduce((s, c) => s + Number(c), 0)),
    hiddenInputs: (rng) => [
      { num: 0 },
      { num: 7 },
      { num: 999999999 },
      { num: randInt(rng, 10, 9999) },
    ],
    starter: {
      java: STARTER_JAVA(`long n = sc.nextLong();

// TODO: print the sum of the digits of n`),
      cpp: STARTER_CPP(`long long n;
cin >> n;

// TODO: print the sum of the digits of n`),
      python: STARTER_PY(`n = int(input())

# TODO: print the sum of the digits of n`),
    },
  },
  {
    key: 'nth-fibonacci',
    title: 'Nth Fibonacci',
    category: 'Recursion & DP',
    description: 'Given a positive integer N (1-indexed), print the Nth Fibonacci number where F(1)=0, F(2)=1.',
    sample: (rng) => ({ num: 10 }),
    inputOf: (p) => `${p.num}`,
    solve: (p) => {
      let a = 0, b = 1;
      if (p.num === 1) return '0';
      for (let i = 2; i < p.num; i++) {
        const t = a + b;
        a = b;
        b = t;
      }
      return String(b);
    },
    hiddenInputs: (rng) => [
      { num: 1 },
      { num: 2 },
      { num: randInt(rng, 15, 40) },
      { num: 45 },
    ],
    starter: {
      java: STARTER_JAVA(`int n = sc.nextInt();

// TODO: print the Nth Fibonacci number (F(1)=0, F(2)=1)`),
      cpp: STARTER_CPP(`int n;
cin >> n;

// TODO: print the Nth Fibonacci number (F(1)=0, F(2)=1)`),
      python: STARTER_PY(`n = int(input())

# TODO: print the Nth Fibonacci number (F(1)=0, F(2)=1)`),
    },
  },
  {
    key: 'count-vowels',
    title: 'Count Vowels & Consonants',
    category: 'Strings',
    description: 'Given a single word (lowercase, letters only), print the number of vowels and consonants separated by a space.',
    sample: (rng) => ({ word: 'education' }),
    inputOf: (p) => `${p.word}`,
    solve: (p) => {
      const vowels = (p.word.match(/[aeiou]/g) || []).length;
      return `${vowels} ${p.word.length - vowels}`;
    },
    hiddenInputs: (rng) => [
      { word: 'a' },
      { word: 'b' },
      { word: 'aeiou' },
      { word: 'rhythm' },
      { word: 'programming' },
    ],
    starter: {
      java: STARTER_JAVA(`String w = sc.next();

// TODO: print "V C" where V = number of vowels, C = consonants`),
      cpp: STARTER_CPP(`string w;
cin >> w;

// TODO: print "V C" where V = number of vowels, C = consonants`),
      python: STARTER_PY(`w = input()

# TODO: print "V C" where V = number of vowels, C = consonants`),
    },
  },
  {
    key: 'reverse-string',
    title: 'Reverse a String',
    category: 'Strings',
    description: 'Given a single word, print it reversed.',
    sample: (rng) => ({ word: 'hello' }),
    inputOf: (p) => `${p.word}`,
    solve: (p) => [...p.word].reverse().join(''),
    hiddenInputs: (rng) => [
      { word: 'a' },
      { word: 'ab' },
      { word: 'racecar' },
      { word: 'abba' },
      { word: 'programming' },
    ],
    starter: {
      java: STARTER_JAVA(`String w = sc.next();

// TODO: print w reversed`),
      cpp: STARTER_CPP(`string w;
cin >> w;

// TODO: print w reversed`),
      python: STARTER_PY(`w = input()

# TODO: print w reversed`),
    },
  },
  {
    key: 'count-odd-range',
    title: 'Odd Numbers in a Range',
    category: 'Math',
    description: 'Given two integers L and R (inclusive), print the count of odd numbers between them.',
    sample: (rng) => ({ low: 1, high: 10 }),
    inputOf: (p) => `${p.low} ${p.high}`,
    solve: (p) => {
      let c = 0;
      for (let i = p.low; i <= p.high; i++) if (Math.abs(i) % 2 === 1) c++;
      return String(c);
    },
    hiddenInputs: (rng) => [
      { low: 1, high: 1 },
      { low: 2, high: 2 },
      { low: -5, high: 5 },
      { low: 1, high: 100000 },
      { low: randInt(rng, -100, -1), high: randInt(rng, 1, 100) },
    ],
    starter: {
      java: STARTER_JAVA(`long l = sc.nextLong();
long r = sc.nextLong();

// TODO: print the count of odd numbers between l and r (inclusive)`),
      cpp: STARTER_CPP(`long long l, r;
cin >> l >> r;

// TODO: print the count of odd numbers between l and r (inclusive)`),
      python: STARTER_PY(`l, r = map(int, input().split())

# TODO: print the count of odd numbers between l and r (inclusive)`),
    },
  },
];

/* Keep the sample case visually simple for students. */
function displayParams(p) {
  const params = p.sample(null);
  return { params, input: p.inputOf(params), output: p.solve(params) };
}

/**
 * Generate `count` coding questions (capped at 8) for a category.
 * Returns Question objects shaped exactly like the manual question-builder
 * state so they can be posted to /api/assessments/create directly.
 */
export function generateCodingQuestions(count, category, seed = Date.now() & 0xffff) {
  const rng = mulberry32(seed);
  const maxCount = Math.max(1, Math.min(count || 3, 8));

  let pool = PROBLEMS;
  if (category && category.toLowerCase() !== 'all topics (mixed)') {
    const wanted = category.toLowerCase();
    const byTitle = PROBLEMS.filter((p) => p.title.toLowerCase() === wanted);
    if (byTitle.length) pool = byTitle;
    else {
      const byCat = PROBLEMS.filter((p) => p.category.toLowerCase() === wanted);
      if (byCat.length) pool = byCat;
    }
  }

  const chosen = shuffle(rng, pool).slice(0, maxCount);
  return chosen.map((p) => {
    const sampleRes = displayParams(p);
    const hidden = p.hiddenInputs(rng).map((params) => ({
      input: p.inputOf(params),
      output: p.solve(params),
    }));
    return {
      text: `${p.title}\n\n${p.description}`,
      category: p.category,
      type: 'CODING',
      options: [],
      answer: '',
      testCaseInput: sampleRes.input,
      expectedOutput: sampleRes.output,
      starterCode: {
        java: p.starter.java,
        cpp: p.starter.cpp,
        python: p.starter.python,
      },
      hiddenTestCases: hidden,
    };
  });
}

export const CODING_CATEGORIES = ['All Topics (Mixed)', 'Arrays', 'Sorting', 'Strings', 'Math', 'Recursion & DP'];