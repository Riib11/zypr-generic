import { List, Record, RecordOf } from 'immutable';

export type Grammar<Meta, Rule> =
  (meta: Meta) => (rule: Rule) => List<Meta> | undefined

// expression

export type ExpressionProps<Meta, Rule> = {
  meta: Meta,
  rule: Rule,
  exps: List<Expression<Meta, Rule>>
}
export type Expression<Meta, Rule> = RecordOf<ExpressionProps<Meta, Rule>>

export function makeExpression<Meta, Rule>(props: ExpressionProps<Meta, Rule>): Expression<Meta, Rule> {
  return Record(props)();
}

// displaying

export type GrammarDisplayer<Meta, Rule, A> =
  (meta: Meta, rule: Rule) =>
    (children: List<GrammarDisplayerChild<Meta, Rule, A>>) =>
      GrammarDisplayerChild<Meta, Rule, A>

export type GrammarDisplayerChild<Meta, Rule, A> = { exp: Expression<Meta, Rule>, out: A };

export function displayExpression<Meta, Rule, A>(
  grammarDisplayer: GrammarDisplayer<Meta, Rule, A>,
  exp: Expression<Meta, Rule>
): GrammarDisplayerChild<Meta, Rule, A> {
  return grammarDisplayer(exp.meta, exp.rule)(exp.exps.map(e => displayExpression(grammarDisplayer, e)));
}
