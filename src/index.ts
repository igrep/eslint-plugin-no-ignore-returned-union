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

import type { TSESTree, TSESLint } from "@typescript-eslint/utils";

type Options = [{ exceptions: string[] }];

const rule: TSESLint.RuleModule<string, Options> = {
  meta: {
    type: "problem",

    messages: {
      returnValueMustBeUsed:
        'The return value of "{{functionName}}" must be used.',
    },

    docs: {
      description: "Prohibit ignoring a union value returned by a function",
      recommended: "error",
      url: "https://github.com/igrep/eslint-plugin-no-ignore-return",
    },
    schema: [
      {
        type: "object",
        properties: {
          exceptions: {
            type: "array",
            items: {
              type: "string",
            },
          },
        },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [{ exceptions: [] }],
  create(context: TSESLint.RuleContext<string, Options>) {
    if (!context.parserServices?.hasFullTypeInformation) {
      return {};
    }
    const services = context.parserServices;
    return {
      CallExpression: (node: TSESTree.CallExpression) => {
        const { parent, callee } = node;
        const typeChecker = services.program.getTypeChecker();
        const typ = typeChecker.getTypeAtLocation(
          services.esTreeNodeToTSNodeMap.get(node),
        );

        const functionName =
          callee.type === "Identifier" ? callee.name : "<function>";
        if (typ.isUnion() && parent?.type === "ExpressionStatement") {
          context.report({
            messageId: "returnValueMustBeUsed",
            node,
            data: { functionName },
          });
        }
      },
    };
  },
};

export = rule;
