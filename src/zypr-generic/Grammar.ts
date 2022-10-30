import { List, Record, RecordOf } from 'immutable';

export type Grammar<
  Meta extends string,
  Rule extends string | 'hole',
  Data
> =
  {
    metaRules: <R extends Rule>(meta: Meta) => R,
    ruleDataDefault: <D extends Data>(rule: Rule) => D,
    ruleChildren: (rule: Rule) => Meta[],
  }

export type G = Grammar<
  'exp' | 'id',
  'var' | 'app' | 'lam',
  { label: string }
>

// export type Grammar<Meta, Rule> =
//   (meta: Meta) => (rule: Rule) => List<Meta> | undefined

// expression

export type ExpressionProps<Meta, Rule, Data> = {
  meta: Meta,
  rule: Rule,
  data: Data,
  exps: List<Expression<Meta, Rule, Data>>
}
export type Expression<Meta, Rule, Data> = RecordOf<ExpressionProps<Meta, Rule, Data>>

// export function makeExpression<Meta, Rule, Data>(props: ExpressionProps<Meta, Rule, Data>): Expression<Meta, Rule, Data> {
//   return Record(props)();
// }

// does this work?
export const makeExpression =
  <Meta extends string, Rule extends string | 'hole', Data>(grammar: Grammar<Meta, Rule, Data>) => {
    <M extends Meta>(meta: M) => {
      const metaRules = grammar.metaRules(meta);
      return (<R extends (typeof metaRules)>(rule: R) => {
        const ruleDataDefault = grammar.ruleDataDefault(rule);
        return (<D extends (typeof ruleDataDefault)>(data: D) => {
          return ((exps: List<Expression<Meta, Rule, Data>>) =>
            Record({ meta, rule, data, exps }));
        });
      });
    }
  }


// displaying

export type GrammarDisplayer<Meta, Rule, Data, A> =
  (meta: Meta, rule: Rule) =>
    (children: List<GrammarDisplayerChild<Meta, Rule, Data, A>>) =>
      GrammarDisplayerChild<Meta, Rule, Data, A>

export type GrammarDisplayerChild<Meta, Rule, Data, A> = { exp: Expression<Meta, Rule, Data>, out: A };

export function displayExpression<Meta, Rule, Data, A>(
  grammarDisplayer: GrammarDisplayer<Meta, Rule, Data, A>,
  exp: Expression<Meta, Rule, Data>
): GrammarDisplayerChild<Meta, Rule, Data, A> {
  return grammarDisplayer(exp.meta, exp.rule)(exp.exps.map(e => displayExpression(grammarDisplayer, e)));
}
