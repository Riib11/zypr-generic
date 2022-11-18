import { EndoPart } from "../../Endo";
import * as Backend from "../Backend";
import { Dat } from "../backend/BackendA";
import Editor, { doAction, renderEditor } from "../Editor";
import { Met, Rul, Val, VarVal } from '../language/LanguageAlpha'
import { Node } from "../Node";

/*
TODO: make abstract framework for this, so that I can define the usual stuff in
that CSS file. Also, want to abstract out rendering of query-replace and
query-invalid, right? I don't need to deal with query-replace because that
actually just appears as a exp node, with the className (added by
`classNames.push(node.variant.modifier)`)
*/

export default function frontend
    ({ backend }: {
        backend: Backend.Backend<Met, Rul, Val, Dat>,
    }) {
    function renderNode(
        node: Node<Met, Rul, Val, Dat>,
        editor: Editor<Met, Rul, Val, Dat>
    ): JSX.Element[] {
        function go(node: Node<Met, Rul, Val, Dat>): JSX.Element[] {
            let classNames = ["node"]
            function aux(es: JSX.Element[], extraClassNames?: string[]): JSX.Element {
                const classNames_str = classNames.concat(extraClassNames ?? [])
                return (
                    <div
                        onMouseDown={(event) => {
                            if (node.case === 'exp') {
                                const cursor = node.getCursor()
                                if (cursor === undefined) return
                                doAction(editor, { case: 'set_cursor', cursor })
                                event.stopPropagation()
                            }
                        }}
                        onMouseUp={(event) => {
                            if (node.case === 'exp') {
                                const select = node.getSelect()
                                if (select === undefined) return
                                doAction(editor, { case: 'set_select', select })
                                event.stopPropagation()
                            }
                        }}
                        className={classNames_str.join(" ")}>
                        {es}
                    </div>)
            }
            switch (node.case) {
                case 'exp': {
                    const indent = (es: JSX.Element[]): JSX.Element[] => {
                        if (node.dat.indent !== undefined) {
                            let str = ""
                            for (var i = 0; i < node.dat.indent; i++) str += "  "
                            return ([
                                <br className="punc punc-newline" />,
                                <div className="punc punc-indent">{str}</div>
                            ]).concat(es)
                        }
                        return es
                    }

                    const paren = (es: JSX.Element[]): JSX.Element[] => {
                        if (node.dat.isParenthesized) return (
                            [<div className="punc punc-paren punc-paren-left">(</div>]
                                .concat(es)
                                .concat(<div className="punc punc-paren punc-paren-right">)</div>))
                        return es
                    }

                    if (node.dat.pre === undefined) throw new Error("impossible")
                    switch (node.dat.pre.rul) {
                        case 'var':
                            return indent([aux([
                                aux([<span>{(node.dat.pre.val as VarVal).label}</span>], ["node-exp-var-label"])
                            ], ["node-exp-var"])])
                        case 'app':
                            return indent([aux(paren([
                                aux(go(node.kids[0]), ["node-exp-app-arg"]),
                                // <div className="punc punc-space"> </div>,
                                <div className="punc punc-app">•</div>,
                                aux(go(node.kids[1]), ["node-exp-app-apl"])
                            ]), ["node-exp-app"])])
                        case 'hol':
                            return indent([aux(
                                [<span>?</span>],
                                ["node-exp-hol"])])
                    }
                }
                case 'wrapper': {
                    const indent = (es: JSX.Element[], kid: Node<Met, Rul, Val, Dat>): JSX.Element[] => {
                        switch (kid.case) {
                            case 'exp': {
                                if (kid.dat.indent) {
                                    let str = ""
                                    for (var i = 0; i < kid.dat.indent; i++) str += "  "
                                    return ([
                                        <br className="punc punc-newline" />,
                                        <div className="punc punc-indent">{str}</div>
                                    ]).concat(es)
                                }
                                else return es
                            }
                            default: return es
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
                            aux(go(unindent(node.kids[0])), ["node-cursor"])
                        ], node.kids[0])
                        case 'select-top': return indent([
                            aux(go(unindent(node.kids[0])), ["node-select-top"])
                        ], node.kids[0])
                        case 'select-bot': return indent([
                            aux(go(unindent(node.kids[0])), ["node-select-bot"])
                        ], node.kids[0])
                        case 'query-replace': {
                            return indent([aux([
                                aux(go(unindent(node.kids[0])), ["node-query-replace-exp-new"]),
                                aux(go(unindent(node.kids[1])), ["node-query-replace-exp-old"]),
                            ], ["node-query-replace"])],
                                node.kids[1])
                        }
                        case 'query-insert-top': {
                            // return indent(
                            //     [aux(renderNode(unindent(node.kids[0])), ["node-query-insert-top"])],
                            //     node.kids[0])
                            return [aux(go(unindent(node.kids[0])), ["node-query-insert-top"])]

                        }
                        case 'query-insert-bot': {
                            // return indent([aux(renderNode(unindent(node.kids[0])), ["node-query-insert-bot"])],
                            //     node.kids[0])
                            return [aux(go(unindent(node.kids[0])), ["node-query-insert-bot"])]
                        }
                        case 'query-invalid': {
                            return indent([aux([
                                aux([<span>{node.wrapper.string}</span>], ["node-query-invalid-string"]),
                                aux(go(unindent(node.kids[0])), ["node-query-invalid-exp"])
                            ], ["node-query-invalid"])],
                                node.kids[0])
                        }
                    }
                }
            }
        }
        return go(node)
    }
    return renderEditor<Met, Rul, Val, Dat>({ renderNode })(backend)
}