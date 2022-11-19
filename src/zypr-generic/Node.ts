import { Cursor, Select } from "./Backend"
import { Exp } from "./Language"

export type Node<Met, Rul, Val, Dat>
    = Node_exp<Met, Rul, Val, Dat>
    | Node_wrapper<Met, Rul, Val, Dat>

export type Node_exp<Met, Rul, Val, Dat> = {
    case: 'exp',
    dat: Dat,
    kids: Node<Met, Rul, Val, Dat>[],
    getCursor: () => Cursor<Met, Rul, Val> | undefined,
    isCursorable: 'same' | boolean,
    getSelect: () => Select<Met, Rul, Val> | 'empty' | undefined,
    isSelectableTop: boolean,
    isSelectableBot: boolean
}

export type Node_wrapper<Met, Rul, Val, Dat> = {
    case: 'wrapper',
    wrapper: Wrapper,
    dat: Dat,
    kids: Node<Met, Rul, Val, Dat>[]
}

export type Wrapper
    = { case: 'cursor' }
    | { case: 'select-top' } | { case: 'select-bot' }
    | { case: 'query-replace' }
    | { case: 'query-insert-top' } | { case: 'query-insert-bot' }
    | { case: 'query-invalid', string: string }

export type ExpNode<Met, Rul, Val, Dat> = { exp: Exp<Met, Rul, Val>, node: Node<Met, Rul, Val, Dat> }

// uses last kid as the "real" exp, for the sake of ExpNode
// copies the dat of the "real" exp into the wrapper node
export const formatWrapper =
    <W extends Wrapper, Met, Rul, Val, Dat, Env>(wrapper: W, kids: ((env: Env) => ExpNode<Met, Rul, Val, Dat>)[]) =>
        (env: Env): ExpNode<Met, Rul, Val, Dat> => {
            const expNodes = kids.map(kid => kid(env))
            const { exp, node } = expNodes[expNodes.length - 1]
            const dat = node.dat
            return { exp, node: { case: 'wrapper', wrapper, dat, kids: expNodes.map(expNode => expNode.node) } }
        }
