import { List, Record, RecordOf } from 'immutable';

export type Grammar<Meta, Rule> =
  {
    metaRules: <A>(meta: Meta) => (k: <R extends Rule>(x: R) => A) => { rule: Rule, out: A }[],
    ruleChildren: (rule: Rule) => Meta[],
    holeRules: (meta: Meta) => Rule,
  };

// export type Grammar<Meta, Rule> =
//   (meta: Meta) => (rule: Rule) => List<Meta> | undefined

// expression

export type ExpressionProps<Meta, Rule> = {
  meta: Meta,
  rule: Rule,
  exps: List<Expression<Meta, Rule>>
};
export type Expression<Meta, Rule> = RecordOf<ExpressionProps<Meta, Rule>>;

function makeExpressionUnsafe<Meta, Rule>(props: ExpressionProps<Meta, Rule>): Expression<Meta, Rule> {
  return Record(props)();
}

export function makeExpression<Meta, Rule>(grammar: Grammar<Meta, Rule>):
  (meta: Meta) => {
    rule: Rule,
    out: (exps: List<Expression<Meta, Rule>>) => Expression<Meta, Rule>
  }[] {
  return (
    (meta: Meta) =>
      grammar.metaRules<(exps: List<Expression<Meta, Rule>>) => Expression<Meta, Rule>>(meta)(rule =>
        exps => makeExpressionUnsafe({ meta, rule, exps })));
}

export function makeExpressionHole<Meta, Rule>
  (grammar: Grammar<Meta, Rule>, meta: Meta):
  Expression<Meta, Rule> {
  return makeExpressionUnsafe<Meta, Rule>
    ({
      meta,
      rule: grammar.holeRules(meta),
      exps: List([])
    });
}

// displaying

// export type GrammarDisplayer<Meta, Rule, A> =
//   (meta: Meta, rule: Rule | 'hole') =>
//     (children: List<GrammarDisplayerChild<Meta, Rule, A>>) =>
//       GrammarDisplayerChild<Meta, Rule, A>

export type GrammarDisplayerChild<Meta, Rule, A> = { exp: Expression<Meta, Rule>, out: A };

// export function displayExpression<Meta, Rule, A>(
//   grammarDisplayer: GrammarDisplayer<Meta, Rule, A>,
//   exp: Expression<Meta, Rule>
// ): GrammarDisplayerChild<Meta, Rule, A> {
//   return grammarDisplayer(exp.meta, exp.rule)(exp.exps.map(e => displayExpression(grammarDisplayer, e)));
// }

export type GrammarDisplayer<Meta, Rule, A> =
  (meta: Meta) => {
    rule: Rule,
    out: (children: List<GrammarDisplayerChild<Meta, Rule, A>>) =>
      GrammarDisplayerChild<Meta, Rule, A>
  }[]