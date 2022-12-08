import { List } from 'immutable';
import * as React from 'react'
import { debug, debug_ } from '../../Debug';
import { EndoPart } from "../../Endo";
import { Backend, Orient } from "../Backend";
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

type ExpElementHighlightCase = 'cursorable' | 'selectable' | 'selectable_start'

type ExpElementState = {
    // highlight: 'cursorable' | 'selectable-top' | 'selectable-bot' | 'none'
    highlight: {
        'cursorable': 'true' | 'false',
        'selectable': Orient | 'false'
    }
}

class ExpElement
    extends React.Component<ExpElementProps, ExpElementState> {
    constructor(props: ExpElementProps) {
        super(props)
        this.state = {
            highlight: {
                'cursorable': 'false',
                'selectable': 'false'
            }
        }
    }

    setHighlightCursorable(cursorable: 'true' | 'false'): void {
        this.setState({
            ...this.state,
            highlight: {
                ...this.state.highlight,
                cursorable
            }
        })
    }

    setHighlightSelectable(selectable: Orient | 'false'): void {
        this.setState({
            ...this.state,
            highlight: {
                ...this.state.highlight,
                selectable
            }
        })
    }

    enableHighlight(relation: 'kid' | 'par', mode: 'cursorable' | 'selectable', event?: React.MouseEvent): void {
        switch (mode) {
            case 'cursorable': {
                switch (this.props.node.isCursorable) {
                    case 'same': return
                    case 'true': this.setHighlightCursorable('true'); return
                    case 'false': this.props.expElemPar?.enableHighlight('par', mode, event); return
                }
            }
            case 'selectable': {
                switch (this.props.node.isSelectable) {
                    case 'empty': return
                    case 'top': this.setHighlightSelectable('top'); return
                    case 'bot': this.setHighlightSelectable('bot'); return
                    case 'false': this.props.expElemPar?.enableHighlight('par', mode, event); return
                }
            }
        }
    }

    disableHighlight(relation: 'kid' | 'par', mode: 'cursorable' | 'selectable', event?: React.MouseEvent): void {
        switch (mode) {
            case 'cursorable': {
                switch (this.props.node.isCursorable) {
                    case 'same': return
                    case 'true': this.setHighlightCursorable('false'); return
                    case 'false': return
                }
            }
            case 'selectable': {
                if (this.props.node.isCursorable === 'same' && relation === 'par')
                    this.setHighlightSelectable('top')
                switch (this.props.node.isSelectable) {
                    case 'empty': return
                    case 'top': this.setHighlightSelectable('false'); return
                    case 'bot': this.setHighlightSelectable('false'); return
                    case 'false': return
                }
            }
        }
    }

    render(): JSX.Element {
        const classNames = (() => {
            var classNames = this.props.classNames.slice()
            switch (this.state.highlight.cursorable) {
                case 'true': classNames.push("node-cursorable"); break
                case 'false': break
            }
            switch (this.state.highlight.selectable) {
                case 'top': classNames.push("node-selectable-top"); break
                case 'bot': classNames.push("node-selectable-bot"); break
                case 'false': break
            }
            return classNames
        })()
        const expElemPar: ExpElemPar = this
        return (
            <div
                onMouseEnter={(event) => {
                    const mode = isMouseDown ? 'selectable' : 'cursorable'
                    this.props.expElemPar?.disableHighlight('par', mode, event)
                    this.enableHighlight('kid', mode, event)
                }}

                onMouseLeave={(event) => {
                    const mode = isMouseDown ? 'selectable' : 'cursorable'
                    this.props.expElemPar?.enableHighlight('par', mode, event)
                    this.disableHighlight('kid', mode, event)
                }}

                onMouseDown={(event) => {
                    setMouseDown(event)

                    switch (this.props.node.isCursorable) {
                        case 'same': {
                            // do nothing, don't propogate
                            event.stopPropagation()
                            return
                        }
                        case 'true': {
                            // start selection here
                            this.enableHighlight('kid', 'selectable', event)
                            // set cursor here
                            const cursor = this.props.node.getCursor()
                            if (cursor === undefined)
                                throw new Error("if isCursorable === 'true', then must have good cursor");
                            doAction(this.props.editor, { case: 'set_cursor', cursor })
                            return
                        }
                        case 'false': {
                            // do nothing, propogate
                        }
                    }
                    // const cursor = this.props.node.getCursor()
                    // if (cursor === undefined)
                    //     throw new Error("if isCursorable === 'same', then must have good cursor");
                    // doAction(this.props.editor, { case: 'set_cursor', cursor })

                    // this.enableHighlight('selectable', event)
                    // event.stopPropagation()
                }}

                onMouseUp={(event) => {
                    setMouseUp(event)
                    if (this.props.node.isCursorable === 'same') {
                        // const cursor = this.props.node.getCursor()
                        // if (cursor === undefined)
                        //     throw new Error("if isCursorable === 'same', then must have good cursor");
                        // doAction(this.props.editor, { case: 'set_cursor', cursor })
                        event.stopPropagation()
                    } else if (this.props.node.isSelectable !== 'false') {
                        const select = this.props.node.getSelect()
                        if (select === undefined || select === 'empty')
                            throw new Error("if isSelectable !== 'false', then must have good select")
                        doAction(this.props.editor, { case: 'set_select', select })
                        event.stopPropagation()
                    }
                    // otherwise, propogate upwards
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

export default function frontend(backend: Backend<Met, Rul, Val, Dat>) {

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