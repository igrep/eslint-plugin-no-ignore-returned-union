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

import * as path from "node:path";
import { createRequire } from "node:module";

import type { TSESTree, TSESLint } from "@typescript-eslint/utils";
import { ESLintUtils } from "@typescript-eslint/utils";
import { Type, TypeReference } from "typescript";

const createRule = ESLintUtils.RuleCreator(
  () => "https://github.com/igrep/eslint-plugin-no-ignore-returned-union"
);

const require = createRequire(import.meta.url);
const version = require("../package.json").version;

export default {
  meta: {
    name: "eslint-plugin-no-ignore-returned-union",
    version,
  },
  rules: {
    "no-ignore-returned-union": createRule({
      name: "no-ignore-returned-union",
      meta: {
        type: "problem",

        messages: {
          returnValueMustBeUsed:
          'The return value of "{{functionName}}" must be used.',
        },

        docs: {
          description: "Prohibit ignoring a union value returned by a function",
        },
        schema: [],
      },
      defaultOptions: [],
      create(context: TSESLint.RuleContext<string, unknown[]>) {
        const services = ESLintUtils.getParserServices(context);
        if (services.program == null) {
          console.warn(
            "eslint-plugin-no-ignore-returned-union: Type checker disabled. See the document of the @typescript-eslint/eslint-plugin package.",
          );
          return {};
        }
        return {
          CallExpression: (node: TSESTree.CallExpression) => {
            const { parent, callee } = node;
            const typeChecker = services.program.getTypeChecker();
            const typ = typeChecker.getTypeAtLocation(
              services.esTreeNodeToTSNodeMap.get(node)
            );

            const functionName = resolveFunctionName(callee, context.sourceCode);
            if (typ.isUnion() && parent?.type === "ExpressionStatement") {
              context.report({
                messageId: "returnValueMustBeUsed",
                node,
                data: { functionName },
              });
            } else if (isPromise(typ) && parent?.type === "AwaitExpression") {
              const { parent: parent2 } = parent;
              const [typArg] = typeChecker.getTypeArguments(typ as TypeReference);
              if (typArg?.isUnion() && parent2?.type === "ExpressionStatement") {
                context.report({
                  messageId: "returnValueMustBeUsed",
                  node,
                  data: { functionName },
                });
              }
            }
          },
        };
      },
    }),
  },
};

function resolveFunctionName(
  callee: TSESTree.Expression,
  sourceCode: TSESLint.SourceCode,
): string {
  switch (callee.type) {
    case "Identifier":
      return callee.name;
    case "MemberExpression":
      return sourceCode.getText(callee.property);
    default:
      return "<function>";
  }
}

function isPromise(typ: Type): boolean {
  const sym = typ.getSymbol();
  if (!sym) {
    return false;
  }
  if (sym.getName() !== "Promise") {
    return false;
  }
  const p = sym.getDeclarations()?.[0]?.getSourceFile()?.fileName;
  if (!p) {
    return false;
  }
  if (path.basename(p) !== "lib.es5.d.ts") {
    return false;
  }

  return true;
}
