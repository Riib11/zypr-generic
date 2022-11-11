import React from 'react'
import './App.css'
import Editor from './zypr-generic/Editor'
import { editor } from './zypr-generic/editor/Editor1A'
import { Dat, Exp, Zip } from './zypr-generic/language/Language1'

type Props = {}

type State = {
  editor: Editor<Exp, Zip, Dat>
}

export default class App extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      editor: editor()
    }
  }

  render() {
    // const Editor = this.state.editor
    return (
      <div className="app">
        {this.state.editor}
      </div>
    )
  }
}
