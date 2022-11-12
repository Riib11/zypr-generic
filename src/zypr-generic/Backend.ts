import { List, Record, RecordOf } from 'immutable'
import { EndoPart } from '../Endo'
import { Direction } from './Direction'
import { Query } from './Editor'
import { formatCursorClaspAround, formatQueryInsertBotAround, formatQueryInsertTopAround, formatQueryInvalidAround, formatQueryReplaceAround, formatSelectClaspBotAround, formatSelectClaspTopAround, Node } from './Node'

// Env: render environment
// Dat: render data

export type Backend<Exp, Zip, Dat> = {
    props: Props<Exp, Zip, Dat>,
    state: State<Exp, Zip, Dat>
}

export type Props<Exp, Zip, Dat> = {
    format: (st: State<Exp, Zip, Dat>, query: Query) => Node<Dat>,
    interpQueryString: (st: State<Exp, Zip, Dat>, str: string) => Action<Exp, Zip>[],
    handleAction: (act: Action<Exp, Zip>) => EndoPart<State<Exp, Zip, Dat>>
}

export function interpQueryAction<Exp, Zip, Dat>(
    backend: Props<Exp, Zip, Dat>,
    st: State<Exp, Zip, Dat>,
    query: Query
): Action<Exp, Zip> | undefined {
    const acts = backend.interpQueryString(st, query.str)
    if (acts.length === 0) return undefined
    return acts[query.i % acts.length]
}

export function handleQueryAction<Exp, Zip, Dat>(
    backend: Props<Exp, Zip, Dat>,
    st: State<Exp, Zip, Dat>,
    query: Query
): EndoPart<State<Exp, Zip, Dat>> | undefined {
    const act = interpQueryAction(backend, st, query)
    if (act === undefined) return undefined
    return backend.handleAction(act)
}

export type Action<Exp, Zip>
    = { case: 'move', dir: Direction }
    | { case: 'set_cursor', cursor: Cursor<Exp, Zip> }
    | { case: 'replace', exp: Exp }
    | { case: 'insert', zips: List<Zip> }
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
    = { case: 'cursor', cursor: Cursor<Exp, Zip> }
    | { case: 'select', select: Select<Exp, Zip> }

export type Cursor<Exp, Zip> = { zips: List<Zip>, exp: Exp }

export type Select<Exp, Zip> = { zipsTop: List<Zip>, zipsBot: List<Zip>, exp: Exp, orient: Orient }

export type Clipboard<Exp, Zip>
    = { case: 'exp', exp: Exp }
    | { case: 'zips', zips: List<Zip> }
    | undefined

// up: the top of the select can move
// down: the bot of the select can move
export type Orient = 'up' | 'down'

// updateState

export function updateMode<Exp, Zip, Dat>(f: EndoPart<Mode<Exp, Zip>>): EndoPart<State<Exp, Zip, Dat>> {
    return (st) => {
        return st
            .update('mode', (mode) => f(mode) ?? mode)
            .update('history', (hist) => hist.unshift(st))
            .set('future', List([]))
    }
}

export function undo<Exp, Zip, Dat>(): EndoPart<State<Exp, Zip, Dat>> {
    return (st) => {
        const st_ = st.get('history').get(0)
        if (st_ === undefined) return undefined
        return st.update('future', futr => futr.unshift(st))
    }
}

export function redo<Exp, Zip, Dat>(): EndoPart<State<Exp, Zip, Dat>> {
    return (st) => {
        const st_ = st.get('future').get(0)
        if (st_ === undefined) return undefined
        return st.update('history', hist => hist.unshift(st))
    }
}

export function fromZipBot<Exp, Zip>(select: Select<Exp, Zip>) {
    switch (select.orient) {
        case 'up': return select.zipsBot.reverse()
        case 'down': return select.zipsBot
    }
}

export function toZipBot<Exp, Zip>(select: Select<Exp, Zip>, zips: List<Zip>) {
    switch (select.orient) {
        case 'up': return zips.reverse()
        case 'down': return zips
    }
}

// buildBackend

export function buildBackend<Exp, Zip, Dat, Env>(
    // formatting
    initEnv: Env,
    formatExp: (exp: Exp) => (env: Env) => Node<Dat>,
    formatZip: (zips: List<Zip>) => (kid: (env: Env) => Node<Dat>) => (env: Env) => Node<Dat>,
    // actions
    interpQueryString: (st: State<Exp, Zip, Dat>, str: string) => Action<Exp, Zip>[],
    handleAction: (act: Action<Exp, Zip>) => EndoPart<State<Exp, Zip, Dat>>,
    // program
    initExp: Exp,
): Backend<Exp, Zip, Dat> {
    return {
        props: {
            format: (st, query) => {
                function formatQueryAround(kid: (env: Env) => Node<Dat>): (env: Env) => Node<Dat> {
                    if (query.str.length > 0) {
                        const acts = interpQueryString(st, query.str)
                        if (acts.length === 0) {
                            return formatQueryInvalidAround(query.str, kid)
                        } else {
                            const act = acts[query.i % acts.length]
                            switch (act.case) {
                                case 'replace':
                                    return formatQueryReplaceAround(
                                        formatExp(act.exp),
                                        kid)
                                case 'insert':
                                    return formatQueryInsertTopAround(
                                        formatZip(act.zips)(
                                            formatQueryInsertBotAround(kid)))
                                default:
                                    // TODO: special display for other kinds of actions?
                                    return kid
                            }
                        }
                    } else {
                        return kid
                    }
                }

                switch (st.mode.case) {
                    case 'cursor': {
                        return formatZip(st.mode.cursor.zips)
                            (formatQueryAround(
                                formatCursorClaspAround(
                                    formatExp(st.mode.cursor.exp))))
                            (initEnv)
                    }
                    case 'select':
                        return formatZip(st.mode.select.zipsTop)
                            (formatQueryAround(
                                formatSelectClaspTopAround(
                                    formatZip(st.mode.select.zipsBot)(
                                        formatSelectClaspBotAround(
                                            formatExp(st.mode.select.exp))))))
                            (initEnv)
                }
            },
            interpQueryString,
            handleAction
        },
        state: makeState({
            mode: { case: 'cursor', cursor: { zips: List([]), exp: initExp } },
            clipboard: undefined,
            history: List([]),
            future: List([])
        })
    }
}
