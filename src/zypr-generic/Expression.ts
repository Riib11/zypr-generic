import { List, Record, RecordOf } from "immutable";
import { Grammar, GrammarPrinter as GrammarPrinter } from "./Grammar";

export type ExpressionProps<Meta, Rule> = {
  meta: Meta,
  rule: Rule,
  exps: List<Expression<Meta, Rule>>
}

export type Expression<Meta, Rule> = RecordOf<ExpressionProps<Meta, Rule>>

export function makeExpression<Meta, Rule>(props: ExpressionProps<Meta, Rule>): Expression<Meta, Rule> {
  return Record(props)();
}

export function printExpression<Meta, Rule>(
  grammarPrinter: GrammarPrinter<Meta, Rule>,
  exp: Expression<Meta, Rule>,
): string {
  return (
    grammarPrinter(exp.meta, exp.rule)
      (exp.exps.map(e => printExpression(grammarPrinter, e))));
}

export function showExpression<Meta, Rule>(exp: Expression<Meta, Rule>): string {
  return (
    "E(" +
    "meta:" + exp.meta + " " +
    "rule:" + exp.rule + " " +
    "exps:[" + exp.exps.map(e => showExpression(e)).join(" ") + "]" + " " +
    ")"
  );
}