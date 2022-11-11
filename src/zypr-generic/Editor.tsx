import React from "react";
import { EndoPart } from "../Endo";
import * as Backend from './Backend'
import { Node } from "./Node";
import interactQuery from "./QueryInteraction";

export type Props<Exp, Zip, Dat> = {
    backend: Backend.Props<Exp, Zip, Dat>,
    render: (editor: Editor<Exp, Zip, Dat>) => JSX.Element[],
    handleKeyboard: (editor: Editor<Exp, Zip, Dat>, event: KeyboardEvent) => void,
    initState: State<Exp, Zip, Dat>
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
    ) {
        console.log("Editor.constructor")
        super(props)
        this.state = props.initState
    }

    keyboardEventListener = (event: KeyboardEvent): any => {
        this.props.handleKeyboard(this, event)
    }

    componentDidMount(): void {
        console.log("Editor.componentDidMount")
        document.addEventListener('keydown', this.keyboardEventListener)
    }

    componentWillUnmount(): void {
        console.log("Editor.componentWillUnmount")
        document.removeEventListener('keydown', this.keyboardEventListener)
    }

    render() {
        return [this.props.render(this)]
    }
}

// buildEditor

export function renderEditor<Exp, Zip, Dat>(
    initExp: Exp,
    renderNode: (node: Node<Dat>) => JSX.Element[]
) {
    function modifyBackendState(
        editor: Editor<Exp, Zip, Dat>,
        f: EndoPart<Backend.State<Exp, Zip, Dat>>
    ): void {
        const backend = f(editor.state.backend)
        if (backend !== undefined)
            editor.setState({
                backend,
                query: { str: "", i: 0 }
            })
    }
    return (backend: Backend.Backend<Exp, Zip, Dat>) => {

        function render(editor: Editor<Exp, Zip, Dat>) {
            const node = editor.props.backend.format
                (editor.state.backend, editor.state.query)
            return [
                // TODO: onClick={...}
                <div className="editor">
                    <div className="editor-inner">
                        {renderNode(node)}
                    </div>
                </div>
            ]

        }

        function handleKeyboard(editor: Editor<Exp, Zip, Dat>, event: KeyboardEvent): void {
            let act: Backend.Action<Exp, Zip> | undefined;
            const isQueryless = editor.state.query.str.length === 0

            if (event.key === 'ArrowLeft') {
                act = { case: 'move', dir: 'left' }
            } else if (event.key === 'ArrowRight') {
                act = { case: 'move', dir: 'right' }
            } else if (event.key === 'ArrowUp' && isQueryless) {
                act = { case: 'move', dir: 'up' }
            } else if (event.key === 'ArrowDown' && isQueryless) {
                act = { case: 'move', dir: 'down' }
            } else if (event.key === 'Enter') {
                act = Backend.interpQueryAction(
                    editor.props.backend,
                    editor.state.backend,
                    editor.state.query
                ) ?? act
            } else {
                const query = interactQuery(event, editor.state.query)
                if (query !== undefined) {
                    const acts = editor.props.backend.interpQueryString
                        (editor.state.backend, query.str)
                    act = acts[query.i % acts.length]
                }
                if (query !== undefined)
                    editor.setState({ ...editor.state, query })
                return
            }

            if (act !== undefined)
                modifyBackendState(editor,
                    editor.props.backend.handleAction(act))
        }

        const initState: State<Exp, Zip, Dat> = {
            backend: backend.state,
            query: { str: "", i: 0 }
        }

        return [
            <Editor
                backend={backend.props}
                render={render}
                handleKeyboard={handleKeyboard}
                initState={initState}
            />
        ]
    }
}
/*
{
    backend: Backend.State<Exp, Zip, Dat>,
    query: Query
}
*/