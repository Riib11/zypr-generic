import { List, Record, RecordOf } from 'immutable';

export type Grammar<Meta, Rule, Data> =
  {
    metaRules: <A>(meta: Meta) => (k: <R extends Rule>(x: R) => A) => { rule: Rule, out: A }[],
    ruleDataDefault: <A>(rule: Rule) => (k: <D extends Data>(x: D) => A) => A,
    ruleChildren: (rule: Rule) => Meta[],
    holeRules: (meta: Meta) => Rule,
    holeData: (meta: Meta) => Data
  };

// export type Grammar<Meta, Rule> =
//   (meta: Meta) => (rule: Rule) => List<Meta> | undefined

// expression

export type ExpressionProps<Meta, Rule, Data> = {
  meta: Meta,
  rule: Rule,
  data: Data,
  exps: List<Expression<Meta, Rule, Data>>
};
export type Expression<Meta, Rule, Data> = RecordOf<ExpressionProps<Meta, Rule, Data>>;

function makeExpressionUnsafe<Meta, Rule, Data>(props: ExpressionProps<Meta, Rule, Data>): Expression<Meta, Rule, Data> {
  return Record(props)();
}

export function makeExpression<Meta, Rule, Data>(grammar: Grammar<Meta, Rule, Data>):
  (meta: Meta) => {
    rule: Rule,
    out: (exps: List<Expression<Meta, Rule, Data>>) => Expression<Meta, Rule, Data>
  }[] {
  return (
    (meta: Meta) =>
      grammar.metaRules<(exps: List<Expression<Meta, Rule, Data>>) => Expression<Meta, Rule, Data>>(meta)(rule =>
        grammar.ruleDataDefault<(exps: List<Expression<Meta, Rule, Data>>) => Expression<Meta, Rule, Data>>(rule)(data =>
          exps => makeExpressionUnsafe({ meta, rule, data, exps })))
  );
}

export function makeExpressionHole<Meta, Rule, Data>
  (grammar: Grammar<Meta, Rule, Data>, meta: Meta):
  Expression<Meta, Rule, Data> {
  return makeExpressionUnsafe<Meta, Rule, Data>
    ({
      meta,
      rule: grammar.holeRules(meta),
      data: grammar.holeData(meta),
      exps: List([])
    });
}

export function setExpressionData<Meta, Rule, Data>(grammar: Grammar<Meta, Rule, Data>) {
  return ((exp: Expression<Meta, Rule, Data>) =>
    grammar.ruleDataDefault<
      (data: unknown) => Expression<Meta, Rule, Data>
    >(exp.rule)(dataDefault =>
      (data: typeof dataDefault) => exp.set('data', data)))
}

// displaying

// export type GrammarDisplayer<Meta, Rule, Data, A> =
//   (meta: Meta, rule: Rule | 'hole') =>
//     (children: List<GrammarDisplayerChild<Meta, Rule, Data, A>>) =>
//       GrammarDisplayerChild<Meta, Rule, Data, A>

export type GrammarDisplayerChild<Meta, Rule, Data, A> = { exp: Expression<Meta, Rule, Data>, out: A };

// export function displayExpression<Meta, Rule, Data, A>(
//   grammarDisplayer: GrammarDisplayer<Meta, Rule, Data, A>,
//   exp: Expression<Meta, Rule, Data>
// ): GrammarDisplayerChild<Meta, Rule, Data, A> {
//   return grammarDisplayer(exp.meta, exp.rule)(exp.exps.map(e => displayExpression(grammarDisplayer, e)));
// }

export type GrammarDisplayer<Meta, Rule, Data, A> =
  (meta: Meta) => {
    rule: Rule,
    out: (children: List<GrammarDisplayerChild<Meta, Rule, Data, A>>) =>
      GrammarDisplayerChild<Meta, Rule, Data, A>
  }