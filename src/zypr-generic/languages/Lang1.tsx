import { List } from 'immutable'
import { Cursor, makeCursor } from '../Cursor'
import { Editor, makeEditor, EditorDisplayer, EditorQueryHandler } from '../Editor'
import { displayExpression, Expression, Grammar, GrammarDisplayerKid, makeExpression, makeGrammar, makeGrammarDisplayer } from '../Grammar'
import { displayZipper, makeStep } from '../Zipper'

export type M = 'exp'
export type R = 'var' | 'app' | 'hole'
export type D = { label: string } | { indented: boolean } | undefined

export type Exp = Expression<M, R, D>

const grammar: Grammar<M, R, D> = makeGrammar<M, R, D>({
  rules: {
    'exp': ['var', 'app', 'hole']
  },
  data: {
    'var': { label: "" },
    'app': { indented: false },
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

export function makeVar(label?: string) { return makeExpression<M, R, D>(grammar, { meta: 'exp', rule: 'var', data: { label: label ?? "" }, kids: List([]) }) }

export function makeApp(apl: Expression<M, R, D>, arg: Expression<M, R, D>, indented?: boolean) { return makeExpression<M, R, D>(grammar, { meta: 'exp', rule: 'app', data: { indented: indented ?? false }, kids: List([apl, arg]) }) }

export function makeHole() { return makeExpression<M, R, D>(grammar, { meta: 'exp', rule: grammar.holeRule.exp, data: grammar.holeData.exp, kids: List([]) }) }

const expressionPrinter = makeGrammarDisplayer<M, R, D, string>((exp, kids) => {
  switch (exp.rule) {
    case 'var': return [(exp.data as { label: string }).label]
    case 'app': {
      console.log("print kids", kids.toJS())
      return [`(${kids.get(0)?.out?.join("")} ${kids.get(1)?.out?.join("")})`]
    }
    case 'hole': return ["?"]
  }
})

const grammarRenderer = makeGrammarDisplayer<M, R, D, JSX.Element>((exp, kids) => {
  switch (exp.rule) {
    case 'var': return [<div className="exp exp-var">{(exp.data as { label: string }).label}</div>]
    case 'app': return [<div className="exp exp-app">({kids.get(0)?.out} {kids.get(1)?.out})</div>]
    case 'hole': return [<div className="exp exp-hole">?</div>]
  }
})

export const editorInit: Editor<M, R, D> = makeEditor<M, R, D>({
  grammar,
  printer: {
    grammarDisplayer: expressionPrinter,
    displayCursorExp: (cursor, res) => (out) => ["{"].concat(out).concat(["}"]),
    displaySelectTop: (select) => (out) => ["[0]{"].concat(out).concat(["}[0]"]),
    displaySelectBot: (select) => (out) => ["[1]{"].concat(out).concat(["}[1]"])
  },
  renderer: {
    grammarDisplayer: grammarRenderer,
    displayCursorExp: (cursor: Cursor<M, R, D>, res) => out => {
      switch (res.case) {
        case 'insert': {
          const zipRen = displayZipper(grammar, grammarRenderer, res.zip)({
            exp: cursor.exp,
            out: [<div className="query-out">{out}</div>]
          })
          return [<div className="cursor"><div className="query"><div className="query-result query-result-insert" >{zipRen.out}</div></div></div>]
        }
        case 'replace': {
          const expRen = displayExpression(grammarRenderer, res.exp)
          return [<div className="cursor"><div className="query"><div className="query-result query-result-replace">{expRen.out}</div><div className="query-out">{out}</div></div></div>]
        }
        case 'invalid': return [<div className="cursor"><div className="query"><div className="query-result query-result-invalid">{res.str}</div><div className="query-out">{out}</div></div></div>]
        case 'no query': return [<div className="cursor">{out}</div>]

      }
    },
    displaySelectTop: select => out => [<div className="select select-top">{out}</div>],
    displaySelectBot: select => out => [<div className="select select-bot">{out}</div>]
  },
  queryHandler: query => {
    if (query === undefined) return { case: 'no query' }
    if (query.str === " ") {
      let leftsRev: List<Expression<M, R, D>> = List([])
      let rights: List<Expression<M, R, D>> = List([])
      if (query.i % 2 == 0)
        rights = List([makeHole()])
      else
        leftsRev = List([makeHole()])
      return {
        case: 'insert',
        zip: List([
          makeStep<M, R, D>({
            meta: 'exp',
            rule: 'app',
            data: grammar.data['app'],
            leftsRev,
            rights
          })
        ])
      }
    } else if (!query.str.includes(" ")) {
      return {
        case: 'replace',
        exp: makeVar(query.str)
      }
    }
    return { case: 'invalid', str: query.str }
  },
  mode: {
    case: 'cursor',
    cursor: makeCursor({
      zip: List([]),
      // exp: makeApp(makeApp(makeVar("a"), makeVar("b")), makeApp(makeVar("c"),
      // makeVar("d")))
      exp: makeApp(makeVar("a"), makeVar("b"))
    }),
    query: undefined
  }
})
