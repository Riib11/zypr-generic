import { defaultEditorPrinter, defaultEditorRenderer } from '../EditorDefaults'
import { makeGrammarDisplayer } from '../Grammar'
import * as Lang1 from './Lang1'
import { M, R, D } from './Lang1'

/*
Features
- only expressions
- vars and apps
- parens for partial apps are hidden
- indentation
*/

// editor

export const editorInit =
  Lang1.editorInit
