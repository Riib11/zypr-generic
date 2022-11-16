import { List, Record, RecordOf } from 'immutable'
import { EndoPart } from '../Endo'
import { Direction } from './Direction'
import { Query } from './Editor'
import { ExpNode, formatWrapper, Node } from './Node'

// Env: render environment
// Dat: render data

export type Backend<Exp, Zip, Dat> = {
    props: Props<Exp, Zip, Dat>,
    state: State<Exp, Zip, Dat>
}

export type Props<Exp, Zip, Dat> = {
    zipExp: (exp: Exp, i: number) => Zip,
    unzipExp: (zip: Zip, exp: Exp) => Exp,
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
    = { case: 'move_cursor', dir: Direction }
    | { case: 'move_select', dir: Direction }
    | { case: 'set_cursor', cursor: Cursor<Exp, Zip> }
    | { case: 'replace', exp: Exp }
    | { case: 'insert', zips: List<Zip> }
    | { case: BasicAction }
export type BasicAction = 'undo' | 'redo' | 'copy' | 'cut' | 'paste' | 'delete' | 'escape'

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

// top: the top of the select can move
// bot: the bot of the select can move
export type Orient = 'top' | 'bot'

export type Childing<Zip> = Zip | undefined

// updateState

export function updateState<Exp, Zip, Dat>(f: EndoPart<State<Exp, Zip, Dat>>): EndoPart<State<Exp, Zip, Dat>> {
    return (st) => {
        const st_ = f(st)
        if (st_ === undefined) return undefined
        return st_
            .update('history', (hist) => hist.size < 500 ? hist.unshift(st) : hist)
            .set('future', List([]))
    }
}

export function updateMode<Exp, Zip, Dat>(f: EndoPart<Mode<Exp, Zip>>): EndoPart<State<Exp, Zip, Dat>> {
    return (st) => {
        return st
            .update('mode', (mode) => f(mode) ?? mode)
            .update('history', (hist) => hist.size < 500 ? hist.unshift(st) : hist)
            .set('future', List([]))
    }
}

export function undo<Exp, Zip, Dat>(): EndoPart<State<Exp, Zip, Dat>> {
    return (st) => {
        console.log("history.size", st.history.size)
        const st_ = st.history.get(0)
        if (st_ === undefined) return undefined
        return st_
            .update('future', futr => futr.size < 500 ? futr.unshift(st) : futr)
    }
}

export function redo<Exp, Zip, Dat>(): EndoPart<State<Exp, Zip, Dat>> {
    return (st) => {
        const st_ = st.future.get(0)
        if (st_ === undefined) return undefined
        return st_
            .update('history', hist => hist.size < 500 ? hist.unshift(st) : hist)
    }
}

export function cut<Exp, Zip, Dat>(hol: Exp): EndoPart<State<Exp, Zip, Dat>> {
    return updateState((st): State<Exp, Zip, Dat> | undefined => {
        switch (st.mode.case) {
            case 'cursor': return st
                .set('mode', { case: 'cursor', cursor: { zips: st.mode.cursor.zips, exp: hol } })
                .set('clipboard', { case: 'exp', exp: st.mode.cursor.exp })

            case 'select': return st
                .set('mode', { case: 'cursor', cursor: { zips: st.mode.select.zipsTop, exp: st.mode.select.exp } })
                .set('clipboard', { case: 'zips', zips: getZipsBot(st.mode.select) })
        }
    })
}

export function copy<Exp, Zip, Dat>(): EndoPart<State<Exp, Zip, Dat>> {
    return updateState((st): State<Exp, Zip, Dat> | undefined => {
        switch (st.mode.case) {
            case 'cursor': return st
                .set('clipboard', { case: 'exp', exp: st.mode.cursor.exp })

            case 'select': return st
                .set('clipboard', { case: 'zips', zips: getZipsBot(st.mode.select) })
        }
    })
}

export function paste<Exp, Zip, Dat>(): EndoPart<State<Exp, Zip, Dat>> {
    return updateState((st): State<Exp, Zip, Dat> | undefined => {
        if (st.clipboard === undefined) return undefined
        switch (st.clipboard.case) {
            case 'exp': {
                switch (st.mode.case) {
                    case 'cursor': return st
                        .set('mode', { case: 'cursor', cursor: { zips: st.mode.cursor.zips, exp: st.clipboard.exp } })
                    case 'select': return undefined
                }
            }
            case 'zips': {
                switch (st.mode.case) {
                    case 'cursor': return st
                        .set('mode', { case: 'cursor', cursor: { zips: st.clipboard.zips.concat(st.mode.cursor.zips), exp: st.mode.cursor.exp } })
                    case 'select': return st
                        .set('mode', { case: 'cursor', cursor: { zips: st.clipboard.zips.concat(st.mode.select.zipsTop), exp: st.mode.select.exp } })
                }
            }
        }
    })
}

export function getZipsBot<Exp, Zip>(select: Select<Exp, Zip>) {
    switch (select.orient) {
        case 'top': return select.zipsBot.reverse()
        case 'bot': return select.zipsBot
    }
}

export function setZipsBot<Exp, Zip>(select: Select<Exp, Zip>, zips: List<Zip>) {
    switch (select.orient) {
        case 'top': return { ...select, zipsBot: zips.reverse() }
        case 'bot': return { ...select, zipsBot: zips }
    }
}

// buildBackend

export function buildBackend<Exp, Zip, Dat, Env>(
    // zip/unzip
    zipExp: (exp: Exp, i: number) => Zip,
    unzipExp: (zip: Zip, exp: Exp) => Exp,
    // formatting
    initEnv: Env,
    formatExp: (exp: Exp, childing: Childing<Zip>) => (env: Env) => ExpNode<Exp, Dat>,
    formatZip: (zips: List<Zip>, childing: Childing<Zip>) => (kid: (env: Env) => ExpNode<Exp, Dat>) => (env: Env) => ExpNode<Exp, Dat>,
    // actions
    interpQueryString: (st: State<Exp, Zip, Dat>, str: string) => Action<Exp, Zip>[],
    handleAction: (act: Action<Exp, Zip>) => EndoPart<State<Exp, Zip, Dat>>,
    // program
    initExp: Exp,
): Backend<Exp, Zip, Dat> {
    return {
        props: {
            zipExp,
            unzipExp,
            format: (st, query) => {

                const acts: Action<Exp, Zip>[] | undefined =
                    query.str.length > 0 ?
                        interpQueryString(st, query.str) :
                        undefined
                const act =
                    acts !== undefined && acts.length > 0 ?
                        acts[query.i % acts.length] :
                        undefined
                const childingQuery =
                    act !== undefined && act.case === 'insert' ?
                        act.zips.get(0) :
                        undefined

                function formatQueryAround(kid: (env: Env) => ExpNode<Exp, Dat>, childing: Childing<Zip>): (env: Env) => ExpNode<Exp, Dat> {
                    if (act === undefined) {
                        return formatWrapper({ case: 'query-invalid', string: query.str },
                            [kid])
                    } else {
                        switch (act.case) {
                            case 'replace':
                                return formatWrapper({ case: 'query-replace' },
                                    [formatExp(act.exp, childing), kid])
                            case 'insert':
                                return formatWrapper({ case: 'query-insert-top' },
                                    [formatZip(act.zips, childing)
                                        (formatWrapper({ case: 'query-insert-bot' },
                                            [kid]))])
                            default:
                                // TODO: special display for other kinds of actions?
                                return kid
                        }
                    }
                }

                switch (st.mode.case) {
                    case 'cursor': {
                        st.mode.cursor.zips.get(0)
                        return formatZip(st.mode.cursor.zips, undefined)
                            (formatQueryAround(
                                formatWrapper({ case: 'cursor' },
                                    [formatExp(st.mode.cursor.exp, childingQuery ?? st.mode.cursor.zips.get(0))]),
                                st.mode.cursor.zips.get(0)
                            ))(initEnv).node
                    }
                    case 'select':
                        return formatZip(st.mode.select.zipsTop, undefined)
                            (formatQueryAround(
                                formatWrapper({ case: 'select-top' },
                                    [formatZip(st.mode.select.zipsBot, childingQuery ?? st.mode.select.zipsTop.get(0))
                                        (formatWrapper({ case: 'select-bot' },
                                            [formatExp(st.mode.select.exp, getZipsBot(st.mode.select).get(0))]
                                        ))]
                                ),
                                st.mode.select.zipsTop.get(0)
                            ))(initEnv).node
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

