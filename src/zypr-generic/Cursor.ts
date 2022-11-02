import { Record, RecordOf } from "immutable"
import { displayExpression, Expression, Grammar, GrammarDisplayer, GrammarDisplayerKid } from "./Grammar"
import { zipLeft, zipRight, Zipper, zipDownExp, zipUp, wrapExpStep, displayZipper } from "./Zipper"

export type CursorProps<M extends string, R extends string, D> = {
  zip: Zipper<M, R, D>,
  exp: Expression<M, R, D>,
}

export type Cursor<M extends string, R extends string, D> = RecordOf<CursorProps<M, R, D>>

export function makeCursor<M extends string, R extends string, D>(props: CursorProps<M, R, D>): Cursor<M, R, D> { return Record(props)() }

export function moveUpCursor<M extends string, R extends string, D>(
  grammar: Grammar<M, R, D>,
  cursor: Cursor<M, R, D>
): Cursor<M, R, D> | undefined {
  const res = zipUp(cursor.zip)
  if (res === undefined) return undefined
  const [step, zip] = res
  return cursor
    .set('exp', wrapExpStep(grammar, step, cursor.exp))
    .set('zip', zip)
}

export function moveLeftCursor<M extends string, R extends string, D>(cursor: Cursor<M, R, D>): Cursor<M, R, D> | undefined {
  const res = zipLeft(cursor.exp, cursor.zip)
  if (res === undefined) return undefined
  const [exp, zip] = res
  return cursor
    .set('exp', exp)
    .set('zip', zip)
}

export function moveRightCursor<M extends string, R extends string, D>(cursor: Cursor<M, R, D>): Cursor<M, R, D> | undefined {
  const res = zipRight(cursor.exp, cursor.zip)
  if (res === undefined) return undefined
  const [exp, zip] = res
  return cursor
    .set('exp', exp)
    .set('zip', zip)
}

export function moveDownCursor<M extends string, R extends string, D>(i: number, cursor: Cursor<M, R, D>): Cursor<M, R, D> | undefined {
  const res = zipDownExp(i, cursor.exp)
  if (res === undefined) return undefined
  const [step, exp] = res
  return cursor
    .set('exp', exp)
    .set('zip', cursor.zip.unshift(step))
}

export function displayCursor<M extends string, R extends string, D, A>(
  grammar: Grammar<M, R, D>,
  grammarDisplayer: GrammarDisplayer<M, R, D, A>,
  wrapExp: (out: A[]) => A[],
  cursor: Cursor<M, R, D>
): GrammarDisplayerKid<M, R, D, A> {
  const { exp, out } = displayExpression(grammarDisplayer, cursor.exp)
  // console.log("cursor.zip out", displayZipper(grammarDisplayer, cursor.zip)({ exp, out: "@@" as unknown as A[] }).out)
  // console.log("cursor.exp out:", out)
  return displayZipper(
    grammar,
    grammarDisplayer,
    cursor.zip)
    ({ exp, out: wrapExp(out) })
}
