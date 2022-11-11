import { List, Record, RecordOf } from 'immutable'
import { EndoPart } from '../Endo'
import { Direction } from './Direction'
import { Query } from './Editor'
import { Node, NodeVariantExpModifier } from './Node'

// Env: render environment
// Dat: render data

export type Backend<Exp, Zip, Dat> = {
    props: Props<Exp, Zip, Dat>,
    state: State<Exp, Zip, Dat>
}

export type Props<Exp, Zip, Dat> = {
    formatMode: (mode: Mode<Exp, Zip>, query: Query) => Node<Dat>,
    interpQueryString: (mode: Mode<Exp, Zip>, str: string) => Action<Exp, Zip>[],
    handleAction: (act: Action<Exp, Zip>) => EndoPart<State<Exp, Zip, Dat>>
}

export type Action<Exp, Zip>
    = { case: 'move', dir: Direction }
    | { case: 'set_cursor', cursor: Cursor<Exp, Zip> }
    | { case: 'replace', exp: Exp }
    | { case: 'insert', zip: Zip }
    | { case: BasicAction }
export type BasicAction = 'undo' | 'redo' | 'copy' | 'paste' | 'delete' | 'move'

export type State<Exp, Zip, Dat> = RecordOf<State_<Exp, Zip, Dat>>
export const makeState = <Exp, Zip, Dat>(state_: State_<Exp, Zip, Dat>): State<Exp, Zip, Dat> => Record<State_<Exp, Zip, Dat>>(state_)()
export type State_<Exp, Zip, Dat> = {
    mode: Mode<Exp, Zip>,
    clipboard: Clipboard<Exp, Zip>,
    history: List<State<Exp, Zip, Dat>>,
    future: List<State<Exp, Zip, Dat>>
}

export type Mode<Exp, Zip>
    = { case: 'cursor', cusror: Cursor<Exp, Zip> }
    | { case: 'select', select: Select<Exp, Zip> }

export type Cursor<Exp, Zip> = { zip: Zip, exp: Exp }

export type Select<Exp, Zip> = { zip_top: Zip, zip_bot: Zip, exp: Exp, orient: Orient }

export type Clipboard<Exp, Zip>
    = { case: 'exp', exp: Exp }
    | { case: 'zip', zip: Zip }
    | undefined

// up: the top of the select can move
// down: the bot of the select can move
export type Orient = 'up' | 'down'

// buildBackend

export function buildBackend<Exp, Step, Dat, Env>(
    // formatting
    initEnv: Env,
    formatExp: (exp: Exp, modifier: NodeVariantExpModifier) => (env: Env) => Node<Dat>,
    formatZip: (zip: List<Step>, modifier: NodeVariantExpModifier) => (kid: (env: Env) => Node<Dat>) => (env: Env) => Node<Dat>,
    // actions
    interpQueryString: (mode: Mode<Exp, List<Step>>, str: string) => Action<Exp, List<Step>>[],
    handleAction: (act: Action<Exp, List<Step>>) => EndoPart<State<Exp, List<Step>, Dat>>,
    // program
    initExp: Exp,
): Backend<Exp, List<Step>, Dat> {
    return {
        props: {
            formatMode: (mode, query) => {
                function formatQueryAround(kid: (env: Env) => Node<Dat>): (env: Env) => Node<Dat> {
                    if (query.str.length > 0) {
                        const acts = interpQueryString(mode, query.str)
                        if (acts.length === 0) {
                            return (env) => ({
                                case: 'query-invalid',
                                string: query.str,
                                kids: [kid(env)]
                            })
                        } else {
                            const act = acts[query.i % acts.length]
                            switch (act.case) {
                                case 'replace': {
                                    return (env) => ({
                                        case: 'query-replace',
                                        kids: [
                                            formatExp(act.exp, 'query-replace')(env),
                                            kid(env)
                                        ]
                                    })
                                }
                                case 'insert': {
                                    return (env) => ({
                                        case: 'query-replace',
                                        kids: [formatZip(act.zip, 'query-insert')(kid)(env)]
                                    })
                                }
                                default: {
                                    // TODO: special display for other kinds of actions?
                                    return kid
                                }
                            }
                        }
                    } else {
                        return kid
                    }
                }

                switch (mode.case) {
                    case 'cursor':
                        return formatZip(mode.cusror.zip, undefined)
                            (formatQueryAround
                                (formatExp(mode.cusror.exp, 'cursor-clasp')))
                            (initEnv)
                    case 'select':
                        return formatZip(mode.select.zip_top, undefined)
                            (formatQueryAround
                                (formatZip(mode.select.zip_bot, 'select-clasp-top')
                                    (formatExp(mode.select.exp, 'select-clasp-bot'))))
                            (initEnv)
                }
            },
            interpQueryString,
            handleAction
        },
        state: makeState({
            mode: { case: 'cursor', cusror: { zip: List([]), exp: initExp } },
            clipboard: undefined,
            history: List([]),
            future: List([])
        })
    }
}
