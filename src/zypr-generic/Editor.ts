import { List, Record, RecordOf } from "immutable";
import { Cursor, makeCursor, moveDownCursor, moveLeftCursor, moveRightCursor, moveUpCursor, printCursor, showCursor } from "./Cursor";
import { Expression, printExpression } from "./Expression";
import { Grammar, GrammarPrinter } from "./Grammar";
import { fixZipBot, Select, showSelect } from "./Selection";
import { printZipper, wrap, wrapExp } from "./Zipper";

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
  grammar: Grammar<Meta, Rule>,
  grammarPrinter: GrammarPrinter<Meta, Rule>,
  mode: Mode<Meta, Rule>
}

export type Editor<Meta, Rule> = RecordOf<EditorProps<Meta, Rule>>;

export function makeEditor<Meta, Rule>(props: EditorProps<Meta, Rule>): Editor<Meta, Rule> { return Record(props)(); }

export function printEditor<Meta, Rule>(editor: Editor<Meta, Rule>): string {
  switch (editor.mode.case) {
    case 'cursor': {
      return printCursor(editor.grammarPrinter, editor.mode.cursor);
    }
    case 'select': {
      return showSelect(editor.grammarPrinter, editor.mode.select);
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

export function unselect<Meta, Rule>(editor: Editor<Meta, Rule>): Editor<Meta, Rule> {
  switch (editor.mode.case) {
    case 'cursor': return editor;
    case 'select': {
      switch (editor.mode.select.orient) {
        case 'top': {
          return editor.set('mode', {
            case: 'cursor',
            cursor: {
              zip: editor.mode.select.zipTop,
              exp: wrapExp(
                fixZipBot(editor.mode.select.orient, editor.mode.select.zipBot),
                editor.mode.select.exp
              )
            } as Cursor<Meta, Rule>
          });
        }
        case 'bot': {
          return editor.set('mode', {
            case: 'cursor',
            cursor: {
              zip: wrap(
                editor.mode.select.zipTop,
                fixZipBot(editor.mode.select.orient, editor.mode.select.zipBot)),
              exp: editor.mode.select.exp
            } as Cursor<Meta, Rule>
          });
        }
      }
    }
  }
}

export function moveUp<Meta, Rule>(editor: Editor<Meta, Rule>): Editor<Meta, Rule> | undefined {
  switch (editor.mode.case) {
    case 'cursor': {
      const cursor = moveUpCursor(editor.mode.cursor);
      if (cursor === undefined) return undefined;
      return editor.set('mode', { case: 'cursor', cursor });
    }
    case 'select': {
      return moveUp(unselect(editor));
    }
  }
}

export function moveDown<Meta, Rule>(editor: Editor<Meta, Rule>): Editor<Meta, Rule> | undefined {
  switch (editor.mode.case) {
    case 'cursor': {
      const cursor = moveDownCursor(0, editor.mode.cursor);
      if (cursor === undefined) return undefined;
      return editor.set('mode', { case: 'cursor', cursor });
    }
    case 'select': {
      return moveDown(unselect(editor));
    }
  }
}

export function moveLeft<Meta, Rule>(editor: Editor<Meta, Rule>): Editor<Meta, Rule> | undefined {
  switch (editor.mode.case) {
    case 'cursor': {
      const cursor = moveLeftCursor(editor.mode.cursor);
      if (cursor === undefined) return undefined;
      return editor.set('mode', { case: 'cursor', cursor });
    }
    case 'select': {
      return moveLeft(unselect(editor));
    }
  }
}

export function moveRight<Meta, Rule>(editor: Editor<Meta, Rule>): Editor<Meta, Rule> | undefined {
  switch (editor.mode.case) {
    case 'cursor': {
      const cursor = moveRightCursor(editor.mode.cursor);
      if (cursor === undefined) return undefined;
      return editor.set('mode', { case: 'cursor', cursor });
    }
    case 'select': {
      return moveRight(unselect(editor));
    }
  }
}
