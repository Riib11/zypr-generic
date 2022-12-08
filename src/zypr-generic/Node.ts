import { List } from "immutable"
import { Cursor, Orient, Select } from "./Backend"
import { Exp, Zip } from "./Language"

// export type Node<Met, Rul, Val, Dat>
//     = Node_exp<Met, Rul, Val, Dat>
//     | Node_wrapper<Met, Rul, Val, Dat>

export type Node<Met, Rul, Val, Dat> = {
    dat: Dat,
    kids: Node<Met, Rul, Val, Dat>[],
    getCursor: () => Cursor<Met, Rul, Val> | undefined,
    isCursorable: 'same' | 'true' | 'false',
    getSelect: () => Select<Met, Rul, Val> | 'empty' | undefined,
    isSelectable: Orient | 'empty' | 'false',
    style: NodeStyle<Met, Rul, Val, Dat> | undefined
}

export type NodeStyle<Met, Rul, Val, Dat>
    = { case: 'cursor' }
    | { case: 'select-top' }
    | { case: 'select-bot' }
    | { case: 'query-insert-top' }
    | { case: 'query-insert-bot' }
    | { case: 'query-replace-new' }
    | { case: 'query-replace-old' }
    | { case: 'query-invalid', string: string }

export type ExpNode<Met, Rul, Val, Dat> =
    {
        exp: Exp<Met, Rul, Val>,
        nodes: Node<Met, Rul, Val, Dat>[]
    }
