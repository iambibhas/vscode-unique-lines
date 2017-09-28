var vscode = require('vscode');

function activate(context) {
    var disposableKeepUnique = vscode.commands.registerTextEditorCommand('unique-lines.keepUnique', function(editor, edit) {
        run(function() {
            transformLines(editor, edit, function(lines) {
                var unique_lines = [];
                lines.forEach(function(line) {
                    if (unique_lines.indexOf(line) < 0) {
                        unique_lines.push(line);
                    }
                }, this);
                return unique_lines;
            });
        });
    });

    var disposableReverse = vscode.commands.registerTextEditorCommand('unique-lines.reverse', function(editor, edit) {
        run(function() {
            transformLines(editor, edit, function(lines) {
                return lines.slice().reverse();
            });
        });
    });

    var disposableShuffle = vscode.commands.registerTextEditorCommand('unique-lines.shuffle', function(editor, edit) {
        run(function() {
            transformLines(editor, edit, shuffleArray);
        });
    });

    context.subscriptions.push(disposableKeepUnique);
    context.subscriptions.push(disposableReverse);
    context.subscriptions.push(disposableShuffle);
}
exports.activate = activate;


// this method is called when your extension is deactivated
function deactivate() {
}
exports.deactivate = deactivate;


function run(callback) {
    try {
        callback();
    }
    catch (e) {
        console.error(e);
        throw e;
    }
}


function transformLines(editor, edit, callback) {
    var document = editor.document;
    var lineCount = document.lineCount;

    var selections = editor.selections;
    if (!selections.length) return;

    var lines = {}; // <- map of line numbers
    selections.forEach(function(selection) {

        // ignore empty lines at the beginning of selection
        for (var pos = selection.start;
            pos.line + 1 < lineCount && pos.character == document.lineAt(pos).range.end.character;
            pos = new vscode.Position(pos.line + 1, 0)) { }
        var startLine = pos.line;

        // ignore empty lines at the end of selection
        for (var pos = selection.end;
            pos.line > 0 && pos.character == 0;
            pos = document.lineAt(pos.line - 1).range.end) { }
        var endLine = pos.line;

        for (var line = startLine; line <= endLine; ++line)
            lines[line] = true;
    });

    // lines <- sorted array of line numbers
    lines = Object.keys(lines);
    if (lines.length < 2) return;
    lines = lines.map(function(line) { return parseInt(line); });
    lines.sort(function(a, b) { return a - b; });

    // lines <- sorted array of vscode ranges
    lines = lines.map(function(line) {
        return document.lineAt(line).range;
    });

    texts = lines.map(function(line) {
        return document.getText(line);
    });
    texts = callback(texts);

    for (var i = 0; i < lines.length && i < texts.length; ++i)
        edit.replace(lines[i], texts[i]);
    for (var i = texts.length; i < lines.length; ++i)
        edit.replace(lines[i], "");
    if (texts.length > lines.length) {
        var appendix = "\n" + texts.slice(lines.length).join("\n");
        edit.insert(lines[lines.length - 1].end, appendix);
    }
}


function shuffleArray(array) {
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
    return array;
}
