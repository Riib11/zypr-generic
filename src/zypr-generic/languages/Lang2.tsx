import { defaultEditorPrinter, defaultEditorRenderer } from '../EditorDefaults'
import { makeGrammarDisplayer } from '../Grammar'
import * as Lang1 from './Lang1'
import { M, R, D } from './Lang1'

/*
Features
- only expressions
- vars and apps
- parens for partial apps are hidden
*/

// printer

export const grammarPrinter = makeGrammarDisplayer<M, R, D, string>((exp, kids) => {
  switch (exp.rule) {
    case 'var':
      return [(exp.data as { label: string }).label]
    case 'app': {
      const [apl, arg] = [kids.get(0), kids.get(1)]
      if (arg?.exp.rule === 'app')
        return [`${apl?.out?.join("")} (${arg?.out?.join("")})`]
      else
        return [`${apl?.out?.join("")} ${arg?.out?.join("")}`]
    }
    case 'hole':
      return ["?"]
  }
})

export const grammarRenderer = makeGrammarDisplayer<M, R, D, JSX.Element>((exp, kids) => {
  switch (exp.rule) {
    case 'var':
      return [<div className="exp exp-var">{(exp.data as { label: string }).label}</div>]
    case 'app': {
      const [apl, arg] = [kids.get(0), kids.get(1)]
      if (arg?.exp.rule === 'app')
        return [<div className="exp exp-app">{kids.get(0)?.out} ({kids.get(1)?.out})</div>]
      else
        return [<div className="exp exp-app">{kids.get(0)?.out} {kids.get(1)?.out}</div>]
    }
    case 'hole':
      return [<div className="exp exp-hole">?</div>]
  }
})

// editor

export const editorInit =
  Lang1.editorInit
    .set('renderer', defaultEditorRenderer(Lang1.grammar, grammarRenderer))
    .set('printer', defaultEditorPrinter(Lang1.grammar, grammarPrinter))
