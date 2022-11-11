import React from 'react'
import './App.css'
import Editor from './zypr-generic/Editor'
import { editor } from './zypr-generic/editor/Editor1A'
import { Dat, Exp, Zip } from './zypr-generic/language/Language1'

type AppProps = {}

type AppState = {
  editor: Editor<Exp, Zip, Dat>
}

export default class App extends React.Component<AppProps, AppState> {
  state = {
    editor: editor()
  }

  render() {
    return (
      <div className="app">
        {this.state.editor.render()}
      </div>
    )
  }
}
