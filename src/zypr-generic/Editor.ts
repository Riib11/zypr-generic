import { List, Record, RecordOf } from "immutable";
import { Cursor, displayCursor, makeCursor, moveDownCursor, moveLeftCursor, moveRightCursor, moveUpCursor } from "./Cursor";
import { Direction } from "./Direction";
import { Expression, Grammar, GrammarDisplayer, makeExpression } from "./Grammar";
import { fixZipBot, moveDownSelect, moveLeftSelect, moveRightSelect, moveUpSelect, Select, SelectOrientation, makeSelect, displaySelect } from "./Selection";
import { wrap, wrapExp, Zipper } from "./Zipper";

export type Mode<Meta, Rule>
  = CursorMode<Meta, Rule>
  | SelectMode<Meta, Rule>

export type CursorMode<Meta, Rule> = {
  case: 'cursor',
  cursor: Cursor<Meta, Rule>,
  query: EditorQuery<Meta, Rule> | undefined
}

export type SelectMode<Meta, Rule> = {
  case: 'select',
  select: Select<Meta, Rule>
}

export type EditorDisplayer<Meta, Rule, A> = {
  grammarDisplayer: GrammarDisplayer<Meta, Rule, A>,
  wrapCursorExp: (cursor: Cursor<Meta, Rule>, res: EditorQueryResult<Meta, Rule>) => (out: A) => A,
  wrapSelectTop: (select: Select<Meta, Rule>) => (out: A) => A,
  wrapSelectBot: (select: Select<Meta, Rule>) => (out: A) => A
}

export type EditorQuery<Meta, Rule> = {
  str: string,
  i: number,
}

export type EditorQueryResult<Meta, Rule>
  = { case: 'replace', exp: Expression<Meta, Rule> }
  | { case: 'insert', zip: Zipper<Meta, Rule> }
  | { case: 'invalid', str: string }
  | { case: 'no query' }

export type EditorQueryHandler<Meta, Rule> =
  (query: EditorQuery<Meta, Rule> | undefined) => EditorQueryResult<Meta, Rule>

export type EditorProps<Meta, Rule> = {
  grammar: Grammar<Meta, Rule>,
  printer: EditorDisplayer<Meta, Rule, string>,
  renderer: EditorDisplayer<Meta, Rule, JSX.Element>,
  queryHandler: EditorQueryHandler<Meta, Rule>,
  mode: Mode<Meta, Rule>
}

export type Editor<Meta, Rule> = RecordOf<EditorProps<Meta, Rule>>;

export function makeEditor<Meta, Rule>(props: EditorProps<Meta, Rule>): Editor<Meta, Rule> { return Record(props)(); }

export function displayEditor<Meta, Rule, A>(editor: Editor<Meta, Rule>, editorDisplayer: EditorDisplayer<Meta, Rule, A>): A {
  switch (editor.mode.case) {
    case 'cursor': {
      return displayCursor(
        editorDisplayer.grammarDisplayer,
        editorDisplayer.wrapCursorExp(editor.mode.cursor, editor.queryHandler(editor.mode.query)),
        editor.mode.cursor
      ).out;
    }
    case 'select': {
      return displaySelect(
        editorDisplayer.grammarDisplayer,
        editorDisplayer.wrapSelectTop(editor.mode.select),
        editorDisplayer.wrapSelectBot(editor.mode.select),
        editor.mode.select
      ).out;
    }
  }
}

export function escapeQuery<Meta, Rule>(editor: Editor<Meta, Rule>): Editor<Meta, Rule> {
  switch (editor.mode.case) {
    case 'cursor': return editor.set('mode', { ...editor.mode, query: undefined });
    case 'select': return editor;
  }
}

export function escapeSelect<Meta, Rule>(editor: Editor<Meta, Rule>): Editor<Meta, Rule> {
  switch (editor.mode.case) {
    case 'cursor': return editor;
    case 'select': {
      const select = editor.mode.select;
      switch (editor.mode.select.orient) {
        case 'top': {
          return editor.set('mode', {
            case: 'cursor',
            cursor: makeCursor({
              zip: wrap(select.zipTop, fixZipBot(select.orient, select.zipBot)),
              exp: editor.mode.select.exp,
            }),
            query: undefined
          });
        }
        case 'bot': {
          return editor.set('mode', {
            case: 'cursor',
            cursor: makeCursor({
              zip: editor.mode.select.zipTop,
              exp: wrapExp(fixZipBot(editor.mode.select.orient, editor.mode.select.zipBot), editor.mode.select.exp)
            }),
            query: undefined
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
      return editor.set('mode', { case: 'cursor', cursor, query: undefined });
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
      return editor.set('mode', { case: 'cursor', cursor, query: undefined });
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
      return editor.set('mode', { case: 'cursor', cursor, query: undefined });
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
      return editor.set('mode', { case: 'cursor', cursor, query: undefined });
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

export function moveEditorCursor<Meta, Rule>(dir: Direction): (editor: Editor<Meta, Rule>) => Editor<Meta, Rule> | undefined {
  return editor => {
    switch (dir) {
      case 'up': return moveEditorCursorUp(editor);
      case 'down': return moveEditorCursorDown(editor);
      case 'left': return moveEditorCursorLeft(editor);
      case 'right': return moveEditorCursorRight(editor);
    }
  }
}

export function moveEditorSelect<Meta, Rule>(dir: Direction): (editor: Editor<Meta, Rule>) => Editor<Meta, Rule> | undefined {
  return editor => {
    switch (dir) {
      case 'up': return moveEditorSelectUp(editor);
      case 'down': return moveEditorSelectDown(editor);
      case 'left': return moveEditorSelectLeft(editor);
      case 'right': return moveEditorSelectRight(editor);
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

export function fixQuery<Meta, Rule>(editor: Editor<Meta, Rule>): Editor<Meta, Rule> | undefined {
  if (
    editor.mode.case === 'cursor' &&
    editor.mode.query !== undefined &&
    editor.mode.query.str === ""
  ) {
    editor = escapeQuery(editor);
  }
  return editor;
}

export function interactEditorQuery<Meta, Rule>(event: KeyboardEvent): (editor: Editor<Meta, Rule>) => Editor<Meta, Rule> | undefined {
  return (editor) => {
    let editor1: Editor<Meta, Rule> | undefined;
    switch (editor.mode.case) {
      case 'cursor': {
        const cursor = editor.mode.cursor;
        const query =
          editor.mode.query !== undefined ?
            editor.mode.query :
            { str: "", i: 0 }
        if (event.key === 'ArrowLeft') {
          editor1 = editor.set('mode', { ...editor.mode, query: { ...query, i: query.i - 1 } });
          editor1 = editor.updateIn(['mode', 'query', 'i'], i => i as number - 1);
        } else if (event.key === 'ArrowRight') {
          editor1 = editor.set('mode', { ...editor.mode, query: { ...query, i: query.i + 1 } });
        } else if (event.key === 'Backspace') {
          editor1 = editor.set('mode', { ...editor.mode, query: { ...query, str: query.str.slice(0, -1) } });
        } else if (event.key === 'Delete') {
          // TODO
        } else if (event.key === 'Enter') {
          const res = editor.queryHandler(query);
          switch (res.case) {
            case 'replace': {
              editor1 = editor.set('mode', {
                ...editor.mode,
                query: undefined,
                cursor: makeCursor({
                  zip: cursor.zip,
                  exp: res.exp
                })
              });
              break;
            }
            case 'insert': {
              console.log("here");
              console.log("res", res);
              editor1 = editor.set('mode', {
                ...editor.mode,
                query: undefined,
                cursor: makeCursor({
                  exp: cursor.exp,
                  zip: wrap(cursor.zip, res.zip)
                })
              });
              break;
            }
            case 'invalid': break;
            case 'no query': break;
          }
        } else {
          editor1 = editor.set('mode', { ...editor.mode, query: { ...query, str: query.str + event.key } });
        }
        break;
      }
      case 'select': break;
    }
    if (editor1 === undefined) return undefined;
    return fixQuery(editor1);
  }
}

export function backspaceEditor<Meta, Rule extends { case: 'hole' }>(editor: Editor<Meta, Rule>): Editor<Meta, Rule> | undefined {
  switch (editor.mode.case) {
    case 'cursor': {
      let cursor = editor.mode.cursor;
      return editor.set('mode', {
        case: 'cursor',
        cursor: makeCursor<Meta, Rule>({
          zip: cursor.zip,
          exp: makeExpression<Meta, Rule>({
            meta: cursor.exp.meta,
            rule: { case: 'hole' } as Rule,
            exps: List()
          })
        }),
        query: undefined
      })
    }
    case 'select': {
      let select = editor.mode.select;
      return editor.set('mode', {
        case: 'cursor',
        cursor: makeCursor<Meta, Rule>({
          zip: select.zipTop,
          exp: select.exp
        }),
        query: undefined
      });
    }
  }
}