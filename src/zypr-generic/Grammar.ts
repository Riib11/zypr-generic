import { List, Record, RecordOf } from 'immutable';

export type Grammar<Meta, Rule> =
  (meta: Meta) => (rule: Rule) => List<Meta>

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

// printing

export type GrammarPrinter<Meta, Rule> =
  (meta: Meta, rule: Rule) =>
    (children: List<GrammarPrinterChild<Meta, Rule>>) =>
      GrammarPrinterChild<Meta, Rule>

export type GrammarPrinterChild<Meta, Rule> = { exp: Expression<Meta, Rule>, str: string };

export function printExpression<Meta, Rule>(
  grammarPrinter: GrammarPrinter<Meta, Rule>,
  exp: Expression<Meta, Rule>
): GrammarPrinterChild<Meta, Rule> {
  return (
    grammarPrinter(exp.meta, exp.rule)
      (exp.exps.map(e => printExpression(grammarPrinter, e))));
}

// rendering

// export type GrammarRenderer<Meta, Rule> =
//   (meta: Meta, rule: Rule) => (children: List<GrammarRendererChild<Meta, Rule>>) => string

// export type GrammarRendererChild<Meta, Rule> = 
//   {exp:Expression<Meta, Rule>, html: JSX.Element}

// export function renderExpression<Meta, Rule>(
//   grammarRenderer: GrammarRenderer<Meta, Rule>,
//   exp: Expression<Meta, Rule>
// )

// show

// export function showExpression<Meta, Rule>(exp: Expression<Meta, Rule>): string {
//   return (
//     "E(" +
//     "meta:" + exp.meta + " " +
//     "rule:" + exp.rule + " " +
//     "exps:[" + exp.exps.map(e => showExpression(e)).join(" ") + "]" + " " +
//     ")"
//   );
// }