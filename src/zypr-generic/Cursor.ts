import { Record, RecordOf } from "immutable";
import { Expression, printExpression, showExpression } from "./Expression";
import { GrammarPrinter } from "./Grammar";
import { zipLeft, zipRight, wrapExp, Zipper, zipDownExp, zipUp, printZipper, wrapExpStep, showZipper } from "./Zipper";

export type CursorProps<Meta, Rule> = {
  zip: Zipper<Meta, Rule>,
  exp: Expression<Meta, Rule>,
}

export type Cursor<Meta, Rule> = RecordOf<CursorProps<Meta, Rule>>;

export function makeCursor<Meta, Rule>(props: CursorProps<Meta, Rule>): Cursor<Meta, Rule> { return Record(props)(); }

export function moveUpCursor<Meta, Rule>(cursor: Cursor<Meta, Rule>):
  Cursor<Meta, Rule> | undefined {
  const res = zipUp(cursor.zip);
  if (res === undefined) return undefined;
  const [step, zip] = res;
  return cursor
    .set('exp', wrapExpStep(step, cursor.exp))
    .set('zip', zip);
}

export function moveLeftCursor<Meta, Rule>(cursor: Cursor<Meta, Rule>): Cursor<Meta, Rule> | undefined {
  const res = zipLeft(cursor.exp, cursor.zip);
  if (res === undefined) return undefined;
  const [exp, zip] = res;
  return cursor
    .set('exp', exp)
    .set('zip', zip);
}

export function moveRightCursor<Meta, Rule>(cursor: Cursor<Meta, Rule>): Cursor<Meta, Rule> | undefined {
  const res = zipRight(cursor.exp, cursor.zip);
  if (res === undefined) return undefined;
  const [exp, zip] = res;
  return cursor
    .set('exp', exp)
    .set('zip', zip);
}

export function moveDownCursor<Meta, Rule>(i: number, cursor: Cursor<Meta, Rule>): Cursor<Meta, Rule> | undefined {
  const res = zipDownExp(i, cursor.exp);
  if (res === undefined) return undefined;
  const [step, exp] = res;
  return cursor
    .set('exp', exp)
    .set('zip', cursor.zip.unshift(step));
}

export function printCursor<Meta, Rule>(grammarPrinter: GrammarPrinter<Meta, Rule>, cursor: Cursor<Meta, Rule>): string {
  return (
    printZipper(grammarPrinter, cursor.zip)
      ("{" + printExpression(grammarPrinter, cursor.exp) + "}")
  );
}

export function showCursor<Meta, Rule>(cursor: Cursor<Meta, Rule>): string {
  return (
    showZipper(cursor.zip)
      ("{" + showExpression(cursor.exp)) + "}");
}
