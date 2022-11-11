import React from "react";
import { EndoPart } from "../Endo";
import * as Backend from './Backend'
import { Node } from "./Node";
import interactQuery from "./QueryInteraction";

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
        console.log("Editor.constructor")
        super(props)
        this.state = state
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
        return this.props.render(this)
    }
}

// buildEditor

export function renderEditor<Exp, Zip, Dat>(
    renderNode: (node: Node<Dat>) => JSX.Element[]
) {
    function modifyBackendState(
        editor: Editor<Exp, Zip, Dat>,
        f: EndoPart<Backend.State<Exp, Zip, Dat>>
    ): void {
        const backend = f(editor.state.backend)
        if (backend !== undefined)
            editor.setState({ ...editor.state, backend })
    }
    return (backend: Backend.Backend<Exp, Zip, Dat>) => {
        // const editor = new Editor(
        //     {
        //         backend: backend.props,
        //         handleKeyboard: (editor, event) => {
        //             console.log(event.key)
        //             let act: Backend.Action<Exp, Zip> | undefined;
        //             const isQueryless = editor.state.query.str.length === 0

        //             if (event.key === 'ArrowLeft') {
        //                 act = { case: 'move', dir: 'left' }
        //             } else if (event.key === 'ArrowRight') {
        //                 act = { case: 'move', dir: 'right' }
        //             } else if (event.key === 'ArrowUp' && isQueryless) {
        //                 act = { case: 'move', dir: 'up' }
        //             } else if (event.key === 'ArrowDown' && isQueryless) {
        //                 act = { case: 'move', dir: 'down' }
        //             } else {
        //                 const query = interactQuery(event, editor.state.query)
        //                 if (query !== undefined) {
        //                     const acts = editor.props.backend.interpQueryString
        //                         (editor.state.backend.mode, query.str)
        //                     act = acts[query.i % acts.length]
        //                 }
        //             }

        //             if (act !== undefined)
        //                 modifyBackendState(editor,
        //                     editor.props.backend.handleAction(act))
        //         },
        //         render: (editor) => {
        //             const node = editor.props.backend.formatMode
        //                 (editor.state.backend.mode, editor.state.query)
        //             return [
        //                 // TODO: onClick={...}
        //                 <div className="editor">
        //                     {renderNode(node)}
        //                 </div>
        //             ]
        //         }
        //     },
        //     {
        //         backend: backend.state,
        //         query: { str: "", i: 0 }
        //     }
        // )

        function render(editor: Editor<Exp, Zip, Dat>) {
            const node = editor.props.backend.formatMode
                (editor.state.backend.mode, editor.state.query)
            return [
                // TODO: onClick={...}
                <div className="editor">
                    {renderNode(node)}
                </div>
            ]

        }

        function handleKeyboard(editor: Editor<Exp, Zip, Dat>, event: KeyboardEvent): void {
            console.log(event.key)
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
            } else {
                const query = interactQuery(event, editor.state.query)
                if (query !== undefined) {
                    const acts = editor.props.backend.interpQueryString
                        (editor.state.backend.mode, query.str)
                    act = acts[query.i % acts.length]
                }
            }

            if (act !== undefined)
                modifyBackendState(editor,
                    editor.props.backend.handleAction(act))
        }

        return [
            <Editor
                backend={backend.props}
                render={render}
                handleKeyboard={handleKeyboard} />
        ]
    }
}