import { List, Record, RecordOf } from "immutable";
import { Grammar, Item } from "./Grammar";

export type ExpressionProps<Meta, Rule> = {
  meta: Meta,
  rule: Rule,
  exps: List<Expression<Meta, Rule>>
}

export type Expression<Meta, Rule> = RecordOf<ExpressionProps<Meta, Rule>>

export function makeExpression<Meta, Rule>(props: ExpressionProps<Meta, Rule>): Expression<Meta, Rule> {
  return Record(props)();
}