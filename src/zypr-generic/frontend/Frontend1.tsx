import { List } from 'immutable';
import * as React from 'react'
import { debug, debug_ } from '../../Debug';
import { EndoPart } from "../../Endo";
import { Backend } from "../Backend";
import { Dat } from "../backend/BackendA";
import Editor, { doAction, isMouseDown, renderEditor, setMouseDown, setMouseUp } from "../Editor";
import { Met, Rul, Val, VarVal } from '../language/LanguageAlpha'
import { Node, Node_exp } from "../Node";

// ExpElement parent
type ExpElemPar = ExpElement | undefined

type ExpElementProps = {
    backend: Backend<Met, Rul, Val, Dat>,
    editor: Editor<Met, Rul, Val, Dat>,
    expElemPar: ExpElemPar,
    node: Node_exp<Met, Rul, Val, Dat>,
    elems: ((expElemPar: ExpElemPar) => JSX.Element)[],
    classNames: string[]
}

type ExpElementState = {
    highlight: 'cursorable' | 'selectable-top' | 'selectable-bot' | 'none'
}

class ExpElement
    extends React.Component<ExpElementProps, ExpElementState> {
    // state: ExpElementState = {
    //     highlight: undefined
    // }
    constructor(props: ExpElementProps) {
        super(props)
        this.state = {
            highlight: 'none'
        }
    }

    enableHighlight(event?: React.MouseEvent): void {
        if (isMouseDown) {
            if (this.props.node.isSelectableTop)
                this.setState({ highlight: 'selectable-top' })
            else if (this.props.node.isSelectableBot)
                this.setState({ highlight: 'selectable-bot' })
            else
                this.props.expElemPar?.enableHighlight(event)
        } else {
            if (this.props.node.isCursorable === 'same')
                return
            else if (this.props.node.isCursorable)
                this.setState({ highlight: 'cursorable' })
            else
                this.props.expElemPar?.enableHighlight(event)
        }
    }

    disableHighlight(event?: React.MouseEvent): void {
        if (isMouseDown) {
            if (this.props.node.isSelectableTop)
                this.setState({ highlight: 'none' })
            else if (this.props.node.isSelectableBot)
                this.setState({ highlight: 'none' })
            // else
            //     this.props.expElemPar?.disableHighlight(event)
        } else {
            // if (this.props.node.isCursorable === 'same')
            //     return
            if (this.props.node.isCursorable)
                this.setState({ highlight: 'none' })
            // else
            //     this.props.expElemPar?.disableHighlight(event)
        }
    }

    clearHighlight(event?: React.MouseEvent): void {
        this.setState({ highlight: 'none' })
    }

    render(): JSX.Element {
        const classNames = (() => {
            switch (this.state.highlight) {
                case 'cursorable': return this.props.classNames.concat(["node-cursorable"])
                case 'selectable-top': return this.props.classNames.concat(["node-selectable-top"])
                case 'selectable-bot': return this.props.classNames.concat(["node-selectable-bot"])
                case 'none': return this.props.classNames
            }
        })()
        const expElemPar: ExpElemPar = this
        return (
            <div
                onMouseEnter={(event) => {
                    this.props.expElemPar?.disableHighlight(event)
                    this.enableHighlight(event)
                }}
                onMouseLeave={(event) => {
                    this.props.expElemPar?.enableHighlight(event)
                    this.disableHighlight(event)
                }}
                onMouseDown={(event) => {
                    setMouseDown(event)

                    const cursor = this.props.node.getCursor()
                    if (cursor === undefined) return
                    doAction(this.props.editor, { case: 'set_cursor', cursor })

                    // this.enableHighlight(event)

                    event.stopPropagation()
                }}
                onMouseUp={(event) => {
                    setMouseUp(event)
                    this.disableHighlight(event)
                    // this.clearHighlight(event)
                    const select = this.props.node.getSelect()
                    if (select === undefined) return
                    else if (select === 'empty') event.stopPropagation()
                    else {
                        doAction(this.props.editor, { case: 'set_select', select })
                        event.stopPropagation()
                    }
                }}
                className={classNames.join(" ")}
            >
                {this.props.elems.map(elem => elem(expElemPar))}
            </div>)
    }
}

function renderExp(
    backend: Backend<Met, Rul, Val, Dat>,
    editor: Editor<Met, Rul, Val, Dat>,
    parent: ExpElemPar,
    node: Node_exp<Met, Rul, Val, Dat>,
    elems: ((expElemPar: ExpElemPar) => JSX.Element)[],
    classNames: string[]
): JSX.Element {
    return (
        <ExpElement
            backend={backend}
            editor={editor}
            expElemPar={parent}
            node={node}
            elems={elems}
            classNames={classNames}
        />
    )

    // return (
    //     <div
    //         // onMouseOver={(event) => {...}}
    //         onMouseDown={(event) => {
    //             if (node.case === 'exp') {
    //                 const cursor = node.getCursor()
    //                 if (cursor === undefined) return
    //                 doAction(editor, { case: 'set_cursor', cursor })
    //                 event.stopPropagation()
    //             }
    //         }}
    //         onMouseUp={(event) => {
    //             if (node.case === 'exp') {
    //                 const select = node.getSelect()
    //                 if (select === undefined) return
    //                 else if (select === 'empty') event.stopPropagation()
    //                 else {
    //                     doAction(editor, { case: 'set_select', select })
    //                     event.stopPropagation()
    //                 }
    //             }
    //         }}
    //         className={classNames.join(" ")}>
    //         {es}
    //     </div>)
}

// auxilliary nodes that can't be cursored, selected, etc.
function renderAux(
    elems: ((expElemPar: ExpElemPar) => JSX.Element)[],
    classNames: string[]
): (expElemPar: ExpElemPar) => JSX.Element {
    const classNames_str = classNames.concat()
    return (expElemPar) => (
        <div className={classNames_str.join(" ")}>
            {elems.map(elem => elem(expElemPar))}
        </div>)
}

export default function frontend
    ({ backend }: {
        // works with any backend for language Alpha
        backend: Backend<Met, Rul, Val, Dat>,
    }) {
    function renderNode(
        node: Node<Met, Rul, Val, Dat>,
        editor: Editor<Met, Rul, Val, Dat>,
        expElemPar: ExpElemPar
    ): JSX.Element[] {
        const renderExp_ =
            (
                node: Node_exp<Met, Rul, Val, Dat>,
                elems: ((expElemPar: ExpElemPar) => JSX.Element)[],
                classNames: string[]
            ) =>
                (expElemPar: ExpElemPar) =>
                    renderExp(backend, editor, expElemPar, node, elems, classNames)

        function go(
            node: Node<Met, Rul, Val, Dat>,
        ): ((expElemPar: ExpElemPar) => JSX.Element)[] {
            let classNames = ["node"]

            switch (node.case) {
                case 'exp': {
                    const indent =
                        (elems: ((expElemPar: ExpElemPar) => JSX.Element)[]):
                            ((expElemPar: ExpElemPar) => JSX.Element)[] => {
                            if (node.dat.indent !== undefined) {
                                let str = ""
                                for (var i = 0; i < node.dat.indent; i++) str += "  "
                                return ([
                                    (_: ExpElemPar) => <br className="punc punc-newline" />,
                                    (_: ExpElemPar) => <div className="punc punc-indent">{str}</div>
                                ]).concat(elems)
                            }
                            return elems
                        }

                    const paren =
                        (elems: ((expElemPar: ExpElemPar) => JSX.Element)[]):
                            ((expElemPar: ExpElemPar) => JSX.Element)[] => {
                            if (node.dat.isParenthesized) return ([] as ((expElemPar: ExpElemPar) => JSX.Element)[]).concat(
                                [(_: ExpElemPar) => <div className="punc punc-paren punc-paren-left">(</div>],
                                elems,
                                [(_: ExpElemPar) => <div className="punc punc-paren punc-paren-right">)</div>])
                            return elems
                        }

                    switch (node.dat.pre.rul) {
                        case 'var':
                            return indent([renderExp_(node, [
                                renderAux([(_) => <span>{(node.dat.pre.val as VarVal).label}</span>], classNames.concat(["node-exp-var-label"]))
                            ], classNames.concat(["node-exp-var"]))])
                        case 'app':
                            return indent([renderExp_(node, paren([
                                renderAux(go(node.kids[0]), classNames.concat(["node-exp-app-arg"])),
                                // <div className="punc punc-space"> </div>,
                                (_) => <div className="punc punc-app">•</div>,
                                renderAux(go(node.kids[1]), classNames.concat(["node-exp-app-apl"]))
                            ]), ["node-exp-app"])])
                        case 'hol':
                            return indent([renderExp_(node,
                                [(_: ExpElemPar) => <span>?</span>],
                                ["node-exp-hol"])])
                    }
                }
                case 'wrapper': {
                    const indent = (elems: ((expElemPar: ExpElemPar) => JSX.Element)[], kid: Node<Met, Rul, Val, Dat>):
                        ((expElemPar: ExpElemPar) => JSX.Element)[] => {
                        switch (kid.case) {
                            case 'exp': {
                                if (kid.dat.indent) {
                                    let str = ""
                                    for (var i = 0; i < kid.dat.indent; i++) str += "  "
                                    return ([
                                        (_: ExpElemPar) => <br className="punc punc-newline" />,
                                        (_: ExpElemPar) => <div className="punc punc-indent">{str}</div>
                                    ]).concat(elems)
                                }
                                else return elems
                            }
                            default: return elems
                        }
                    }

                    const unindent = (kid: Node<Met, Rul, Val, Dat>): Node<Met, Rul, Val, Dat> => {
                        switch (kid.case) {
                            case 'exp': return { ...kid, dat: { ...kid.dat, indent: undefined } }
                            default: return kid
                        }
                    }

                    switch (node.wrapper.case) {
                        case 'cursor': return indent([
                            renderAux(go(unindent(node.kids[0])), classNames.concat(["node-cursor"]))
                        ], node.kids[0])
                        case 'select-top': return indent([
                            renderAux(go(unindent(node.kids[0])), classNames.concat(["node-select-top"]))
                        ], node.kids[0])
                        case 'select-bot': return indent([
                            renderAux(go(unindent(node.kids[0])), classNames.concat(["node-select-bot"]))
                        ], node.kids[0])
                        case 'query-replace': {
                            return indent([renderAux([
                                renderAux(go(unindent(node.kids[0])), classNames.concat(["node-query-replace-exp-new"])),
                                renderAux(go(unindent(node.kids[1])), classNames.concat(["node-query-replace-exp-old"])),
                            ], ["node-query-replace"])],
                                node.kids[1])
                        }
                        case 'query-insert-top': {
                            // return indent(
                            //     [aux(renderNode(unindent(node.kids[0])), ["node-query-insert-top"])],
                            //     node.kids[0])
                            return [renderAux(go(unindent(node.kids[0])), classNames.concat(["node-query-insert-top"]))]

                        }
                        case 'query-insert-bot': {
                            // return indent([aux(renderNode(unindent(node.kids[0])), ["node-query-insert-bot"])],
                            //     node.kids[0])
                            return [renderAux(go(unindent(node.kids[0])), classNames.concat(["node-query-insert-bot"]))]
                        }
                        case 'query-invalid': {
                            const str = node.wrapper.string
                            return indent([renderAux([
                                renderAux([(_: ExpElemPar) => <span>{str}</span>], classNames.concat(["node-query-invalid-string"])),
                                renderAux(go(unindent(node.kids[0])), classNames.concat(["node-query-invalid-exp"]))
                            ], ["node-query-invalid"])],
                                node.kids[0])
                        }
                    }
                }
            }
        }
        return go(node).map(elem => elem(expElemPar))
    }
    return renderEditor<Met, Rul, Val, Dat>({
        renderNode:
            (
                node: Node<Met, Rul, Val, Dat>,
                editor: Editor<Met, Rul, Val, Dat>
            ) =>
                renderNode(node, editor, undefined)
    })(backend)
}