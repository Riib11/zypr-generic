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
export type E = { indent: number }

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
    case 'var': return env => [(exp.data as { label: string }).label]
    case 'app': return env => [`(${kids.get(0)?.out(env)?.join("")} ${kids.get(1)?.out(env)?.join("")})`]
    case 'hole': return env => ["?"]
  }
})

// renderer

export function renderIndent(i: number): JSX.Element[] {
  let elems: JSX.Element[] = [<br />];
  for (var j = i; j > 0; j--)
    elems.push(<div className="indent">{"  "}</div>)
  return elems
}

export function incrementIndent(env: E): E {
  return { ...env, indent: env.indent + 1 }
}

export const grammarRenderer = makeGrammarDisplayer<M, R, D, JSX.Element, E>((exp, kids) => {
  switch (exp.rule) {
    case 'var': return env => [<div className="exp exp-var">{(exp.data as { label: string }).label}</div>]
    case 'app': return env0 => {
      let apl = kids.get(0)
      let arg = kids.get(1)
      const env1 = incrementIndent(env0)
      return [<div className="exp exp-app">{apl?.out(env0)}{renderIndent(env1.indent)}({arg?.out(env1)})</div>]
    }
    case 'app': return env => [<div className="exp exp-app">({kids.get(0)?.out(env)}{renderIndent(env.indent)}{kids.get(1)?.out(incrementIndent(env))})</div>]
    case 'hole': return env => [<div className="exp exp-hole">?</div>]
  }
})

// initial expression

export function makeVar(label?: string) { return makeExpression<M, R, D>(grammar, { meta: 'exp', rule: 'var', data: { label: label ?? "" }, kids: List([]) }) }

export function makeApp(apl: Expression<M, R, D>, arg: Expression<M, R, D>) { return makeExpression<M, R, D>(grammar, { meta: 'exp', rule: 'app', data: grammar.data['app'], kids: List([apl, arg]) }) }

export function makeHole() { return makeExpression<M, R, D>(grammar, { meta: 'exp', rule: grammar.holeRule['exp'], data: grammar.holeData['exp'], kids: List([]) }) }

export const initExp =
  makeApp(makeApp(makeVar("a"), makeVar("b")), makeApp(makeVar("c"), makeVar("d")))

// editor

export const initDisplayEnv = { indent: 0 }

export const editorInit = makeEditor<M, R, D, E>({
  grammar,
  printer: defaultEditorPrinter(grammar, grammarPrinter, initDisplayEnv),
  renderer: defaultEditorRenderer(grammar, grammarRenderer, initDisplayEnv),
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
