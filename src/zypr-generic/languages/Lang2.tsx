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
      return env => [(exp.data as { label: string }).label]
    case 'app': {
      const [apl, arg] = [kids.get(0), kids.get(1)]
      if (arg?.exp.rule === 'app')
        return env => [`${apl?.out(env)?.join("")} (${arg?.out(env)?.join("")})`]
      else
        return env => [`${apl?.out(env)?.join("")} ${arg?.out(env)?.join("")}`]
    }
    case 'hole':
      return env => ["?"]
  }
})

export const grammarRenderer = makeGrammarDisplayer<M, R, D, JSX.Element, E>((exp, kids) => {
  switch (exp.rule) {
    case 'var':
      return env => [<div className="exp exp-var">{(exp.data as { label: string }).label}</div>]
    case 'app': {
      const [apl, arg] = [kids.get(0), kids.get(1)]
      if (arg?.exp.rule === 'app')
        return env0 => {
          const env1 = Lang1.incrementIndent(env0)
          return [<div className="exp exp-app">{apl?.out(env0)}{Lang1.renderIndent(env1.indent)}({arg?.out(env1)})</div>]
        }
      else
        return env0 => {
          const env1 = Lang1.incrementIndent(env0)
          return [<div className="exp exp-app">{apl?.out(env0)}{Lang1.renderIndent(env1.indent)}{arg?.out(env1)}</div>]
        }
    }
    case 'hole':
      return env => [<div className="exp exp-hole">?</div>]
  }
})

// editor

export const editorInit =
  Lang1.editorInit
    .set('renderer', defaultEditorRenderer(Lang1.grammar, grammarRenderer, Lang1.initDisplayEnv))
    .set('printer', defaultEditorPrinter(Lang1.grammar, grammarPrinter, Lang1.initDisplayEnv))
