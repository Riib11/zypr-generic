import { Record, RecordOf } from "immutable"
import { Expression, GrammarDisplayer, GrammarDisplayerKid, displayExpression, Grammar, GrammarDisplayerOut } from "./Grammar"
import { displayZipper, wrapExpStep, zipDown, zipDownExp, zipLeft, Zipper, zipRight, zipUp } from "./Zipper"

export type SelectProps<M extends string, R extends string, D> = {
  zipTop: Zipper<M, R, D>,
  zipBot: Zipper<M, R, D>
  exp: Expression<M, R, D>,
  // orient = 'top' implies zipBot is reversed
  // orient = 'bot' implies zipBot is not reversed
  orient: SelectOrientation
}

export type SelectOrientation = 'top' | 'bot'

export type Select<M extends string, R extends string, D> = RecordOf<SelectProps<M, R, D>>

export function makeSelect<M extends string, R extends string, D>(props: SelectProps<M, R, D>): Select<M, R, D> { return Record(props)() }

// orient = 'top' implies zipBot is reversed
// orient = 'bot' implies zipBot is not reversed
export function fixZipBot<M extends string, R extends string, D>(
  orient: SelectOrientation,
  zipBot: Zipper<M, R, D>
):
  Zipper<M, R, D> {
  switch (orient) {
    case 'top': return zipBot.reverse()
    case 'bot': return zipBot
  }
}

export function moveUpSelect<M extends string, R extends string, D>(
  grammar: Grammar<M, R, D>,
  select: Select<M, R, D>
): Select<M, R, D> | undefined {
  switch (select.orient) {
    case 'top': {
      const res = zipUp(select.zipTop)
      if (res === undefined) return undefined
      const [step, zipTop] = res
      return select
        .set('zipTop', zipTop)
        .set('zipBot', select.zipBot.unshift(step))
    }
    case 'bot': {
      const res = zipUp(select.zipBot)
      if (res === undefined) return undefined
      const [step, zipBot] = res
      return select
        .set('zipBot', zipBot)
        .set('exp', wrapExpStep(grammar, step, select.exp))
    }
  }
}

export function moveLeftSelect<M extends string, R extends string, D>(select: Select<M, R, D>): Select<M, R, D> | undefined {
  switch (select.orient) {
    case 'top': {
      return undefined
    }
    case 'bot': {
      const res = zipLeft(select.exp, select.zipBot)
      if (res === undefined) return undefined
      const [exp, zipBot] = res
      return select
        .set('zipBot', zipBot)
        .set('exp', exp)
    }
  }
}

export function moveRightSelect<M extends string, R extends string, D>(select: Select<M, R, D>): Select<M, R, D> | undefined {
  switch (select.orient) {
    case 'top': {
      return undefined
    }
    case 'bot': {
      const res = zipRight(select.exp, select.zipBot)
      if (res === undefined) return undefined
      const [exp, zipBot] = res
      return select
        .set('zipBot', zipBot)
        .set('exp', exp)
    }
  }
}

export function moveDownSelect<M extends string, R extends string, D>(i: number, select: Select<M, R, D>): Select<M, R, D> | undefined {
  switch (select.orient) {
    case 'top': {
      const res = zipDown(i, select.zipBot)
      if (res === undefined) return undefined
      const [step, zipBot] = res
      return select
        .set('zipTop', select.zipTop.unshift(step))
        .set('zipBot', zipBot)
    }
    case 'bot': {
      const res = zipDownExp(i, select.exp)
      if (res === undefined) return undefined
      const [step, exp] = res
      return select
        .set('zipBot', select.zipBot.unshift(step))
        .set('exp', exp)
    }
  }
}

export function displaySelect<M extends string, R extends string, D, A, E>(
  grammar: Grammar<M, R, D>,
  displayGrammar: GrammarDisplayer<M, R, D, A, E>,
  wrapZip: (out: GrammarDisplayerOut<A, E>) => GrammarDisplayerOut<A, E>,
  wrapExp: (out: GrammarDisplayerOut<A, E>) => GrammarDisplayerOut<A, E>,
  select: Select<M, R, D>
): GrammarDisplayerKid<M, R, D, A, E> {
  const { exp: exp0, out: out0 } = displayExpression(displayGrammar, select.exp)
  const { exp: exp1, out: out1 } = displayZipper(grammar, displayGrammar, fixZipBot(select.orient, select.zipBot))({ exp: exp0, out: wrapExp(out0) })
  return displayZipper(grammar, displayGrammar, select.zipTop)({ exp: exp1, out: wrapZip(out1) })
}