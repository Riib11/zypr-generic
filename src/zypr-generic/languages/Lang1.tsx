import { List } from 'immutable';
import { makeCursor } from '../Cursor';
import { Editor, makeEditor, EditorDisplayer, EditorQueryHandler } from '../Editor';
import { Expression, Grammar, GrammarDisplayerChild, makeExpression, makeExpressionHole } from '../Grammar';
import { displayZipper, makeStep } from '../Zipper';

export type Meta = 'exp'

// export type Rule
//   = 'app'
//   | { case: 'var', label: string }
//   | { case: 'hole' }

export type Rule
  = { case: 'var', label: string }
  | { case: 'app' }
  | { case: 'hole' }

export type Exp = Expression<Meta, Rule>;

// ((meta) => (rule) => {
//   switch (meta) {
//     case 'exp': {
//       switch (rule.case) {
//         case 'var': return List();
//         case 'app': return List(['exp', 'exp']);
//         case 'hole': return List();
//       }
//     }
//   }
// }),
// grammar: {
//   metaRules: {
//     'exp': [{case: 'var', case: 'app'}]
//   }
// }

// function metaRules(meta: Meta): Rule[] {
//   switch (meta) {
//     case 'exp': return ['var', 'app'];
//   }
// }

function metaRules<A>(meta: Meta): (k: <R extends Rule>(x: R) => A) => { rule: Rule, out: A }[] {
  switch (meta) {
    case 'exp': return (k) => [
      { rule: { case: 'var', label: "" }, out: k({ case: 'var', label: "" }) },
      { rule: { case: 'app' }, out: k({ case: 'app' }) }];
  }
}

function ruleChildren(rule: Rule): Meta[] {
  switch (rule.case) {
    case 'var': return [];
    case 'app': return ['exp', 'exp'];
    case 'hole': return [];
  }
}

function holeRules(meta: Meta): Rule {
  switch (meta) {
    case 'exp': return { case: 'hole' };
  }
}

const grammar: Grammar<Meta, Rule> = {
  metaRules,
  ruleChildren,
  holeRules,
};

export const mkVar = (label: string): Exp =>
  makeExpression(grammar)('exp')[0].out(List([]))
    .set('rule', ({ case: 'var', label }))

export const mkApp = (apl: Exp, arg: Exp): Exp =>
  makeExpression(grammar)('exp')[1].out(List([apl, arg]));

export const mkHole = (): Exp =>
  makeExpression(grammar)('exp')[2].out(List([]));

const printer: EditorDisplayer<Meta, Rule, string> = {
  // grammarDisplayer: (meta, rule) => (children) => {
  //   switch (meta) {
  //     case 'exp': {
  //       switch (rule.case) {
  //         case 'var': return {
  //           exp: makeExpression({ meta, rule, exps: children.map(child => child.exp) }),
  //           out: rule.label
  //         };
  //         case 'app': return {
  //           exp: makeExpression({ meta, rule, exps: children.map(child => child.exp) }),
  //           out: `(${children.get(0)?.out} ${children.get(1)?.out})`
  //         };
  //         case 'hole': return {
  //           exp: makeExpression({ meta, rule, exps: children.map(child => child.exp) }),
  //           out: "?"
  //         }
  //       }
  //     }
  //   }
  // },
  grammarDisplayer: (meta) => grammar.metaRules<(children: List<GrammarDisplayerChild<Meta, Rule, A>>) =>
    GrammarDisplayerChild<Meta, Rule, string>>(meta)(rule => children => {
      exp: makeExpression(grammar)(meta)[]
    })
  wrapCursorExp: (cursor, res) => out => "{" + out + "}"
  wrapSelectTop: select => out => "{" + out + "}",
  wrapSelectBot: select => out => "{" + out + "}"
}

// const renderer: EditorDisplayer<Meta, Rule, JSX.Element> = {
//   grammarDisplayer: (meta, rule) => (children) => {
//     switch (meta) {
//       case 'exp': {
//         switch (rule.case) {
//           case 'var': return {
//             exp: makeExpression({ meta, rule, exps: children.map(child => child.exp) }),
//             out: (<div className="exp exp-var" >{rule.label}</div>)
//           };
//           case 'app': return {
//             exp: makeExpression({ meta, rule, exps: children.map(child => child.exp) }),
//             out: (
//               <div className="exp exp-app" >({children.get(0)?.out} {children.get(1)?.out})</div>
//             )
//           };
//           case 'hole': return {
//             exp: makeExpression({ meta, rule, exps: children.map(child => child.exp) }),
//             out: (
//               <div className="exp exp-hole" >?</div>
//             )
//           };
//         }
//       }
//     }
//   },
//   wrapCursorExp: (cursor, res) => out => {
//     switch (res.case) {
//       case 'insert': {
//         const zipRen = displayZipper(renderer.grammarDisplayer, res.zip)({
//           exp: cursor.exp,
//           out: (<div className="query-out">{out}</div>)
//         });
//         return (
//           <div className="cursor"><div className="query"><div className="query-result query-result-insert" >{zipRen.out}</div></div></div>
//         );
//       }
//       case 'replace': {
//         const expRen = displayExpression(renderer.grammarDisplayer, res.exp);
//         return (
//           <div className="cursor"><div className="query"><div className="query-result query-result-replace">{expRen.out}</div><div className="query-out">{out}</div></div></div>
//         );
//       }
//       case 'invalid': {
//         return (
//           <div className="cursor"><div className="query"><div className="query-result query-result-invalid">{res.str}</div><div className="query-out">{out}</div></div></div>
//         );
//       }
//       case 'no query': {
//         return (<div className="cursor">{out}</div>);
//       }
//     }
//   },
//   wrapSelectTop: select => out => (<div className="select select-top">{out}</div>),
//   wrapSelectBot: select => out => (<div className="select select-bot">{out}</div>)
// }

// const queryHandler: EditorQueryHandler<Meta, Rule> = (query) => {
//   if (query === undefined) return { case: 'no query' };
//   if (query.str === " ") {
//     if (query.i % 2 == 0) {
//       return {
//         case: 'insert',
//         zip: List([
//           makeStep<Meta, Rule>({
//             meta: 'exp',
//             rule: 'app',
//             leftsRev: List(),
//             rights: List([mkHole()])
//           })
//         ])
//       };
//     } else {
//       return {
//         case: 'insert',
//         zip: List([
//           makeStep<Meta, Rule>({
//             meta: 'exp',
//             rule: 'app',
//             leftsRev: List([mkHole()]),
//             rights: List()
//           })
//         ])
//       };
//     }
//   } else if (!query.str.includes(" ")) {
//     return {
//       case: 'replace',
//       exp: mkVar(query.str)
//     };
//   }
//   return { case: 'invalid', str: query.str };
// }

// export const editorInit: Editor<Meta, Rule> = makeEditor<Meta, Rule>({
//   grammar,
//   printer,
//   renderer,
//   queryHandler,
//   mode: {
//     case: 'cursor',
//     cursor: makeCursor({
//       zip: List(),
//       // exp: mkApp(mkApp(mkApp(mkVar("a"), mkVar("b")), mkVar("c")), mkVar("d"))
//       // exp: mkApp(mkVar("a"), mkVar("b"))
//       exp: mkApp(mkApp(mkVar("a"), mkVar("b")), mkApp(mkVar("c"), mkVar("d")))
//     }),
//     query: undefined
//   }
// });
// export 