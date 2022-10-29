import { List, Map } from 'immutable';
import React, { KeyboardEventHandler, useState } from 'react';
import './App.css';
import { makeCursor } from './zypr-generic/Cursor';
import { Editor, makeEditor, Mode, moveDown, moveLeft, moveRight, moveUp, printEditor, showEditor } from './zypr-generic/Editor';
import { Expression, makeExpression } from './zypr-generic/Expression';

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
      grammar: ((meta: Meta1) => (rule: Rule1) => {
        switch (meta) {
          case 'exp': {
            switch (rule.case) {
              case 'var': return List();
              case 'app': return List(['exp', 'exp']);
            }
          }
        }
      }),
      grammarPrinter: (meta: Meta1, rule: Rule1) => (exps: List<string>) => {
        switch (meta) {
          case 'exp': {
            switch (rule.case) {
              case 'var': return rule.label;
              case 'app': return `(${exps.get(0)} ${exps.get(1)})`;
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
      this.updateEditor(moveUp);
    } else if (event.key === 'ArrowDown') {
      this.updateEditor(moveDown);
    } else if (event.key === 'ArrowLeft') {
      this.updateEditor(moveLeft);
    } else if (event.key === 'ArrowRight') {
      this.updateEditor(moveRight);
    } else if (event.key === 'z' && event.ctrlKey) {
      this.undoEditor();
    } else if (event.key === 'Z' && event.ctrlKey) {
      console.log("hello")
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
    if (this.state.editor.mode.case === 'cursor') {
      console.log(this.state.editor.mode.cursor.toJS());
    }

    // return (
    //   <div className='app'>
    //     <div className='editor'>
    //       future:<br />
    //       {this.state.future.map(
    //         editor => <div>{printEditor(editor)}</div>
    //       ).toArray()}
    //       <br />
    //       editor:<br />
    //       <div>{printEditor(this.state.editor)}</div>
    //       <br />
    //       history:<br />
    //       {this.state.history.map(
    //         editor => <div>{printEditor(editor)}</div>
    //       ).toArray()}
    //     </div>
    //   </div>
    // );

    return (
      <div className='app'>
        <div className='editor'>
          {printEditor(this.state.editor)}
        </div>
      </div>
    );
  }
}
