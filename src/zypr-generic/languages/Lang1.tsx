import { List } from 'immutable';
import { makeCursor } from '../Cursor';
import { Editor, makeEditor, EditorDisplayer, EditorQueryHandler } from '../Editor';
import { Expression, Grammar, makeExpression, makeExpressionHole, setExpressionData } from '../Grammar';
import { displayZipper, makeStep } from '../Zipper';

export type Meta = 'exp'

// export type Rule
//   = 'app'
//   | { case: 'var', label: string }
//   | { case: 'hole' }

export type Rule = 'var' | 'app' | 'hole'

export type Data = { label: string } | undefined;

export type Exp = Expression<Meta, Rule, Data>;

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
    case 'exp': return (k) => [{ rule: 'var', out: k('var') }, { rule: 'app', out: k('app') }];
  }
}

function ruleDataDefault<A>(rule: Rule): (k: <D extends Data>(d: D) => A) => A {
  return (k) => {
    switch (rule) {
      case 'var': return k(undefined);
      case 'app': return k({ label: "" });
      case 'hole': return k(undefined);
    }
  }
}

function ruleChildren(rule: Rule): Meta[] {
  switch (rule) {
    case 'var': return [];
    case 'app': return ['exp', 'exp'];
    case 'hole': return [];
  }
}

const holeRules: (meta: Meta) => Rule =
  meta => {
    switch (meta) {
      case 'exp': return 'hole';
    }
  }

const holeData: (meta: Meta) => Data =
  meta => {
    switch (meta) {
      case 'exp': return undefined;
    }
  }

const grammar: Grammar<Meta, Rule, Data> = {
  metaRules,
  ruleDataDefault,
  ruleChildren,
  holeRules,
  holeData
}

export const mkVar = (label: string): Exp =>
  setExpressionData(grammar)
    (makeExpression(grammar)('exp')[0].out(List([])).set('data', { label }))
    (1);

export const mkApp = (apl: Exp, arg: Exp): Exp =>
  makeExpression(grammar)('exp')[1].out(List([apl, arg]));

export const mkHole = (): Exp =>
  makeExpressionHole('exp');

// const printer: EditorDisplayer<Meta, Rule, string> = {
//   grammarDisplayer: (meta, rule) => (children) => {
//     switch (meta) {
//       case 'exp': {
//         switch (rule.case) {
//           case 'var': return {
//             exp: makeExpression({ meta, rule, exps: children.map(child => child.exp) }),
//             out: rule.label
//           };
//           case 'app': return {
//             exp: makeExpression({ meta, rule, exps: children.map(child => child.exp) }),
//             out: `(${children.get(0)?.out} ${children.get(1)?.out})`
//           };
//           case 'hole': return {
//             exp: makeExpression({ meta, rule, exps: children.map(child => child.exp) }),
//             out: "?"
//           }
//         }
//       }
//     }
//   },
//   wrapCursorExp: (cursor, res) => out => {
//     return "{" + out + "}";
//   },
//   wrapSelectTop: select => out => "{" + out + "}",
//   wrapSelectBot: select => out => "{" + out + "}"
// }

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