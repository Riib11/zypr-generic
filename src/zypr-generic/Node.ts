export type Node<Dat> =
    { case: 'exp', dat: Dat, kids: Node<Dat>[] } |
    { case: WrapperNodeCase, kids: Node<Dat>[] }

export type WrapperNodeCase
    = { case: 'cursor' }
    | { case: 'select-top' } | { case: 'select-bot' }
    | { case: 'query-replace' }
    | { case: 'query-insert-top' } | { case: 'query-insert-bot' }
    | { case: 'query-invalid', string: string }

// export type SimpleNodeCases =
//     'cursor' |
//     'select-top' | 'select-bot' |
//     'query-replace' | 'query-insert-top' | 'query-insert-bot'

export type ExpNode<Exp, Dat> = { exp: Exp, node: Node<Dat> }

export const formatWrapperNodeAround =
    <Case extends WrapperNodeCase, Exp, Dat, Env>(case_: Case, kid: (env: Env) => ExpNode<Exp, Dat>) =>
        (env: Env): ExpNode<Exp, Dat> => {
            const { exp, node } = kid(env)
            return { exp, node: { case: case_, kids: [node] } }
        }

// export const formatCursorClaspAround =
//     <Exp, Dat, Env>(kid: (env: Env) => ExpNode<Exp, Dat>) =>
//         (env: Env): ExpNode<Exp, Dat> => {
//             const { exp, node } = kid(env)
//             return { exp, node: { case: 'cursor', kids: [node] } }
//         }

// export const formatSelectClaspTopAround =
//     <Exp, Dat, Env>(kid: (env: Env) => ExpNode<Exp, Dat>) =>
//         (env: Env): ExpNode<Exp, Dat> => {
//             const { exp, node } = kid(env)
//             return { exp, node: { case: 'select-top', kids: [node] } }
//         }

// export const formatSelectClaspBotAround =
//     <Exp, Dat, Env>(kid: (env: Env) => ExpNode<Exp, Dat>) =>
//         (env: Env): ExpNode<Exp, Dat> => {
//             const { exp, node } = kid(env)
//             return { exp, node: { case: 'select-bot', kids: [node] } }
//         }

// export const formatQueryReplaceAround =
//     <Exp, Dat, Env>(kidNew: (env: Env) => ExpNode<Exp, Dat>, kidOld: (env: Env) => ExpNode<Exp, Dat>) =>
//         (env: Env): ExpNode<Exp, Dat> => ({ case: 'query-replace', kids: [kidNew(env), kidOld(env)] })

// export const formatQueryInsertTopAround =
//     <Exp, Dat, Env>(kid: (env: Env) => ExpNode<Exp, Dat>) =>
//         (env: Env): ExpNode<Exp, Dat> => ({ case: 'query-insert-top', kids: [kid(env)] })


// export const formatQueryInsertBotAround =
//     <Exp, Dat, Env>(kid: (env: Env) => ExpNode<Exp, Dat>) =>
//         (env: Env): ExpNode<Exp, Dat> => ({ case: 'query-insert-bot', kids: [kid(env)] })

// export const formatQueryInvalidAround =
//     <Exp, Dat, Env>(string: string, kid: (env: Env) => ExpNode<Exp, Dat>) =>
//         (env: Env): ExpNode<Exp, Dat> => ({ case: 'query-invalid', string, kids: [kid(env)] })