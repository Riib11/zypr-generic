import * as Backend from "../Backend";
import Editor, { renderEditor } from "../Editor";
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
    (backend: Backend.Backend<Exp, Zip, Dat>):
    Editor<Exp, Zip, Dat> {
    function renderNode(node: Node<Dat>): JSX.Element[] {
        let classNames = ["node"]
        function aux(es: JSX.Element[]): JSX.Element[] {
            return [<div className={classNames.join(" ")}>{es}</div>]
        }
        switch (node.case) {
            case 'exp': {
                if (node.dat.preExp === undefined)
                    throw new Error("impossible")
                classNames.push("node-exp")
                if (node.modifier !== undefined)
                    classNames.push(node.modifier)
                switch (node.dat.preExp.case) {
                    case 'var': {
                        classNames.push("node-exp-var")
                        return aux([
                            <div className="exp-var-label">{node.dat.preExp.dat.label}</div>
                        ])
                    }
                    case 'app': {
                        classNames.push("node-exp-app")
                        return aux([
                            <div className="punc punc-paren punc-paren-left">(</div>,
                            <div className="exp-app-apl">{renderNode(node.kids[0])}</div>,
                            <div className="exp-app-arg">{renderNode(node.kids[1])}</div>,
                            <div className="punc punc-paren punc-paren-right">)</div>
                        ])
                    }
                }
            }
            case 'query-replace': {
                classNames.push("node-query-replace")
                return aux([
                    <div className="query-replace-exp-new">{renderNode(node.kids[0])}</div>,
                    <div className="query-invalid-exp-old">{renderNode(node.kids[1])}</div>
                ])
            }
            case 'query-invalid': {
                classNames.push("node-query-invalid")
                return aux([
                    <div className="query-invalid-string">{node.string}</div>,
                    <div className="query-invalid-exp">{renderNode(node.kids[0])}</div>
                ])
            }
        }
    }
    return renderEditor<Exp, Zip, Dat>(renderNode)(backend)
}