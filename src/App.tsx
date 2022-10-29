import { List, Map } from 'immutable';
import React, { KeyboardEventHandler, useState } from 'react';
import './App.css';
import { makeCursor } from './zypr-generic/Cursor';
import { Editor, makeEditor, Mode, moveDown, moveUp, showEditor } from './zypr-generic/Editor';
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
  editor: Editor<Meta1, Rule1>
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
      showGrammar: (meta: Meta1, rule: Rule1) => (exps: List<string>) => {
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
          exp: mkApp(mkApp(mkApp(mkVar("a"), mkVar("b")), mkVar("c")), mkVar("d"))
        })
      },
      history: List()
    })
  }

  updateEditor(f: (editor: Editor<Meta1, Rule1>) => Editor<Meta1, Rule1>) {
    this.setState({ ...this.state, editor: f(this.state.editor) });
  }

  keyboardEventListener = (event: KeyboardEvent): any => {
    console.log(event.key);
    if (event.key === 'ArrowUp') {
      console.log("move up")
      this.updateEditor(editor => moveUp(editor));
    } else if (event.key === 'ArrowDown') {
      console.log("move down")
      this.updateEditor(editor => moveDown(editor));
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
          {showEditor(this.state.editor)}
        </div>
      </div>
    )
  }
}

// function App() {
//   const [editor, setEditor] = useState<Editor<Meta1, Rule1>>();

//   setEditor();

//   if (editor === undefined) return (<div>failed to use editor state</div>);
//   return (
//     <div className="app">
//       <div className="editor">
//         {/* {showEditor(editor)} */}
//       </div>
//     </div>
//   );
// }

// export default App;
