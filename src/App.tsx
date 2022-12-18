import React from 'react'
import './App.css'
import { backend } from './zypr-generic/backend/BackendA'
import frontend from './zypr-generic/frontend/Frontend1'

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
        {frontend(backend)}
      </div>
    )
  }
}
