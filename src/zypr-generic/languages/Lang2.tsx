import { defaultEditorPrinter, defaultEditorRenderer } from '../EditorDefaults'
import { makeGrammarDisplayer } from '../Grammar'
import * as Lang1 from './Lang1'
import { M, R, D, E } from './Lang1'

/*
Features
- only expressions
- vars and apps
- parens for partial apps are hidden
*/

// printer

export const grammarPrinter = makeGrammarDisplayer<M, R, D, string, E>((exp, kids) => {
  switch (exp.rule) {
    case 'var':
      return _ => [(exp.data as { label: string }).label]
    case 'app': {
      const [apl, arg] = [kids.get(0), kids.get(1)]
      if (arg?.exp.rule === 'app')
        return _ => [`${apl?.out('unit')?.join("")} (${arg?.out('unit')?.join("")})`]
      else
        return _ => [`${apl?.out('unit')?.join("")} ${arg?.out('unit')?.join("")}`]
    }
    case 'hole':
      return _ => ["?"]
  }
})

export const grammarRenderer = makeGrammarDisplayer<M, R, D, JSX.Element, E>((exp, kids) => {
  switch (exp.rule) {
    case 'var':
      return _ => [<div className="exp exp-var">{(exp.data as { label: string }).label}</div>]
    case 'app': {
      const [apl, arg] = [kids.get(0), kids.get(1)]
      if (arg?.exp.rule === 'app')
        return _ => [<div className="exp exp-app">{kids.get(0)?.out('unit')} ({kids.get(1)?.out('unit')})</div>]
      else
        return _ => [<div className="exp exp-app">{kids.get(0)?.out('unit')} {kids.get(1)?.out('unit')}</div>]
    }
    case 'hole':
      return _ => [<div className="exp exp-hole">?</div>]
  }
})

// editor

export const editorInit =
  Lang1.editorInit
    .set('renderer', defaultEditorRenderer(Lang1.grammar, grammarRenderer, 'unit'))
    .set('printer', defaultEditorPrinter(Lang1.grammar, grammarPrinter, 'unit'))
