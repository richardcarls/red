import * as vscode from 'vscode';

export interface LinterRule {
  name: string,
  pattern: string,
  message: string,
  severity: string,
}

export class Linter implements vscode.Disposable {
  private diagnosticCollection: vscode.DiagnosticCollection = vscode.languages.createDiagnosticCollection();
  private decorationType: vscode.TextEditorDecorationType;
  private subscriptions: vscode.Disposable[] = [];

  private name: string;
  private pattern: RegExp;
  private message: string;
  private severity: vscode.DiagnosticSeverity;

  constructor(rule: LinterRule) {
    this.name = rule.name;
    this.pattern = new RegExp(rule.pattern, 'g');
    this.message = rule.message;
    console.log(rule);
    
    let fgColor;
    let bgColor;
    if (rule.severity === 'Error') {
      this.severity = vscode.DiagnosticSeverity.Error;
      fgColor = new vscode.ThemeColor('editorError.foreground');
      bgColor = new vscode.ThemeColor('editorError.background');
    } else if (rule.severity === 'Information') {
      this.severity = vscode.DiagnosticSeverity.Information;
      fgColor = new vscode.ThemeColor('editorInfo.foreground');
      bgColor = new vscode.ThemeColor('editorInfo.background');
    } else if (rule.severity === 'Hint') {
      this.severity = vscode.DiagnosticSeverity.Hint;
      fgColor = new vscode.ThemeColor('editorHint.foreground');
      bgColor = new vscode.ThemeColor('editorHint.background');
    } else {
      this.severity = vscode.DiagnosticSeverity.Warning;
      fgColor = new vscode.ThemeColor('editorWarning.foreground');
      bgColor = new vscode.ThemeColor('editorWarning.background');
    }

    // Decorations
    this.decorationType = vscode.window.createTextEditorDecorationType({
      color: fgColor,
      borderColor: fgColor,
      backgroundColor: bgColor,
      overviewRulerColor: fgColor,

      borderWidth: '1px',
      borderStyle: 'solid',
      overviewRulerLane: vscode.OverviewRulerLane.Right,
    });

    this.subscriptions.push(this.decorationType);

    // Register event listeners
    vscode.workspace.onDidChangeTextDocument(
      () => this.lint(vscode.window.activeTextEditor),
      this,
      this.subscriptions,
    );

    vscode.window.onDidChangeActiveTextEditor(
      (textEditor) => this.lint(textEditor),
      this,
      this.subscriptions,
    );

    // Run once on create
    if (vscode.window.activeTextEditor) {
      this.lint(vscode.window.activeTextEditor);
    }
  }

  private lint(textEditor?: vscode.TextEditor) {
    if (!textEditor) { return; }

    const doc = textEditor.document;
    
    const diagnostics: vscode.Diagnostic[] = [];
    const decorationOptions: vscode.DecorationOptions[] = [];

    for (let i = 0; i < doc.lineCount; i++) {
      const line = doc.lineAt(i);

      let match;
      while((match = this.pattern.exec(line.text))) {
        const s = match[0];

        const start = new vscode.Position(i, match.index);
        const end = new vscode.Position(i, match.index + s.length);
        const range = new vscode.Range(start, end);
        const message = s.replace(new RegExp(this.pattern.source), this.message);

        diagnostics.push({
          code: this.name,
          range,
          message,
          severity: this.severity,
        });

        decorationOptions.push({
          range,
          hoverMessage: message,
        });
      }
    }

    this.diagnosticCollection.set(textEditor.document.uri, diagnostics);

    textEditor.setDecorations(this.decorationType, decorationOptions);
  }

  dispose() {
    this.diagnosticCollection.clear();
    this.diagnosticCollection.dispose();

    vscode.Disposable.from(...this.subscriptions).dispose();
  }
}