export type Node<Dat> =
    { case: 'exp', dat: Dat, kids: Node<Dat>[] } |
    { case: SimpleNodeCases, kids: Node<Dat>[] } |
    { case: 'query-invalid', string: string, kids: Node<Dat>[] }

export type SimpleNodeCases =
    'cursor' |
    'select-top' | 'select-bot' |
    'query-replace' | 'query-insert-top' | 'query-insert-bot'

export const formatCursorClaspAround =
    <Dat, Env>(kid: (env: Env) => Node<Dat>) =>
        (env: Env): Node<Dat> => ({ case: 'cursor', kids: [kid(env)] })

export const formatSelectClaspTopAround =
    <Dat, Env>(kid: (env: Env) => Node<Dat>) =>
        (env: Env): Node<Dat> => ({ case: 'select-top', kids: [kid(env)] })

export const formatSelectClaspBotAround =
    <Dat, Env>(kid: (env: Env) => Node<Dat>) =>
        (env: Env): Node<Dat> => ({ case: 'select-bot', kids: [kid(env)] })

export const formatQueryReplaceAround =
    <Dat, Env>(kidNew: (env: Env) => Node<Dat>, kidOld: (env: Env) => Node<Dat>) =>
        (env: Env): Node<Dat> => ({ case: 'query-replace', kids: [kidNew(env), kidOld(env)] })

export const formatQueryInsertTopAround =
    <Dat, Env>(kid: (env: Env) => Node<Dat>) =>
        (env: Env): Node<Dat> => ({ case: 'query-insert-top', kids: [kid(env)] })


export const formatQueryInsertBotAround =
    <Dat, Env>(kid: (env: Env) => Node<Dat>) =>
        (env: Env): Node<Dat> => ({ case: 'query-insert-bot', kids: [kid(env)] })

export const formatQueryInvalidAround =
    <Dat, Env>(string: string, kid: (env: Env) => Node<Dat>) =>
        (env: Env): Node<Dat> => ({ case: 'query-invalid', string, kids: [kid(env)] })