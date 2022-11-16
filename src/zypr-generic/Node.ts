export type Node<Dat> =
    { case: 'exp', dat: Dat, kids: Node<Dat>[] } |
    { case: 'wrapper', wrapper: Wrapper, kids: Node<Dat>[] }

export type Wrapper
    = { case: 'cursor' }
    | { case: 'select-top' } | { case: 'select-bot' }
    | { case: 'query-replace' }
    | { case: 'query-insert-top' } | { case: 'query-insert-bot' }
    | { case: 'query-invalid', string: string }

export type ExpNode<Exp, Dat> = { exp: Exp, node: Node<Dat> }

// uses last kid as the "real" exp, for the sake of ExpNode
export const formatWrapper =
    <W extends Wrapper, Exp, Dat, Env>(wrapper: W, kids: ((env: Env) => ExpNode<Exp, Dat>)[]) =>
        (env: Env): ExpNode<Exp, Dat> => {
            const expNodes = kids.map(kid => kid(env))
            const { exp } = expNodes[expNodes.length - 1]
            return { exp, node: { case: 'wrapper', wrapper, kids: expNodes.map(expNode => expNode.node) } }
        }
