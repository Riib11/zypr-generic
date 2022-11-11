import React from 'react'
import './App.css'
import { editor } from './zypr-generic/editor/Editor1A'

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
