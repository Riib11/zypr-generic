import { List, Record, RecordOf } from "immutable";
import { Cursor, makeCursor, moveDownCursor, moveUpCursor, printCursor, showCursor } from "./Cursor";
import { Expression } from "./Expression";
import { Grammar, PrintGrammar } from "./Grammar";
import { fixZipBot, Select, showSelect } from "./Selection";
import { wrap, wrapExp } from "./Zipper";

export type Mode<Meta, Rule>
  = CursorMode<Meta, Rule>
  | SelectMode<Meta, Rule>

export type CursorMode<Meta, Rule> = {
  case: 'cursor',
  cursor: Cursor<Meta, Rule>
}

export type SelectMode<Meta, Rule> = {
  case: 'select',
  select: Select<Meta, Rule>
}

export type EditorProps<Meta, Rule> = {
  grammar: Grammar<Meta, Rule>;
  printGrammar: PrintGrammar<Meta, Rule>;
  mode: Mode<Meta, Rule>;
  history: List<Editor<Meta, Rule>>
}

export type Editor<Meta, Rule> = RecordOf<EditorProps<Meta, Rule>>;

export function makeEditor<Meta, Rule>(props: EditorProps<Meta, Rule>): Editor<Meta, Rule> { return Record(props)(); }

export function printEditor<Meta, Rule>(editor: Editor<Meta, Rule>): string {
  switch (editor.mode.case) {
    case 'cursor': {
      return printCursor(editor.printGrammar, editor.mode.cursor);
    }
    case 'select': {
      return showSelect(editor.printGrammar, editor.mode.select);
    }
  }
}

export function showEditor<Meta, Rule>(editor: Editor<Meta, Rule>): string {
  switch (editor.mode.case) {
    case 'cursor': {
      return showCursor(editor.mode.cursor);
    }
    case 'select': {
      return "TODO: showEditor(editor) when editor.mode.case === 'select'";
      // return showSelect(editor.showGrammar, editor.mode.select);
    }
  }
}

export function snapshot<Meta, Rule>(editor: Editor<Meta, Rule>): Editor<Meta, Rule> {
  return editor.update('history', history => history.unshift(editor));
}

export function unselect<Meta, Rule>(editor: Editor<Meta, Rule>): Editor<Meta, Rule> {
  const editor1 = snapshot(editor);
  switch (editor1.mode.case) {
    case 'cursor': return editor;
    case 'select': {
      switch (editor1.mode.select.orient) {
        case 'top': {
          return editor1.set('mode', {
            case: 'cursor',
            cursor: {
              zip: editor1.mode.select.zipTop,
              exp: wrapExp(
                fixZipBot(editor1.mode.select.orient, editor1.mode.select.zipBot),
                editor1.mode.select.exp
              )
            } as Cursor<Meta, Rule>
          });
        }
        case 'bot': {
          return editor1.set('mode', {
            case: 'cursor',
            cursor: {
              zip: wrap(
                editor1.mode.select.zipTop,
                fixZipBot(editor1.mode.select.orient, editor1.mode.select.zipBot)),
              exp: editor1.mode.select.exp
            } as Cursor<Meta, Rule>
          });
        }
      }
    }
  }
}

export function moveUp<Meta, Rule>(editor: Editor<Meta, Rule>): Editor<Meta, Rule> {
  const editor1 = snapshot(editor);
  switch (editor1.mode.case) {
    case 'cursor': {
      const cursor = moveUpCursor(editor1.mode.cursor);
      if (cursor === undefined) return editor;
      return editor1.set('mode', { case: 'cursor', cursor });
    }
    case 'select': {
      const editor2 = unselect(editor1);
      return moveUp(editor2);
    }
  }
}

export function moveDown<Meta, Rule>(editor: Editor<Meta, Rule>): Editor<Meta, Rule> {
  const editor1 = snapshot(editor);
  switch (editor1.mode.case) {
    case 'cursor': {
      const cursor = moveDownCursor(0, editor1.mode.cursor);
      if (cursor === undefined) return editor;
      return editor1.set('mode', { case: 'cursor', cursor });
    }
    case 'select': {
      const editor2 = unselect(editor1);
      return moveDown(editor2);
    }
  }
}