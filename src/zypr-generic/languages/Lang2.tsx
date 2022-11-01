export const x = 1

/*
import { List } from 'immutable'
import { makeCursor } from '../Cursor'
import { Editor, makeEditor, EditorDisplayer } from '../Editor'
import { displayExpression, Expression, makeExpression } from '../Grammar'
import { displayZipper, makeStep } from '../Zipper'

export type M = 'exp' | 'id'
export type R = RId | RExp
type RId
  = { case: 'id', label: string }
type RExp
  = { case: 'app' }
  | { case: 'var', label: string }
  | { case: 'lam' }
  | { case: 'hole' }


export const mkApp = (apl: Expression<M, R, D>, arg: Expression<M, R, D>): Expression<M, R, D> =>
  makeExpression({ meta: 'exp', rule: { case: 'app' }, exps: List([apl, arg]) })
export const mkVar = (label: string): Expression<M, R, D> =>
  makeExpression({ meta: 'exp', rule: { case: 'var', label }, exps: List() })
export const mkHole = () => makeExpression<M, R, D>({ meta: 'exp', rule: { case: 'hole' }, exps: List([]) })

export const editorPrinter: EditorDisplayer<M, R, D, string> = {
  grammarDisplayer: (meta, rule) => (kids) => {
    switch (meta) {
      case 'id': {
        switch (rule.case) {
          case 'id': return {
            exp: makeExpression({ meta, rule, exps: List() }),
            out: rule.label
          }
          default: throw new Error("malformed expression")
        }
      }
      case 'exp': {
        switch (rule.case) {
          case 'var': return {
            exp: makeExpression({ meta, rule, exps: List() }),
            out: rule.label
          }
          case 'app': return {
            exp: makeExpression({ meta, rule, exps: kids.map(kid => kid.exp) }),
            out: `(${kids.get(0)?.out} ${kids.get(1)?.out})`
          }
          case 'lam': return {
            exp: makeExpression({ meta, rule, exps: kids.map(kid => kid.exp) }),
            out: `(λ ${kids.get(0)?.out} => ${kids.get(1)?.out})`
          }
          case 'hole': return {
            exp: makeExpression({ meta, rule, exps: List() }),
            out: "?"
          }
          default: throw new Error("malformed expression")
        }
      }
    }
  },
  wrapCursorExp: (cursor, res) => out => {
    return "{" + out + "}"
  },
  wrapSelectTop: select => out => "{" + out + "}",
  wrapSelectBot: select => out => "{" + out + "}"
}

export const editorRenderer: EditorDisplayer<M, R, D, JSX.Element> = {
  grammarDisplayer: (meta, rule) => (kids) => {
    switch (meta) {
      case 'exp': {
        switch (rule.case) {
          case 'var': return {
            exp: makeExpression({ meta, rule, exps: kids.map(kid => kid.exp) }),
            out: (<div className="exp exp-var" >{rule.label}</div>)
          }
          case 'app': return {
            exp: makeExpression({ meta, rule, exps: kids.map(kid => kid.exp) }),
            out: (
              <div className="exp exp-app" >({kids.get(0)?.out} {kids.get(1)?.out})</div>
            )
          }
          case 'hole': return {
            exp: makeExpression({ meta, rule, exps: kids.map(kid => kid.exp) }),
            out: (
              <div className="exp exp-hole" >?</div>
            )
          }
        }
      }
    }
  },
  wrapCursorExp: (cursor, res) => out => {
    switch (res.case) {
      case 'insert': {
        const zipRen = displayZipper(editorRenderer.grammarDisplayer, res.zip)({
          exp: cursor.exp,
          out: (<div className="query-out">{out}</div>)
        })
        return (
          <div className="cursor"><div className="query"><div className="query-result query-result-insert" >{zipRen.out}</div></div></div>
        )
      }
      case 'replace': {
        const expRen = displayExpression(editorRenderer.grammarDisplayer, res.exp)
        return (
          <div className="cursor"><div className="query"><div className="query-result query-result-replace">{expRen.out}</div><div className="query-out">{out}</div></div></div>
        )
      }
      case 'invalid': {
        return (
          <div className="cursor"><div className="query"><div className="query-result query-result-invalid">{res.str}</div><div className="query-out">{out}</div></div></div>
        )
      }
      case 'no query': {
        return (<div className="cursor">{out}</div>)
      }
    }
  },
  wrapSelectTop: select => out => (<div className="select select-top">{out}</div>),
  wrapSelectBot: select => out => (<div className="select select-bot">{out}</div>)
}

export const editorInit: Editor<M, R, D> = makeEditor<M, R, D>({
  grammar: ((meta) => (rule) => {
    switch (meta) {
      case 'exp': {
        switch (rule.case) {
          case 'var': return List()
          case 'app': return List(['exp', 'exp'])
          case 'hole': return List()
        }
      }
    }
  }),
  printer: editorPrinter,
  renderer: editorRenderer,
  queryHandler: (query) => {
    if (query === undefined) return { case: 'no query' }
    if (query.str === " ") {
      if (query.i % 2 == 0) {
        return {
          case: 'insert',
          zip: List([
            makeStep<M, R, D>({
              meta: 'exp',
              rule: { case: 'app' },
              leftsRev: List(),
              rights: List([mkHole()])
            })
          ])
        }
      } else {
        return {
          case: 'insert',
          zip: List([
            makeStep<M, R, D>({
              meta: 'exp',
              rule: { case: 'app' },
              leftsRev: List([mkHole()]),
              rights: List()
            })
          ])
        }
      }
    } else if (!query.str.includes(" ")) {
      return {
        case: 'replace',
        exp: mkVar(query.str)
      }
    }
    return { case: 'invalid', str: query.str }
  },
  mode: {
    case: 'cursor',
    cursor: makeCursor({
      zip: List(),
      // exp: mkApp(mkApp(mkApp(mkVar("a"), mkVar("b")), mkVar("c")), mkVar("d"))
      // exp: mkApp(mkVar("a"), mkVar("b"))
      exp: mkApp(mkApp(mkVar("a"), mkVar("b")), mkApp(mkVar("c"), mkVar("d")))
    }),
    query: undefined
  }
})
*/