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

export function modifyBackendState<Exp, Zip, Dat>(
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

export function doAction<Exp, Zip, Dat>(
    editor: Editor<Exp, Zip, Dat>,
    act: Backend.Action<Exp, Zip>
): void {
    modifyBackendState(
        editor,
        editor.props.backend.handleAction(act)
    )
}

export function renderEditor<Exp, Zip, Dat>(
    { renderNode }: {
        renderNode: (
            node: Node<Exp, Zip, Dat>,
            editor: Editor<Exp, Zip, Dat>,
            // doAction: (act: Backend.Action<Exp, Zip>) => void,
        ) =>
            JSX.Element[];
    }) {

    return (backend: Backend.Backend<Exp, Zip, Dat>) => {

        function render(editor: Editor<Exp, Zip, Dat>) {
            const node = editor.props.backend.format
                (editor.state.backend, editor.state.query)
            return [
                // TODO: onClick={...}
                <div className="editor">
                    <div className="editor-inner">
                        {renderNode(node, editor)}
                    </div>
                </div>
            ]

        }

        function handleKeyboard(editor: Editor<Exp, Zip, Dat>, event: KeyboardEvent): void {
            // console.log(event.key)

            // try to interpret as keyboard command
            {
                const act = editor.props.backend.interpKeyboardCommandEvent
                    (editor.state.backend, event)
                if (act !== undefined) {
                    event.preventDefault()
                    modifyBackendState(editor,
                        editor.props.backend.handleAction(act))
                }
            }

            // try to interact with query
            const query = interactQuery(event, editor.state.query)
            if (query !== undefined) {
                editor.setState({ ...editor.state, query })
                event.preventDefault()
                return
            } else {
                // if that doesn't work, then non-query-interaction action
                const isQueryless = editor.state.query.str.length === 0

                const act: Backend.Action<Exp, Zip> | undefined = (() => {
                    if (event.key === 'ArrowLeft') return { case: event.shiftKey ? 'move_select' : 'move_cursor', dir: 'left' }
                    else if (event.key === 'ArrowRight') return { case: event.shiftKey ? 'move_select' : 'move_cursor', dir: 'right' }
                    else if (event.key === 'ArrowUp' && isQueryless) return { case: event.shiftKey ? 'move_select' : 'move_cursor', dir: 'up' }
                    else if (event.key === 'ArrowDown' && isQueryless) return { case: event.shiftKey ? 'move_select' : 'move_cursor', dir: 'down' }
                    else if (event.key === 'Enter') return Backend.interpQueryAction(editor.props.backend, editor.state.backend, editor.state.query)
                    else if (event.key === 'Escape') return { case: 'escape' }
                    else if (event.key === 'Backspace') return { case: 'delete' }
                    return undefined
                })()

                if (act !== undefined) {
                    event.preventDefault()
                    modifyBackendState
                        (editor, editor.props.backend.handleAction(act))
                }
            }
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
