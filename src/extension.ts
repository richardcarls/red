import { stringify } from 'querystring';
import * as vscode from 'vscode';

import { Linter, LinterRule } from './Linter';

export function activate(context: vscode.ExtensionContext) {
	console.log('red extension is now active');

  const linters: Linter[] = [];

  vscode.workspace.onDidChangeConfiguration(
    (e) => {
      if (e.affectsConfiguration('red')) {
        console.log('Configuration change detected, recreating linters..');
        createLinters();
      }
    },
    context,
    context.subscriptions,
  );

  createLinters();

  function createLinters() {
    // Dispose existing linters first
    while (linters.length) {
      linters.pop()!.dispose();
    }

    const config = vscode.workspace.getConfiguration('red');
    const rules = config.get('rules') as LinterRule[];
    
    for (let rule of rules) {
      const linter = new Linter(rule);
  
      linters.push(linter);
  
      context.subscriptions.push(linter);
  
      console.log(`created linter for rule ${rule.name}`);
    }
  }
}

export function deactivate() {}