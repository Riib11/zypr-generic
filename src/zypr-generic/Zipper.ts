import { List, Record, RecordOf } from "immutable";
import { Expression, GrammarPrinter, GrammarPrinterChild, makeExpression, printExpression } from "./Grammar";

export type Zipper<Meta, Rule> = List<Step<Meta, Rule>>;

export type StepProps<Meta, Rule> = {
  meta: Meta,
  rule: Rule,
  leftsRev: List<Expression<Meta, Rule>>,
  rights: List<Expression<Meta, Rule>>
}

export type Step<Meta, Rule> = RecordOf<StepProps<Meta, Rule>>

export function makeStep<Meta, Rule>(props: StepProps<Meta, Rule>): Step<Meta, Rule> { return Record(props)(); }

export function wrap<Meta, Rule>(zipTop: Zipper<Meta, Rule>, zipBot: Zipper<Meta, Rule>): Zipper<Meta, Rule> {
  return zipTop.concat(zipBot);
}

export function wrapExp<Meta, Rule>(zip: Zipper<Meta, Rule>, exp: Expression<Meta, Rule>): Expression<Meta, Rule> {
  const step = zip.get(0);
  if (step === undefined) return exp;
  return wrapExp(zip.shift(), wrapExpStep(step, exp));
}

export function wrapExpStep<Meta, Rule>(step: Step<Meta, Rule>, exp: Expression<Meta, Rule>): Expression<Meta, Rule> {
  return makeExpression({
    meta: step.meta,
    rule: step.rule,
    exps: step.leftsRev.reverse().concat([exp]).concat(step.rights)
  });
}

export function zipUp<Meta, Rule>(zip: Zipper<Meta, Rule>):
  [Step<Meta, Rule>, Zipper<Meta, Rule>] | undefined {
  const step = zip.get(0);
  if (step === undefined) return undefined;
  return [step, zip.shift()];
}

export function zipLeft<Meta, Rule>(
  exp: Expression<Meta, Rule>,
  zipRev: Zipper<Meta, Rule>,
):
  [Expression<Meta, Rule>, Zipper<Meta, Rule>] | undefined {
  const step = zipRev.get(0);
  if (step === undefined) return undefined;

  const sibLeft = step.leftsRev.get(0);
  if (sibLeft === undefined) return undefined;

  return [
    sibLeft,
    zipRev.shift().unshift(
      step
        .set('leftsRev', step.leftsRev.shift())
        .set('rights', step.rights.unshift(exp))
    )];
}

export function zipRight<Meta, Rule>(
  exp: Expression<Meta, Rule>,
  zipRev: Zipper<Meta, Rule>
):
  [Expression<Meta, Rule>, Zipper<Meta, Rule>] | undefined {
  const step = zipRev.get(0);
  if (step === undefined) return undefined;

  const sibRight = step.rights.get(0);
  if (sibRight === undefined) return undefined;

  return [
    sibRight,
    zipRev.shift().unshift(
      step
        .set('leftsRev', step.leftsRev.unshift(exp))
        .set('rights', step.rights.shift())
    )];
}

export function zipDown<Meta, Rule>(
  i: number,
  zipRev: Zipper<Meta, Rule>
):
  [Step<Meta, Rule>, Zipper<Meta, Rule>] | undefined {

  const step = zipRev.get(0);
  if (step === undefined) return undefined;
  return [
    step,
    zipRev.shift()
  ];
}

export function zipDownExp<Meta, Rule>(
  i: number,
  exp: Expression<Meta, Rule>
):
  [Step<Meta, Rule>, Expression<Meta, Rule>] | undefined {
  const expChild = exp.exps.get(i);
  if (expChild === undefined) return undefined;
  const leftsRev = exp.exps.slice(0, i);
  const rights = exp.exps.slice(i - 1, undefined);

  return [
    makeStep({
      meta: exp.meta,
      rule: exp.rule,
      leftsRev,
      rights
    }),
    expChild
  ];
}

export function printZipper<Meta, Rule>(
  grammarPrinter: GrammarPrinter<Meta, Rule>,
  zip: Zipper<Meta, Rule>,
): (child: GrammarPrinterChild<Meta, Rule>) => GrammarPrinterChild<Meta, Rule> {
  return ({ exp, str }) => {
    let step = zip.get(0);
    if (step === undefined) return { exp, str };
    return (
      printZipper(grammarPrinter, zip.shift())
        (printStep(grammarPrinter, step)({ exp, str })));
  }
}

export function printStep<Meta, Rule>(
  grammarPrinter: GrammarPrinter<Meta, Rule>,
  step: Step<Meta, Rule>,
): (child: GrammarPrinterChild<Meta, Rule>) => GrammarPrinterChild<Meta, Rule> {
  return ({ exp, str }) =>
    grammarPrinter(step.meta, step.rule)
      (step.leftsRev.reverse().map(e => printExpression(grammarPrinter, e))
        .concat(List<GrammarPrinterChild<Meta, Rule>>([{ exp, str }]))
        .concat(step.rights.map(e => printExpression(grammarPrinter, e)))
      );
}

// export function showZipper<Meta, Rule>(zip: Zipper<Meta, Rule>): 
// (child: GrammarPrinterChild<Meta, Rule>) => GrammarPrinterChild<Meta, Rule> {
//   return ([exp, str]) => {
//     let step = zip.get(0);
//     if (step === undefined) return str;
//     return showZipper(zip.shift())(showStep(step)(str));
//   }
// }

// export function showStep<Meta, Rule>(step: Step<Meta, Rule>):
//  (child: GrammarPrinterChild<Meta, Rule>) => GrammarPrinterChild<Meta, Rule> {
//   return ([exp, str]) =>
//     "Z(" +
//     "meta:" + step.meta + " " +
//     "rule:" + step.rule + " " +
//     "lefts:[" + step.leftsRev.reverse().map(e => showExpression(e)).join(" ") + "]" + " " +
//     "str:" + str + " " +
//     "rights:[" + step.rights.map(e => showExpression(e)).join(" ") + "]" + " " +
//     ")";
// }