import { List, Record, RecordOf } from "immutable"
import { Cursor, CursorProps, displayCursor, makeCursor, moveDownCursor, moveLeftCursor, moveRightCursor, moveUpCursor } from "./Cursor"
import { Direction } from "./Direction"
import { displayExpression, Expression, Grammar, GrammarDisplayer, GrammarDisplayerOut, makeExpression, makeHole } from "./Grammar"
import { fixZipBot, moveDownSelect, moveLeftSelect, moveRightSelect, moveUpSelect, Select, SelectOrientation, makeSelect, displaySelect } from "./Selection"
import { displayZipper, wrap, wrapExp, Zipper } from "./Zipper"

export type Mode<M extends string, R extends string, D, E>
  = CursorMode<M, R, D, E>
  | SelectMode<M, R, D, E>

export type CursorMode<M extends string, R extends string, D, E> = {
  case: 'cursor',
  cursor: Cursor<M, R, D>,
  query: EditorQuery<M, R, D, E> | undefined
}

export type SelectMode<M extends string, R extends string, D, E> = {
  case: 'select',
  select: Select<M, R, D>
}

export type EditorDisplayer
  <M extends string, R extends string, D, A, E> = {
    grammarDisplayer: GrammarDisplayer<M, R, D, A, E>,
    displayCursorExp: (cursor: Cursor<M, R, D>, res: EditorQueryResult<M, R, D, E>) => (out: GrammarDisplayerOut<A, E>) => GrammarDisplayerOut<A, E>,
    displaySelectTop: (select: Select<M, R, D>) => (out: GrammarDisplayerOut<A, E>) => GrammarDisplayerOut<A, E>,
    displaySelectBot: (select: Select<M, R, D>) => (out: GrammarDisplayerOut<A, E>) => GrammarDisplayerOut<A, E>
    displayerEnvInit: E
  }

export type EditorQuery<M extends string, R extends string, D, E> = {
  str: string,
  i: number,
}

export type EditorQueryResult<M extends string, R extends string, D, E>
  = { case: 'replace', exp: Expression<M, R, D> }
  | EditorQueryResultInsert<M, R, D, E>
  | { case: 'invalid', str: string }
  | { case: 'no query' }

export type EditorQueryResultInsert<M extends string, R extends string, D, E> =
  { case: 'insert', zip: Zipper<M, R, D> }

export type EditorQueryHandler<M extends string, R extends string, D, E> =
  (
    cursor: Cursor<M, R, D>,
    query: EditorQuery<M, R, D, E> | undefined
  ) =>
    EditorQueryResult<M, R, D, E>

export type EditorProps
  <M extends string, R extends string, D, E> = {
    grammar: Grammar<M, R, D>,
    printer: EditorDisplayer<M, R, D, string, E>,
    renderer: EditorDisplayer<M, R, D, JSX.Element, E>,
    queryHandler: EditorQueryHandler<M, R, D, E>,
    mode: Mode<M, R, D, E>
  }

export type Editor
  <M extends string, R extends string, D, E> =
  RecordOf<EditorProps<M, R, D, E>>

export function makeEditor<M extends string, R extends string, D, E>(props: EditorProps<M, R, D, E>): Editor<M, R, D, E> { return Record(props)() }

export function displayEditor
  <M extends string, R extends string, D, A, E>(
    editor: Editor<M, R, D, E>,
    editorDisplayer: EditorDisplayer<M, R, D, A, E>
  ): GrammarDisplayerOut<A, E> {
  switch (editor.mode.case) {
    case 'cursor': {
      return displayCursor(
        editor.grammar,
        editorDisplayer.grammarDisplayer,
        editorDisplayer.displayCursorExp(
          editor.mode.cursor,
          editor.queryHandler(editor.mode.cursor, editor.mode.query)),
        editor.mode.cursor
      ).out
    }
    case 'select': {
      return displaySelect(
        editor.grammar,
        editorDisplayer.grammarDisplayer,
        editorDisplayer.displaySelectTop(editor.mode.select),
        editorDisplayer.displaySelectBot(editor.mode.select),
        editor.mode.select
      ).out
    }
  }
}

export function escapeQuery
  <M extends string, R extends string, D, E>(editor: Editor<M, R, D, E>): Editor<M, R, D, E> {
  switch (editor.mode.case) {
    case 'cursor': return editor.set('mode', { ...editor.mode, query: undefined })
    case 'select': return editor
  }
}

export function escapeSelect
  <M extends string, R extends string, D, E>
  (editor: Editor<M, R, D, E>):
  Editor<M, R, D, E> {
  switch (editor.mode.case) {
    case 'cursor': return editor
    case 'select': {
      const select = editor.mode.select
      switch (editor.mode.select.orient) {
        case 'top': {
          return editor.set('mode', {
            case: 'cursor',
            cursor: makeCursor({
              zip: wrap(select.zipTop, fixZipBot(select.orient, select.zipBot)),
              exp: editor.mode.select.exp,
            }),
            query: undefined
          })
        }
        case 'bot': {
          return editor.set('mode', {
            case: 'cursor',
            cursor: makeCursor({
              zip: editor.mode.select.zipTop,
              exp: wrapExp(
                editor.grammar,
                fixZipBot(editor.mode.select.orient, editor.mode.select.zipBot),
                editor.mode.select.exp)
            }),
            query: undefined
          })
        }
      }
    }
  }
}
export function enterSelect
  <M extends string, R extends string, D, E>(
    editor: Editor<M, R, D, E>,
    orient: SelectOrientation
  ): Editor<M, R, D, E> | undefined {
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
      })
    }
    case 'select': return editor
  }
}

export function moveEditorCursorUp<M extends string, R extends string, D, E>
  (editor: Editor<M, R, D, E>):
  Editor<M, R, D, E> | undefined {
  switch (editor.mode.case) {
    case 'cursor': {
      const cursor = moveUpCursor(editor.grammar, editor.mode.cursor)
      if (cursor === undefined) return undefined
      return editor.set('mode', { case: 'cursor', cursor, query: undefined })
    }
    case 'select': {
      return moveEditorCursorUp(escapeSelect(editor))
    }
  }
}

export function moveEditorCursorDown<M extends string, R extends string, D, E>
  (editor: Editor<M, R, D, E>):
  Editor<M, R, D, E> | undefined {
  switch (editor.mode.case) {
    case 'cursor': {
      const cursor = moveDownCursor(0, editor.mode.cursor)
      if (cursor === undefined) return undefined
      return editor.set('mode', { case: 'cursor', cursor, query: undefined })
    }
    case 'select': {
      return moveEditorCursorDown(escapeSelect(editor))
    }
  }
}

export function moveEditorCursorLeft<M extends string, R extends string, D, E>(editor: Editor<M, R, D, E>): Editor<M, R, D, E> | undefined {
  switch (editor.mode.case) {
    case 'cursor': {
      const cursor = moveLeftCursor(editor.mode.cursor)
      if (cursor === undefined) return undefined
      return editor.set('mode', { case: 'cursor', cursor, query: undefined })
    }
    case 'select': {
      return moveEditorCursorLeft(escapeSelect(editor))
    }
  }
}

export function moveEditorCursorRight<M extends string, R extends string, D, E>(editor: Editor<M, R, D, E>): Editor<M, R, D, E> | undefined {
  switch (editor.mode.case) {
    case 'cursor': {
      const cursor = moveRightCursor(editor.mode.cursor)
      if (cursor === undefined) return undefined
      return editor.set('mode', { case: 'cursor', cursor, query: undefined })
    }
    case 'select': {
      return moveEditorCursorRight(escapeSelect(editor))
    }
  }
}

export function fixSelect
  <M extends string, R extends string, D, E>
  (editor: Editor<M, R, D, E>):
  Editor<M, R, D, E> {
  switch (editor.mode.case) {
    case 'cursor':
      return editor
    case 'select': {
      if (editor.mode.select.zipBot.isEmpty()) {
        return escapeSelect(editor)
      } else {
        return editor
      }
    }
  }
  return editor
}

export function moveEditorCursor<M extends string, R extends string, D, E>(dir: Direction): (editor: Editor<M, R, D, E>) => Editor<M, R, D, E> | undefined {
  return editor => {
    switch (dir) {
      case 'up': return moveEditorCursorUp(editor)
      case 'down': return moveEditorCursorDown(editor)
      case 'left': return moveEditorCursorLeft(editor)
      case 'right': return moveEditorCursorRight(editor)
    }
  }
}

export function moveEditorSelect<M extends string, R extends string, D, E>(dir: Direction): (editor: Editor<M, R, D, E>) => Editor<M, R, D, E> | undefined {
  return editor => {
    switch (dir) {
      case 'up': return moveEditorSelectUp(editor)
      case 'down': return moveEditorSelectDown(editor)
      case 'left': return moveEditorSelectLeft(editor)
      case 'right': return moveEditorSelectRight(editor)
    }
  }
}

export function moveEditorSelectUp<M extends string, R extends string, D, E>(editor: Editor<M, R, D, E>): Editor<M, R, D, E> | undefined {
  switch (editor.mode.case) {
    case 'cursor': {
      const editor1 = enterSelect(editor, 'top')
      if (editor1 === undefined) return undefined
      return moveEditorSelectUp(editor1)
    }
    case 'select': {
      const select = moveUpSelect(editor.grammar, editor.mode.select)
      if (select === undefined) return undefined
      return fixSelect(editor.set('mode', { case: 'select', select }))
    }
  }
}

export function moveEditorSelectDown<M extends string, R extends string, D, E>(editor: Editor<M, R, D, E>): Editor<M, R, D, E> | undefined {
  switch (editor.mode.case) {
    case 'cursor': {
      const editor1 = enterSelect(editor, 'bot')
      if (editor1 === undefined) return undefined
      return moveEditorSelectDown(editor1)
    }
    case 'select': {
      const select = moveDownSelect(0, editor.mode.select)
      if (select === undefined) return undefined
      return fixSelect(editor.set('mode', { case: 'select', select }))
    }
  }
}

export function moveEditorSelectLeft<M extends string, R extends string, D, E>(editor: Editor<M, R, D, E>): Editor<M, R, D, E> | undefined {
  switch (editor.mode.case) {
    case 'cursor': {
      return undefined
    }
    case 'select': {
      const select = moveLeftSelect(editor.mode.select)
      if (select === undefined) return undefined
      return fixSelect(editor.set('mode', { case: 'select', select }))
    }
  }
}

export function moveEditorSelectRight<M extends string, R extends string, D, E>(editor: Editor<M, R, D, E>): Editor<M, R, D, E> | undefined {
  switch (editor.mode.case) {
    case 'cursor': {
      return undefined
    }
    case 'select': {
      const select = moveRightSelect(editor.mode.select)
      if (select === undefined) return undefined
      return fixSelect(editor.set('mode', { case: 'select', select }))
    }
  }
}

export function fixQuery<M extends string, R extends string, D, E>(editor: Editor<M, R, D, E>): Editor<M, R, D, E> | undefined {
  if (
    editor.mode.case === 'cursor' &&
    editor.mode.query !== undefined &&
    editor.mode.query.str === ""
  ) {
    editor = escapeQuery(editor)
  }
  return editor
}

export function interactEditorQuery<M extends string, R extends string, D, E>(event: KeyboardEvent): (editor: Editor<M, R, D, E>) => Editor<M, R, D, E> | undefined {
  return (editor) => {
    let editor1: Editor<M, R, D, E> | undefined
    switch (editor.mode.case) {
      case 'cursor': {
        const cursor = editor.mode.cursor
        const query =
          editor.mode.query !== undefined ?
            editor.mode.query :
            { str: "", i: 0 }
        if (event.key === 'ArrowLeft') {
          editor1 = editor.set('mode', { ...editor.mode, query: { ...query, i: query.i - 1 } })
          editor1 = editor.updateIn(['mode', 'query', 'i'], i => i as number - 1)
        } else if (event.key === 'ArrowRight') {
          editor1 = editor.set('mode', { ...editor.mode, query: { ...query, i: query.i + 1 } })
        } else if (event.key === 'Backspace') {
          editor1 = editor.set('mode', { ...editor.mode, query: { ...query, str: query.str.slice(0, -1) } })
        } else if (event.key === 'Delete') {
          // TODO
        } else if (event.key === 'Enter') {
          const res = editor.queryHandler(editor.mode.cursor, query)
          switch (res.case) {
            case 'replace': {
              editor1 = editor.set('mode', {
                ...editor.mode,
                query: undefined,
                cursor: makeCursor({
                  zip: cursor.zip,
                  exp: res.exp
                })
              })
              break
            }
            case 'insert': {
              editor1 = editor.set('mode', {
                ...editor.mode,
                query: undefined,
                cursor: makeCursor({
                  exp: cursor.exp,
                  zip: wrap(cursor.zip, res.zip)
                })
              })
              break
            }
            case 'invalid': break
            case 'no query': break
          }
        } else {
          editor1 = editor.set('mode', { ...editor.mode, query: { ...query, str: query.str + event.key } })
        }
        break
      }
      case 'select': break
    }
    if (editor1 === undefined) return undefined
    return fixQuery(editor1)
  }
}

export function backspaceEditor<M extends string, R extends string, D, E>(editor: Editor<M, R, D, E>): Editor<M, R, D, E> | undefined {
  switch (editor.mode.case) {
    case 'cursor': {
      let cursor = editor.mode.cursor
      return editor.set('mode', {
        case: 'cursor',
        cursor: makeCursor<M, R, D>({
          zip: cursor.zip,
          exp: makeHole(editor.grammar, cursor.exp.meta)
        }),
        query: undefined
      })
    }
    case 'select': {
      let select = editor.mode.select
      return editor.set('mode', {
        case: 'cursor',
        cursor: makeCursor<M, R, D>({
          zip: select.zipTop,
          exp: select.exp
        }),
        query: undefined
      })
    }
  }
}