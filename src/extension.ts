import * as vscode from "vscode";
import { categories } from "./data/categories";


export function activate(context: vscode.ExtensionContext) {
  let disposable = vscode.commands.registerCommand(
    "css-structure-plus.formatCSS",
    () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage("No editor found!");
        return;
      }

      const document = editor.document;
      const selection = editor.selection;

      const text = document.getText(selection.isEmpty ? undefined : selection);

      const formattedCSS = formatCSS(text);

      editor.edit((editBuilder) => {
        editBuilder.replace(
          selection.isEmpty
            ? new vscode.Range(0, 0, document.lineCount, 0)
            : selection,
          formattedCSS
        );
      });

      vscode.window.showInformationMessage(
        "CSS has been formatted successfully!"
      );
    }
  );

  context.subscriptions.push(disposable);
}

function formatCSS(css: string): string {
  // - Split CSS into blocks based on selectors
  const blocks = css
    .split(/(?<=\})/)
    .map((block) => block.trim())
    .filter((block) => block.length > 0);

  const formattedBlocks = blocks.map((block) => {
    // - Extract the selector & properties
    const selectorMatch = block.match(/^([^{]+)\{/);
    if (!selectorMatch) return {block}; // Skip if no selector found

    const selector = selectorMatch[1].trim();
    const propertiesBlock = block
      .slice(selectorMatch[0].length, block.lastIndexOf("}"))
      .trim();

    // - Split properties into (key-value pairs)
    const properties = propertiesBlock
      .split(";")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    // - Categorize properties
    const categorized: { [key: string]: string[] } = {
      "/* Layout */": [],
      "/* Spacing */": [],
      "/* Typography */": [],
      "/* Colors */": [],
      "/* Transitions */": [],
      "/* Animations */": [],
      "/* Miscellaneous */": [],
    };

    properties.forEach((property) => {
      const [key] = property.split(":").map((part) => part.trim());
      let categoryFound = false;

      // - Categorize 
      for (const category in categories) {
        if (categories.hasOwnProperty(category)) {
          if (categories[category as keyof typeof categories].includes(key)) {
            categorized[`/* ${category} */`].push(property);
            categoryFound = true;
            break;
          }
        }
      }

      if (!categoryFound) {
        categorized["/* Miscellaneous */"].push(property);
      }
    });

    // - Format categorized properties
    const formattedProperties = Object.entries(categorized)
      .map(([category, props]) =>
        props.length > 0
          ? `    ${category}\n        ${props.join(";\n        ")};`
          : ""
      )
      .filter((section) => section.trim().length > 0)
      .join("\n\n");

    return `${selector} {\n${formattedProperties}\n}`;
  });

  return formattedBlocks.join("\n\n");
}

export function deactivate() {}
