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
                const paren = (es: JSX.Element[]): JSX.Element[] => {
                    if (node.dat.isParenthesized) {
                        return (
                            [<div className="punc punc-paren punc-paren-left">(</div>]
                                .concat(es)
                                .concat(<div className="punc punc-paren punc-paren-right">)</div>)
                        )
                    } else {
                        return es
                    }
                }

                if (node.dat.preExp === undefined) throw new Error("impossible")
                switch (node.dat.preExp.case) {
                    case 'var':
                        return [aux([
                            aux([<span>{node.dat.preExp.dat.label}</span>], ["node-exp-var-label"])
                        ], ["node-exp-var"])]
                    case 'app':
                        return [aux(paren([
                            aux(renderNode(node.kids[0]), ["node-exp-app-arg"]),
                            <div className="punc punc-space"> </div>,
                            aux(renderNode(node.kids[1]), ["node-exp-app-apl"])
                        ]), ["node-exp-app"])]
                    case 'hol':
                        return [aux([<span>?</span>], ["node-exp-var"])]
                }
            }
            case 'wrapper': {
                switch (node.wrapper.case) {
                    case 'cursor': return [
                        aux(renderNode(node.kids[0]), ["node-cursor"])
                    ]
                    case 'select-top': return [
                        aux(renderNode(node.kids[0]), ["node-select-top"])
                    ]
                    case 'select-bot': return [
                        aux(renderNode(node.kids[0]), ["node-select-bot"])
                    ]
                    case 'query-replace': {
                        return [aux([
                            aux(renderNode(node.kids[0]), ["node-query-replace-exp-new"]),
                            aux(renderNode(node.kids[1]), ["node-query-replace-exp-old"]),
                        ], ["node-query-replace"])]
                    }
                    case 'query-insert-top': {
                        return [aux(renderNode(node.kids[0]), ["node-query-insert-top"])]
                    }
                    case 'query-insert-bot': {
                        return [aux(renderNode(node.kids[0]), ["node-query-insert-bot"])]
                    }
                    case 'query-invalid': {
                        return [aux([
                            aux([<span>{node.wrapper.string}</span>], ["node-query-invalid-string"]),
                            aux(renderNode(node.kids[0]), ["node-query-invalid-exp"])
                        ], ["node-query-invalid"])]
                    }
                }
            }
        }
    }
    return renderEditor<Exp, Zip, Dat>(renderNode)(backend)
}