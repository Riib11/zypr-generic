import React, { } from "react";
import { EndoPart } from "../Endo";
import * as Backend from './Backend'
import { Node } from "./Node";

export type Props<Exp, Zip, Dat> = {
    backend: Backend.Props<Exp, Zip, Dat>,
    render: (editor: Editor<Exp, Zip, Dat>) => JSX.Element[],
    handleKeyboard: (editor: Editor<Exp, Zip, Dat>, event: KeyboardEvent) => void
}

export type State<Exp, Zip, Dat> = {
    backend: Backend.State<Exp, Zip, Dat>,
    query: Query
}

export type Query = { str: string, i: number }

export default class Editor<Exp, Zip, Dat>
    extends React.Component<Props<Exp, Zip, Dat>, State<Exp, Zip, Dat>>
{
    constructor(
        props: Props<Exp, Zip, Dat>,
        state: State<Exp, Zip, Dat>
    ) {
        super(props)
        this.state = state // or? this.setState(state)
    }

    keyboardEventListener = (event: KeyboardEvent): any => {
        this.props.handleKeyboard(this, event)
    }

    componentDidMount(): void {
        document.addEventListener('keydown', this.keyboardEventListener)
    }

    componentWillUnmount(): void {
        document.removeEventListener('keydown', this.keyboardEventListener)
    }

    render() {
        return this.props.render(this)
    }
}

// buildEditor

export function buildEditor<Exp, Zip, Dat>(
    renderNode: (node: Node<Dat>) => JSX.Element[]
): (backend: Backend.Backend<Exp, Zip, Dat>) => Editor<Exp, Zip, Dat> {
    function modifyBackendState(
        editor: Editor<Exp, Zip, Dat>,
        f: EndoPart<Backend.State<Exp, Zip, Dat>>
    ): void {
        const backend = f(editor.state.backend)
        if (backend !== undefined)
            editor.setState({ ...editor.state, backend })
    }
    return (backend) => new Editor(
        {
            backend: backend.props,
            handleKeyboard: (editor, event) => {
                // const act = interpKeyboard(editor, event)
                let act: Backend.Action<Exp, Zip> | undefined;

                if (event.key === 'ArrowUp') {
                    act = { case: 'move', dir: 'up' }
                } else if (event.key === 'ArrowDown') {
                    act = { case: 'move', dir: 'down' }
                } else if (event.key === 'ArrowLeft') {
                    act = { case: 'move', dir: 'up' }
                } else if (event.key === 'ArrowRight') {
                    act = { case: 'move', dir: 'down' }
                }

                if (act !== undefined)
                    modifyBackendState(editor,
                        editor.props.backend.handleAction(act))
            },
            render: (editor) => {
                const node = editor.props.backend.formatMode(editor.state.backend.mode)
                return renderNode(node)
            }
        },
        {
            backend: backend.state,
            query: { str: "", i: 0 }
        }
    )
}