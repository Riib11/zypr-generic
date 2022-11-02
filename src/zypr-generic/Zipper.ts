import { List, Record, RecordOf } from "immutable"
import { displayExpression, Expression, Grammar, GrammarDisplayer, GrammarDisplayerKid, makeExpression } from "./Grammar"

export type Zipper<M extends string, R extends string, D> = List<Step<M, R, D>>

export type StepProps<M extends string, R extends string, D> = {
  meta: M,
  rule: R,
  data: D,
  leftsRev: List<Expression<M, R, D>>,
  rights: List<Expression<M, R, D>>
}

export type Step<M extends string, R extends string, D> = RecordOf<StepProps<M, R, D>>

export function makeStep<M extends string, R extends string, D>(props: StepProps<M, R, D>): Step<M, R, D> { return Record(props)() }

export function wrap<M extends string, R extends string, D>
  (
    zipTop: Zipper<M, R, D>,
    zipBot: Zipper<M, R, D>
  ): Zipper<M, R, D> {
  return zipBot.concat(zipTop)
}

export function wrapExp<M extends string, R extends string, D>
  (
    grammar: Grammar<M, R, D>,
    zip: Zipper<M, R, D>,
    exp: Expression<M, R, D>
  ): Expression<M, R, D> {
  const step = zip.get(0)
  if (step === undefined) return exp
  return wrapExp(grammar, zip.shift(), wrapExpStep(grammar, step, exp))
}

export function wrapExpStep<M extends string, R extends string, D>
  (grammar: Grammar<M, R, D>, step: Step<M, R, D>, exp: Expression<M, R, D>):
  Expression<M, R, D> {
  return makeExpression(grammar, {
    meta: step.meta,
    rule: step.rule,
    data: step.data,
    kids: step.leftsRev.reverse().concat([exp]).concat(step.rights)
  })
}

export function zipUp<M extends string, R extends string, D>(zip: Zipper<M, R, D>):
  [Step<M, R, D>, Zipper<M, R, D>] | undefined {
  const step = zip.get(0)
  if (step === undefined) return undefined
  return [step, zip.shift()]
}

export function zipLeft<M extends string, R extends string, D>(
  exp: Expression<M, R, D>,
  zipRev: Zipper<M, R, D>,
):
  [Expression<M, R, D>, Zipper<M, R, D>] | undefined {
  const step = zipRev.get(0)
  if (step === undefined) return undefined

  const sibLeft = step.leftsRev.get(0)
  if (sibLeft === undefined) return undefined

  return [
    sibLeft,
    zipRev.shift().unshift(
      step
        .set('leftsRev', step.leftsRev.shift())
        .set('rights', step.rights.unshift(exp))
    )]
}

export function zipRight<M extends string, R extends string, D>(
  exp: Expression<M, R, D>,
  zipRev: Zipper<M, R, D>
):
  [Expression<M, R, D>, Zipper<M, R, D>] | undefined {
  const step = zipRev.get(0)
  if (step === undefined) return undefined

  const sibRight = step.rights.get(0)
  if (sibRight === undefined) return undefined

  return [
    sibRight,
    zipRev.shift().unshift(
      step
        .set('leftsRev', step.leftsRev.unshift(exp))
        .set('rights', step.rights.shift())
    )]
}

export function zipDown<M extends string, R extends string, D>(
  i: number,
  zipRev: Zipper<M, R, D>
):
  [Step<M, R, D>, Zipper<M, R, D>] | undefined {

  const step = zipRev.get(0)
  if (step === undefined) return undefined
  return [
    step,
    zipRev.shift()
  ]
}

export function zipDownExp<M extends string, R extends string, D>(
  i: number,
  exp: Expression<M, R, D>
):
  [Step<M, R, D>, Expression<M, R, D>] | undefined {
  const expKid = exp.kids.get(i)
  if (expKid === undefined) return undefined
  const leftsRev = exp.kids.slice(0, i)
  const rights = exp.kids.slice(i - 1, undefined)

  return [
    makeStep({
      meta: exp.meta,
      rule: exp.rule,
      data: exp.data,
      leftsRev,
      rights
    }),
    expKid
  ]
}

// displaying

export function displayZipper<M extends string, R extends string, D, A>(
  grammar: Grammar<M, R, D>,
  grammarDisplayer: GrammarDisplayer<M, R, D, A>,
  zip: Zipper<M, R, D>,
): (kid: GrammarDisplayerKid<M, R, D, A>) => GrammarDisplayerKid<M, R, D, A> {
  return ({ exp, out }) => {
    let step = zip.get(0)
    if (step === undefined) return { exp, out }
    return (
      displayZipper(grammar, grammarDisplayer, zip.shift())
        (displayStep(grammar, grammarDisplayer, step)({ exp, out })))
  }
}

export function displayStep<M extends string, R extends string, D, A>(
  grammar: Grammar<M, R, D>,
  grammarDisplayer: GrammarDisplayer<M, R, D, A>,
  step: Step<M, R, D>,
): (kid: GrammarDisplayerKid<M, R, D, A>) => GrammarDisplayerKid<M, R, D, A> {
  return ({ exp, out }) =>
    grammarDisplayer(
      wrapExpStep(grammar, step, exp),
      step.leftsRev.reverse().map(e => displayExpression(grammarDisplayer, e))
        .concat(List([{ exp, out }]))
        .concat(step.rights.map(e => displayExpression(grammarDisplayer, e))))
}

