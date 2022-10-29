import { List } from 'immutable';
import React from 'react';
import './App.css';
import { makeCursor } from './zypr-generic/Cursor';
import { Editor, escapeSelect, makeEditor, moveEditorCursorDown, moveEditorCursorLeft, moveEditorCursorRight, moveEditorCursorUp, moveEditorSelectDown, moveEditorSelectLeft, moveEditorSelectRight, moveEditorSelectUp, printEditor } from './zypr-generic/Editor';
import { Expression, makeExpression } from './zypr-generic/Grammar';

type Meta1 = 'exp';
type Rule1
  = { case: 'app' }
  | { case: 'var', label: string };

const mkApp = (apl: Expression<Meta1, Rule1>, arg: Expression<Meta1, Rule1>): Expression<Meta1, Rule1> =>
  makeExpression({ meta: 'exp', rule: { case: 'app' }, exps: List([apl, arg]) });
const mkVar = (label: string): Expression<Meta1, Rule1> =>
  makeExpression({ meta: 'exp', rule: { case: 'var', label }, exps: List() });

type AppProps = {}

type AppState = {
  editor: Editor<Meta1, Rule1>,
  history: List<Editor<Meta1, Rule1>>,
  future: List<Editor<Meta1, Rule1>>
}

export default class App extends React.Component<AppProps, AppState> {
  state = {
    editor: makeEditor<Meta1, Rule1>({
      grammar: ((meta) => (rule) => {
        switch (meta) {
          case 'exp': {
            switch (rule.case) {
              case 'var': return List();
              case 'app': return List(['exp', 'exp']);
            }
          }
        }
      }),
      grammarPrinter: (meta, rule) => (children) => {
        switch (meta) {
          case 'exp': {
            switch (rule.case) {
              case 'var': return {
                exp: makeExpression({ meta, rule, exps: children.map(child => child.exp) }),
                str: rule.label
              };
              case 'app': return {
                exp: makeExpression({ meta, rule, exps: children.map(child => child.exp) }),
                str: `(${children.get(0)?.str} ${children.get(1)?.str})`
              };
            }
          }
        }
      },
      mode: {
        case: 'cursor',
        cursor: makeCursor({
          zip: List(),
          // exp: mkApp(mkApp(mkApp(mkVar("a"), mkVar("b")), mkVar("c")), mkVar("d"))
          // exp: mkApp(mkVar("a"), mkVar("b"))
          exp: mkApp(mkApp(mkVar("a"), mkVar("b")), mkApp(mkVar("c"), mkVar("d")))
        })
      }
    }),
    history: List<Editor<Meta1, Rule1>>(),
    future: List<Editor<Meta1, Rule1>>()
  }

  updateEditor(f: (editor: Editor<Meta1, Rule1>) => Editor<Meta1, Rule1> | undefined): void {
    const editor: Editor<Meta1, Rule1> | undefined = f(this.state.editor)
    if (editor === undefined) return;
    this.setState({
      ...this.state,
      editor: editor,
      history: this.state.history.unshift(this.state.editor),
      future: List()
    });
  }

  undoEditor() {
    let editor = this.state.history.get(0);
    if (editor === undefined) return;
    this.setState({
      ...this.state,
      editor: editor,
      history: this.state.history.shift(),
      future: this.state.future.unshift(this.state.editor)
    });
  }

  redoEditor() {
    let editor = this.state.future.get(0);
    if (editor === undefined) return;
    this.setState({
      ...this.state,
      editor: editor,
      history: this.state.history.unshift(this.state.editor),
      future: this.state.future.shift()
    })
  }

  keyboardEventListener = (event: KeyboardEvent): any => {
    console.log(event.key);
    if (event.key === 'ArrowUp') {
      if (event.shiftKey) {
        this.updateEditor(moveEditorSelectUp);
      } else {
        this.updateEditor(moveEditorCursorUp);
      }
    } else if (event.key === 'ArrowDown') {
      if (event.shiftKey) {
        this.updateEditor(moveEditorSelectDown);
      } else {
        this.updateEditor(moveEditorCursorDown);
      }
    } else if (event.key === 'ArrowLeft') {
      if (event.shiftKey) {
        this.updateEditor(moveEditorSelectLeft);
      } else {
        this.updateEditor(moveEditorCursorLeft);
      }
    } else if (event.key === 'ArrowRight') {
      if (event.shiftKey) {
        this.updateEditor(moveEditorSelectRight);
      } else {
        this.updateEditor(moveEditorCursorRight);
      }
    } else if (event.key === 'Escape') {
      this.updateEditor(escapeSelect);
    } else if (event.key === 'z' && event.ctrlKey) {
      this.undoEditor();
    } else if (event.key === 'Z' && event.ctrlKey) {
      this.redoEditor();
    }
  }

  componentDidMount(): void {
    document.addEventListener('keydown', this.keyboardEventListener)
  };

  componentWillUnmount(): void {
    document.removeEventListener('keydown', this.keyboardEventListener);
  }

  render() {
    return (
      <div className='app'>
        <div className='editor'>
          {printEditor(this.state.editor)}
        </div>
      </div>
    );
  }
}
