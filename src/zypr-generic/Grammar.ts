import { List, Record, RecordOf } from 'immutable'

export type Grammar<M extends string, R extends string, D> =
  {
    rules: { [meta in M]: R[] },
    data: { [rule in R]: D },
    kids: { [rule in R]: List<M> },
    holeRule: { [meta in M]: R },
    holeData: { [meta in M]: D }
  }

export function makeGrammar<M extends string, R extends string, D>
  (grammar: Grammar<M, R, D>): Grammar<M, R, D> {
  // TODO: check that `grammar.rules` is injective
  return grammar
}

// expression

export type ExpressionProps<M, R, D> = {
  meta: M,
  rule: R,
  data: D,
  kids: List<Expression<M, R, D>>
}
export type Expression<M, R, D> =
  RecordOf<ExpressionProps<M, R, D>>

export function makeExpression<M extends string, R extends string, D>
  (grammar: Grammar<M, R, D>, exp: ExpressionProps<M, R, D>):
  Expression<M, R, D> {
  // TODO: check valid
  return Record(exp)()
}

export function makeHole<M extends string, R extends string, D>
  (grammar: Grammar<M, R, D>, meta: M): Expression<M, R, D> {
  return makeExpression(grammar, {
    meta,
    rule: grammar.holeRule[meta],
    data: grammar.holeData[meta],
    kids: List([])
  })
}

// displaying

export type GrammarDisplayerOut<A, E> = (env: E) => A[]

export type GrammarDisplayerKid<M, R, D, A, E> =
  { exp: Expression<M, R, D>, out: GrammarDisplayerOut<A, E> }


export type GrammarDisplayer
  <M extends string, R extends string, D, A, E> = (
    exp: Expression<M, R, D>,
    kids: List<GrammarDisplayerKid<M, R, D, A, E>>
  ) =>
    GrammarDisplayerKid<M, R, D, A, E>

export function makeGrammarDisplayer
  <M extends string, R extends string, D, A, E>(
    f: (
      exp: Expression<M, R, D>,
      kids: List<GrammarDisplayerKid<M, R, D, A, E>>
    ) => GrammarDisplayerOut<A, E>) {
  return (
    exp: Expression<M, R, D>,
    kids: List<GrammarDisplayerKid<M, R, D, A, E>>
  ) =>
    ({ exp, out: f(exp, kids) })
}

export function displayExpression
  <M extends string, R extends string, D, A, E>(
    grammarDisplayer: GrammarDisplayer<M, R, D, A, E>,
    exp: Expression<M, R, D>
  ): GrammarDisplayerKid<M, R, D, A, E> {
  return grammarDisplayer(exp,
    exp.kids.map(exp => displayExpression(grammarDisplayer, exp)))
}
