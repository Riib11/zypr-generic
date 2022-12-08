import React from 'react'
import './App.css'
import './zypr-generic/frontend/Frontend1.css'
import editor from "./zypr-generic/editor/EditorAlphaA1"
// import editor from './zypr-generic/editor/EditorBetaB1'

type Props = {}

type State = {}

export default class App extends React.Component<Props, State> {
  state = {}
  constructor(props: Props) {
    super(props)
  }

  render() {
    // const Editor = this.state.editor
    return (
      <div className="app">
        {editor()}
      </div>
    )
  }
}
