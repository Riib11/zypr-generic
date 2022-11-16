export type Node<Dat> =
    { case: 'exp', dat: Dat, kids: Node<Dat>[] } |
    { case: 'wrapper', wrapper: Wrapper, dat: Dat, kids: Node<Dat>[] }

export type Wrapper
    = { case: 'cursor' }
    | { case: 'select-top' } | { case: 'select-bot' }
    | { case: 'query-replace' }
    | { case: 'query-insert-top' } | { case: 'query-insert-bot' }
    | { case: 'query-invalid', string: string }

export type ExpNode<Exp, Dat> = { exp: Exp, node: Node<Dat> }

// uses last kid as the "real" exp, for the sake of ExpNode
// copies the dat of the "real" exp into the wrapper node
export const formatWrapper =
    <W extends Wrapper, Exp, Dat, Env>(wrapper: W, kids: ((env: Env) => ExpNode<Exp, Dat>)[]) =>
        (env: Env): ExpNode<Exp, Dat> => {
            const expNodes = kids.map(kid => kid(env))
            const { exp, node } = expNodes[expNodes.length - 1]
            const dat = node.dat
            return { exp, node: { case: 'wrapper', wrapper, dat, kids: expNodes.map(expNode => expNode.node) } }
        }
