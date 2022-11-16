import * as Backend from "../Backend";
import { renderEditor } from "../Editor";
import { Dat } from '../language/Language1'
import { Node } from "../Node";

/*
TODO: make abstract framework for this, so that I can define the usual stuff in
that CSS file. Also, want to abstract out rendering of query-replace and
query-invalid, right? I don't need to deal with query-replace because that
actually just appears as a exp node, with the className (added by
`classNames.push(node.variant.modifier)`)
*/

export default function frontend<Exp, Zip>
    (backend: Backend.Backend<Exp, Zip, Dat>) {
    function renderNode(node: Node<Dat>): JSX.Element[] {
        let classNames = ["node"]
        function aux(es: JSX.Element[], extraClassNames?: string[]): JSX.Element {
            const classNames_ = classNames.concat(extraClassNames ?? [])
            return (
                <div
                    // onMouseEnter={(event) => event.target.}
                    className={classNames_.join(" ")}>
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

                if (node.dat.preExp === undefined) throw new Error("impossible")
                switch (node.dat.preExp.case) {
                    case 'var':
                        return indent([aux([
                            aux([<span>{node.dat.preExp.dat.label}</span>], ["node-exp-var-label"])
                        ], ["node-exp-var"])])
                    case 'app':
                        return indent([aux(paren([
                            aux(renderNode(node.kids[0]), ["node-exp-app-arg"]),
                            <div className="punc punc-space"> </div>,
                            aux(renderNode(node.kids[1]), ["node-exp-app-apl"])
                        ]), ["node-exp-app"])])
                    case 'hol':
                        return indent([aux(
                            [<span>?</span>],
                            ["node-exp-hol"])])
                }
            }
            case 'wrapper': {
                const indent = (es: JSX.Element[], kid: Node<Dat>): JSX.Element[] => {
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

                const unindent = (kid: Node<Dat>): Node<Dat> => {
                    switch (kid.case) {
                        case 'exp': return { ...kid, dat: { ...kid.dat, indent: undefined } }
                        default: return kid
                    }
                }

                switch (node.wrapper.case) {
                    case 'cursor': return indent([
                        aux(renderNode(unindent(node.kids[0])), ["node-cursor"])
                    ], node.kids[0])
                    case 'select-top': return indent([
                        aux(renderNode(unindent(node.kids[0])), ["node-select-top"])
                    ], node.kids[0])
                    case 'select-bot': return indent([
                        aux(renderNode(unindent(node.kids[0])), ["node-select-bot"])
                    ], node.kids[0])
                    case 'query-replace': {
                        return indent([aux([
                            aux(renderNode(unindent(node.kids[0])), ["node-query-replace-exp-new"]),
                            aux(renderNode(unindent(node.kids[1])), ["node-query-replace-exp-old"]),
                        ], ["node-query-replace"])],
                            node.kids[1])
                    }
                    case 'query-insert-top': {
                        // return indent(
                        //     [aux(renderNode(unindent(node.kids[0])), ["node-query-insert-top"])],
                        //     node.kids[0])
                        return [aux(renderNode(unindent(node.kids[0])), ["node-query-insert-top"])]

                    }
                    case 'query-insert-bot': {
                        // return indent([aux(renderNode(unindent(node.kids[0])), ["node-query-insert-bot"])],
                        //     node.kids[0])
                        return [aux(renderNode(unindent(node.kids[0])), ["node-query-insert-bot"])]
                    }
                    case 'query-invalid': {
                        return indent([aux([
                            aux([<span>{node.wrapper.string}</span>], ["node-query-invalid-string"]),
                            aux(renderNode(unindent(node.kids[0])), ["node-query-invalid-exp"])
                        ], ["node-query-invalid"])],
                            node.kids[0])
                    }
                }
            }
        }
    }
    return renderEditor<Exp, Zip, Dat>(renderNode)(backend)
}