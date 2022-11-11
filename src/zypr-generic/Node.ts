export type Node<Dat> = {
    variant: NodeVariant,
    dat: Dat,
    kids: Node<Dat>[]
}

export type NodeVariant
    = { case: 'exp', modifier: 'cursor-clasp' | 'select-clasp-top' | 'select-clasp-bot' | 'query-insert' | undefined }
    | { case: 'query-replace' }
    | { case: 'query-invalid', string: string }

export function buildExpNode<Dat>(
    dat: Dat,
    kids: Node<Dat>[]
): Node<Dat> {
    return {
        variant: { case: 'exp', modifier: undefined },
        dat,
        kids
    }
}
