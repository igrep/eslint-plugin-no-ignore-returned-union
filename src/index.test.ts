/*
    Copyright 2022 YAMAMOTO Yuji

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/

import * as path from "path";
import * as vitest from 'vitest';
import { RuleTester } from "@typescript-eslint/rule-tester";

import { rule } from "./index.js";

RuleTester.afterAll = vitest.afterAll;
RuleTester.it = vitest.it;
RuleTester.itOnly = vitest.it.only;
RuleTester.describe = vitest.describe;

const ruleTester = new RuleTester({
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
    project: `../tsconfig.json`,
    tsconfigRootDir: path.resolve(`${__dirname}/`),
  },
});
const filename = `${__dirname}/../src/assets/file.ts`;

ruleTester.run(
  "Prohibit ignoring a return value of a function",
  rule,
  {
    valid: [
      {
        filename,
        code: `export function ignored(): void {}
               ignored();
              `,
      },
      {
        filename,
        code: `export function ignored(): number { return 0; }
               ignored();
              `,
      },
      {
        filename,
        code: `export function notIgnored(): number { return 0; }
               const a = notIgnored();
              `,
      },
      {
        filename,
        code: `export function notIgnored(): number { return 0; }
               function otherFunction(a: number | undefined): void {}
               otherFunction(notIgnored());
              `,
      },
      {
        filename,
        code: `type Type = number | undefined;
               export function notIgnored(): Type {}
               const a = notIgnored();
              `,
      },
      {
        filename,
        code: `type Type = number | undefined;
               export function notIgnored(): Type {}
               function otherFunction(a: number | undefined): void {}
               otherFunction(notIgnored());
               [notIgnored()];
              `,
      },
      {
        filename,
        code: `type Type = number | undefined;
               const o = { ignored(): Type {} }
               const a = o.ignored();
              `,
      },
      {
        filename,
        code: `export function ignored(): Promise<void> {}
               await ignored();
              `,
      },
      {
        filename,
        code: `export function ignored(): Promise<number> { Promise.resolve(0); }
               await ignored();
              `,
      },
      {
        filename,
        code: `export function notIgnored(): Promise<number> { Promise.resolve(0); }
               const a = await notIgnored();
              `,
      },
      {
        filename,
        code: `export function notIgnored(): Promise<number> { Promise.resolve(0); }
               function otherFunction(a: number | undefined): void {}
               otherFunction(await notIgnored());
              `,
      },
      {
        filename,
        code: `type Type = number | undefined;
               export function notIgnored(): Promise<Type> {}
               const a = await notIgnored();
              `,
      },
      {
        filename,
        code: `type Type = number | undefined;
               export function notIgnored(): Promise<Type> {}
               function otherFunction(a: number | undefined): void {}
               otherFunction(await notIgnored());
               [await notIgnored()];
              `,
      },
    ],
    invalid: [
      {
        filename,
        code: `type Type = number | undefined;
               export function ignored(): Type {}
               ignored();
              `,
        errors: [
          {
            messageId: "returnValueMustBeUsed",
            data: { functionName: 'ignored' },
          },
        ],
      },
      {
        filename,
        code: `type Type = number | undefined;
               const o = { ignored(): Type {} }
               o.ignored();
              `,
        errors: [
          {
            messageId: "returnValueMustBeUsed",
            data: { functionName: 'ignored' },
          },
        ],
      },
      {
        filename,
        code: `type Type = Promise<number | undefined>;
               export function ignored(): Type {}
               await ignored();
              `,
        errors: [
          {
            messageId: "returnValueMustBeUsed",
          },
        ],
      },
    ],
  },
);
