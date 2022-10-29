import { Record, RecordOf } from "immutable";
import { Expression, GrammarDisplayer, GrammarDisplayerChild, displayExpression } from "./Grammar";
import { displayZipper, wrapExpStep, zipDown, zipDownExp, zipLeft, Zipper, zipRight, zipUp } from "./Zipper";

export type SelectProps<Meta, Rule> = {
  zipTop: Zipper<Meta, Rule>,
  zipBot: Zipper<Meta, Rule>
  exp: Expression<Meta, Rule>,
  // orient = 'top' implies zipBot is reversed
  // orient = 'bot' implies zipBot is not reversed
  orient: SelectOrientation
}

export type SelectOrientation = 'top' | 'bot';

export type Select<Meta, Rule> = RecordOf<SelectProps<Meta, Rule>>;

export function makeSelect<Meta, Rule>(props: SelectProps<Meta, Rule>): Select<Meta, Rule> { return Record(props)(); }

// orient = 'top' implies zipBot is reversed
// orient = 'bot' implies zipBot is not reversed
export function fixZipBot<Meta, Rule>(
  orient: SelectOrientation,
  zipBot: Zipper<Meta, Rule>
):
  Zipper<Meta, Rule> {
  switch (orient) {
    case 'top': return zipBot.reverse();
    case 'bot': return zipBot;
  }
}

export function moveUpSelect<Meta, Rule>(select: Select<Meta, Rule>): Select<Meta, Rule> | undefined {
  switch (select.orient) {
    case 'top': {
      const res = zipUp(select.zipTop);
      if (res === undefined) return undefined;
      const [step, zipTop] = res;
      return select
        .set('zipTop', zipTop)
        .set('zipBot', select.zipBot.unshift(step));
    }
    case 'bot': {
      const res = zipUp(select.zipBot);
      if (res === undefined) return undefined;
      const [step, zipBot] = res;
      return select
        .set('zipBot', zipBot)
        .set('exp', wrapExpStep(step, select.exp));
    }
  }
}

export function moveLeftSelect<Meta, Rule>(select: Select<Meta, Rule>): Select<Meta, Rule> | undefined {
  switch (select.orient) {
    case 'top': {
      return undefined;
    }
    case 'bot': {
      const res = zipLeft(select.exp, select.zipBot);
      if (res === undefined) return undefined;
      const [exp, zipBot] = res;
      return select
        .set('zipBot', zipBot)
        .set('exp', exp);
    }
  }
}

export function moveRightSelect<Meta, Rule>(select: Select<Meta, Rule>): Select<Meta, Rule> | undefined {
  switch (select.orient) {
    case 'top': {
      return undefined;
    }
    case 'bot': {
      const res = zipRight(select.exp, select.zipBot);
      if (res === undefined) return undefined;
      const [exp, zipBot] = res;
      return select
        .set('zipBot', zipBot)
        .set('exp', exp);
    }
  }
}

export function moveDownSelect<Meta, Rule>(i: number, select: Select<Meta, Rule>): Select<Meta, Rule> | undefined {
  switch (select.orient) {
    case 'top': {
      const res = zipDown(i, select.zipBot);
      if (res === undefined) return undefined;
      const [step, zipBot] = res;
      return select
        .set('zipTop', select.zipTop.unshift(step))
        .set('zipBot', zipBot);
    }
    case 'bot': {
      const res = zipDownExp(i, select.exp);
      if (res === undefined) return undefined;
      const [step, exp] = res;
      return select
        .set('zipBot', select.zipBot.unshift(step))
        .set('exp', exp);
    }
  }
}

export function displaySelect<Meta, Rule, A>(displayGrammar: GrammarDisplayer<Meta, Rule, A>, wrapZip: (out: A) => A, wrapExp: (out: A) => A, select: Select<Meta, Rule>): GrammarDisplayerChild<Meta, Rule, A> {
  const { exp: exp0, out: out0 } = displayExpression(displayGrammar, select.exp);
  const { exp: exp1, out: out1 } = displayZipper(displayGrammar, fixZipBot(select.orient, select.zipBot))({ exp: exp0, out: wrapExp(out0) });
  return displayZipper(displayGrammar, select.zipTop)({ exp: exp1, out: wrapZip(out1) });
}