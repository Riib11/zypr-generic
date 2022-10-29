import { List, Record, RecordOf } from "immutable";
import { Cursor, makeCursor, moveDownCursor, moveLeftCursor, moveRightCursor, moveUpCursor, printCursor } from "./Cursor";
import { Grammar, GrammarPrinter } from "./Grammar";
import { fixZipBot, moveDownSelect, moveLeftSelect, moveRightSelect, moveUpSelect, Select, printSelect, SelectOrientation, makeSelect } from "./Selection";
import { wrapExp } from "./Zipper";

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
      return printCursor(editor.grammarPrinter, editor.mode.cursor).str;
    }
    case 'select': {
      return printSelect(editor.grammarPrinter, editor.mode.select).str;
    }
  }
}

// export function showEditor<Meta, Rule>(editor: Editor<Meta, Rule>): string {
//   switch (editor.mode.case) {
//     case 'cursor': {
//       return showCursor(editor.mode.cursor);
//     }
//     case 'select': {
//       // return printSelect(editor.mode.select);
//       throw new Error("TODO: showEditor");

//     }
//   }
// }

export function escapeSelect<Meta, Rule>(editor: Editor<Meta, Rule>): Editor<Meta, Rule> {
  switch (editor.mode.case) {
    case 'cursor': return editor;
    case 'select': {
      switch (editor.mode.select.orient) {
        case 'top': {
          return editor.set('mode', {
            case: 'cursor',
            cursor: makeCursor({
              zip: editor.mode.select.zipTop.concat(
                fixZipBot(editor.mode.select.orient, editor.mode.select.zipBot)),
              exp: editor.mode.select.exp
            })
          });
        }
        case 'bot': {
          return editor.set('mode', {
            case: 'cursor',
            cursor: makeCursor({
              zip: editor.mode.select.zipTop,
              exp:
                wrapExp(
                  fixZipBot(editor.mode.select.orient, editor.mode.select.zipBot),
                  editor.mode.select.exp)
            })
          });
        }
      }
    }
  }
}
export function enterSelect<Meta, Rule>(editor: Editor<Meta, Rule>, orient: SelectOrientation): Editor<Meta, Rule> | undefined {
  switch (editor.mode.case) {
    case 'cursor': {
      return editor.set('mode', {
        case: 'select',
        select: makeSelect({
          zipTop: editor.mode.cursor.zip,
          zipBot: List(),
          exp: editor.mode.cursor.exp,
          orient
        })
      });
    }
    case 'select': return editor;
  }
}

export function moveEditorCursorUp<Meta, Rule>(editor: Editor<Meta, Rule>): Editor<Meta, Rule> | undefined {
  switch (editor.mode.case) {
    case 'cursor': {
      const cursor = moveUpCursor(editor.mode.cursor);
      if (cursor === undefined) return undefined;
      return editor.set('mode', { case: 'cursor', cursor });
    }
    case 'select': {
      return moveEditorCursorUp(escapeSelect(editor));
    }
  }
}

export function moveEditorCursorDown<Meta, Rule>(editor: Editor<Meta, Rule>): Editor<Meta, Rule> | undefined {
  switch (editor.mode.case) {
    case 'cursor': {
      const cursor = moveDownCursor(0, editor.mode.cursor);
      if (cursor === undefined) return undefined;
      return editor.set('mode', { case: 'cursor', cursor });
    }
    case 'select': {
      return moveEditorCursorDown(escapeSelect(editor));
    }
  }
}

export function moveEditorCursorLeft<Meta, Rule>(editor: Editor<Meta, Rule>): Editor<Meta, Rule> | undefined {
  switch (editor.mode.case) {
    case 'cursor': {
      const cursor = moveLeftCursor(editor.mode.cursor);
      if (cursor === undefined) return undefined;
      return editor.set('mode', { case: 'cursor', cursor });
    }
    case 'select': {
      return moveEditorCursorLeft(escapeSelect(editor));
    }
  }
}

export function moveEditorCursorRight<Meta, Rule>(editor: Editor<Meta, Rule>): Editor<Meta, Rule> | undefined {
  switch (editor.mode.case) {
    case 'cursor': {
      const cursor = moveRightCursor(editor.mode.cursor);
      if (cursor === undefined) return undefined;
      return editor.set('mode', { case: 'cursor', cursor });
    }
    case 'select': {
      return moveEditorCursorRight(escapeSelect(editor));
    }
  }
}

export function fixSelect<Meta, Rule>(editor: Editor<Meta, Rule>): Editor<Meta, Rule> {
  switch (editor.mode.case) {
    case 'cursor': return editor;
    case 'select': {
      if (editor.mode.select.zipBot.isEmpty()) {
        return escapeSelect(editor);
      } else {
        return editor;
      }
    }
  }
}

export function moveEditorSelectUp<Meta, Rule>(editor: Editor<Meta, Rule>): Editor<Meta, Rule> | undefined {
  switch (editor.mode.case) {
    case 'cursor': {
      const editor1 = enterSelect(editor, 'top');
      if (editor1 === undefined) return undefined;
      return moveEditorSelectUp(editor1);
    }
    case 'select': {
      const select = moveUpSelect(editor.mode.select);
      if (select === undefined) return undefined;
      return fixSelect(editor.set('mode', { case: 'select', select }));
    }
  }
}

export function moveEditorSelectDown<Meta, Rule>(editor: Editor<Meta, Rule>): Editor<Meta, Rule> | undefined {
  switch (editor.mode.case) {
    case 'cursor': {
      const editor1 = enterSelect(editor, 'bot');
      if (editor1 === undefined) return undefined;
      return moveEditorSelectDown(editor1);
    }
    case 'select': {
      const select = moveDownSelect(0, editor.mode.select);
      if (select === undefined) return undefined;
      return fixSelect(editor.set('mode', { case: 'select', select }));
    }
  }
}

export function moveEditorSelectLeft<Meta, Rule>(editor: Editor<Meta, Rule>): Editor<Meta, Rule> | undefined {
  switch (editor.mode.case) {
    case 'cursor': {
      return undefined;
    }
    case 'select': {
      const select = moveLeftSelect(editor.mode.select);
      if (select === undefined) return undefined;
      return fixSelect(editor.set('mode', { case: 'select', select }));
    }
  }
}

export function moveEditorSelectRight<Meta, Rule>(editor: Editor<Meta, Rule>): Editor<Meta, Rule> | undefined {
  switch (editor.mode.case) {
    case 'cursor': {
      return undefined;
    }
    case 'select': {
      const select = moveRightSelect(editor.mode.select);
      if (select === undefined) return undefined;
      return fixSelect(editor.set('mode', { case: 'select', select }));
    }
  }
}


