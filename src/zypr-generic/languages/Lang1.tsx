import { List } from 'immutable'
import { makeCursor } from '../Cursor'
import { Editor, makeEditor, } from '../Editor'
import { defaultEditorPrinter, defaultEditorRenderer, defaultQueryHandler } from '../EditorDefaults'
import { Expression, Grammar, makeExpression, makeGrammar, makeGrammarDisplayer } from '../Grammar'

/*
Features
- only expressions
- vars and apps
*/

// grammar types

export type M = 'exp'
export type R = 'var' | 'app' | 'hole'
export type D = { label: string } | undefined
export type E = 'unit'

export type Exp = Expression<M, R, D>

// grammar

export const grammar: Grammar<M, R, D> = makeGrammar<M, R, D>({
  rules: {
    'exp': ['var', 'app', 'hole']
  },
  data: {
    'var': { label: "" },
    'app': undefined,
    'hole': undefined
  },
  kids: {
    'var': List([]),
    'app': List(['exp', 'exp']),
    'hole': List([])
  },
  holeRule: {
    'exp': 'hole'
  },
  holeData: {
    'exp': undefined
  }
})

// printer

export const grammarPrinter = makeGrammarDisplayer<M, R, D, string, E>((exp, kids) => {
  switch (exp.rule) {
    case 'var': return _ => [(exp.data as { label: string }).label]
    case 'app': return _ => [`(${kids.get(0)?.out('unit')?.join("")} ${kids.get(1)?.out('unit')?.join("")})`]
    case 'hole': return _ => ["?"]
  }
})

// renderer

export const grammarRenderer = makeGrammarDisplayer<M, R, D, JSX.Element, E>((exp, kids) => {
  switch (exp.rule) {
    case 'var': return _ => [<div className="exp exp-var">{(exp.data as { label: string }).label}</div>]
    case 'app': return _ => [<div className="exp exp-app">({kids.get(0)?.out('unit')} {kids.get(1)?.out('unit')})</div>]
    case 'hole': return _ => [<div className="exp exp-hole">?</div>]
  }
})

// initial expression

export function makeVar(label?: string) { return makeExpression<M, R, D>(grammar, { meta: 'exp', rule: 'var', data: { label: label ?? "" }, kids: List([]) }) }

export function makeApp(apl: Expression<M, R, D>, arg: Expression<M, R, D>) { return makeExpression<M, R, D>(grammar, { meta: 'exp', rule: 'app', data: grammar.data['app'], kids: List([apl, arg]) }) }

export function makeHole() { return makeExpression<M, R, D>(grammar, { meta: 'exp', rule: grammar.holeRule['exp'], data: grammar.holeData['exp'], kids: List([]) }) }

export const initExp =
  makeApp(makeApp(makeVar("a"), makeVar("b")), makeApp(makeVar("c"), makeVar("d")))

// editor

export const editorInit = makeEditor<M, R, D, E>({
  grammar,
  printer: defaultEditorPrinter(grammar, grammarPrinter, 'unit'),
  renderer: defaultEditorRenderer(grammar, grammarRenderer, 'unit'),
  queryHandler: defaultQueryHandler(
    grammar,
    {
      'var': undefined,
      'app': (cursor, str) => str === " ",
      'hole': undefined
    },
    {
      'var': (cursor, str) => !str.includes(" ") ? { label: str } : undefined,
      'app': undefined,
      'hole': undefined
    }
  ),
  mode: {
    case: 'cursor',
    cursor: makeCursor({
      zip: List([]),
      exp: initExp
    }),
    query: undefined
  }
})
