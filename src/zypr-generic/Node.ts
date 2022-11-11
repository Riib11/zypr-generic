export type Node<Dat> =
    {
        case: 'exp',
        modifier: NodeVariantExpModifier,
        dat: Dat,
        kids: Node<Dat>[]
    } |
    {
        case: 'query-replace',
        kids: Node<Dat>[]
    } |
    {
        case: 'query-invalid',
        string: string,
        kids: Node<Dat>[]
    }

export type NodeVariantExpModifier
    = 'cursor-clasp'
    | 'select-clasp-top' | 'select-clasp-bot'
    | 'query-replace' | 'query-insert'
    | undefined

export function buildExpNode<Dat>(
    dat: Dat,
    kids: Node<Dat>[]
): Node<Dat> {
    return {
        case: 'exp',
        modifier: undefined,
        dat,
        kids
    }
}
