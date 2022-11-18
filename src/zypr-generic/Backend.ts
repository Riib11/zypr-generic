import { List, Record, RecordOf } from 'immutable'
import { EndoPart, EndoReadPart } from '../Endo'
import { Direction } from './Direction'
import { Query } from './Editor'
import { Exp, Grammar, makeExpTemplate, makeHole, makeZipTemplates, Zip } from './Language'
import { ExpNode, formatWrapper, Node } from './Node'

// Env: render environment
// Dat: render data

export type Backend<Met, Rul, Val, Dat> = {
    props: Props<Met, Rul, Val, Dat>,
    state: State<Met, Rul, Val, Dat>
}

export type Props<Met, Rul, Val, Dat> = {
    grammar: Grammar<Met, Rul, Val>,
    isValidSelect: (select: Select<Met, Rul, Val>) => boolean,
    format: (st: State<Met, Rul, Val, Dat>, query: Query) => Node<Met, Rul, Val, Dat>,
    interpQueryString: (st: State<Met, Rul, Val, Dat>, str: string) => Action<Met, Rul, Val>[],
    interpKeyboardCommandEvent: (st: State<Met, Rul, Val, Dat>, event: KeyboardEvent) => Action<Met, Rul, Val> | undefined,
    handleAction: (act: Action<Met, Rul, Val>) => EndoReadPart<Props<Met, Rul, Val, Dat>, State<Met, Rul, Val, Dat>>
}

export function interpQueryAction<Met, Rul, Val, Dat>(
    backend: Props<Met, Rul, Val, Dat>,
    st: State<Met, Rul, Val, Dat>,
    query: Query
): Action<Met, Rul, Val> | undefined {
    const acts = backend.interpQueryString(st, query.str)
    if (acts.length === 0) return undefined
    return acts[query.i % acts.length]
}

export function handleQueryAction<Met, Rul, Val, Dat>(
    backend: Props<Met, Rul, Val, Dat>,
    st: State<Met, Rul, Val, Dat>,
    query: Query
): EndoReadPart<Props<Met, Rul, Val, Dat>, State<Met, Rul, Val, Dat>> | undefined {
    const act = interpQueryAction(backend, st, query)
    if (act === undefined) return undefined
    return backend.handleAction(act)
}

export type Action<Met, Rul, Val>
    = { case: 'move_cursor', dir: Direction }
    | { case: 'move_select', dir: Direction }
    | { case: 'set_cursor', cursor: Cursor<Met, Rul, Val> }
    | { case: 'set_select', select: Select<Met, Rul, Val> }
    | { case: 'replace', exp: Exp<Met, Rul, Val> }
    | { case: 'insert', zips: List<Zip<Met, Rul, Val>> }
    | { case: BasicAction }
export type BasicAction = 'undo' | 'redo' | 'copy' | 'cut' | 'paste' | 'delete' | 'escape'

export type State<Met, Rul, Val, Dat> = RecordOf<State_<Met, Rul, Val, Dat>>
export const makeState = <Met, Rul, Val, Dat>(state_: State_<Met, Rul, Val, Dat>): State<Met, Rul, Val, Dat> => Record<State_<Met, Rul, Val, Dat>>(state_)()
export type State_<Met, Rul, Val, Dat> = {
    mode: Mode<Met, Rul, Val>,
    clipboard: Clipboard<Met, Rul, Val>,
    history: List<State<Met, Rul, Val, Dat>>,
    future: List<State<Met, Rul, Val, Dat>>
}

export type Mode<Met, Rul, Val>
    = { case: 'cursor', cursor: Cursor<Met, Rul, Val> }
    | { case: 'select', select: Select<Met, Rul, Val> }

export type Cursor<Met, Rul, Val> = { zips: List<Zip<Met, Rul, Val>>, exp: Exp<Met, Rul, Val> }

export type Select<Met, Rul, Val> = { zipsTop: List<Zip<Met, Rul, Val>>, zipsBot: List<Zip<Met, Rul, Val>>, exp: Exp<Met, Rul, Val>, orient: Orient }

export type Clipboard<Met, Rul, Val>
    = { case: 'exp', exp: Exp<Met, Rul, Val> }
    | { case: 'zips', zips: List<Zip<Met, Rul, Val>> }
    | undefined

// top: the top of the select can move
// bot: the bot of the select can move
export type Orient = 'top' | 'bot'

export type Childing<Zip> = Zip | undefined

// updateState

export function updateState<Met, Rul, Val, Dat>(f: EndoReadPart<Props<Met, Rul, Val, Dat>, State<Met, Rul, Val, Dat>>): EndoReadPart<Props<Met, Rul, Val, Dat>, State<Met, Rul, Val, Dat>> {
    return (pr, st) => {
        const st_ = f(pr, st)
        if (st_ === undefined) return undefined
        return st_
            .update('history', (hist) => hist.size < 500 ? hist.unshift(st) : hist)
            .set('future', List([]))
    }
}

export function updateMode<Met, Rul, Val, Dat>(f: EndoPart<Mode<Met, Rul, Val>>): EndoReadPart<Props<Met, Rul, Val, Dat>, State<Met, Rul, Val, Dat>> {
    return (pr, st) => {
        return st
            .update('mode', (mode) => f(mode) ?? mode)
            .update('history', (hist) => hist.size < 500 ? hist.unshift(st) : hist)
            .set('future', List([]))
    }
}

export function undo<Met, Rul, Val, Dat>(): EndoReadPart<Props<Met, Rul, Val, Dat>, State<Met, Rul, Val, Dat>> {
    return (pr, st) => {
        console.log("history.size", st.history.size)
        const st_ = st.history.get(0)
        if (st_ === undefined) return undefined
        return st_
            .update('future', futr => futr.size < 500 ? futr.unshift(st) : futr)
    }
}

export function redo<Met, Rul, Val, Dat>(): EndoReadPart<Props<Met, Rul, Val, Dat>, State<Met, Rul, Val, Dat>> {
    return (pr, st) => {
        const st_ = st.future.get(0)
        if (st_ === undefined) return undefined
        return st_
            .update('history', hist => hist.size < 500 ? hist.unshift(st) : hist)
    }
}

export function getStateMet<Met, Rul, Val, Dat>(gram: Grammar<Met, Rul, Val>, st: State<Met, Rul, Val, Dat>): Met {
    return getModeMet(gram, st.mode)
}

export function cut<Met, Rul, Val, Dat>(): EndoReadPart<Props<Met, Rul, Val, Dat>, State<Met, Rul, Val, Dat>> {
    return updateState((pr, st): State<Met, Rul, Val, Dat> | undefined => {
        const met = getStateMet(pr.grammar, st)
        switch (st.mode.case) {
            case 'cursor': return st
                .set('mode', { case: 'cursor', cursor: { zips: st.mode.cursor.zips, exp: makeHole(pr.grammar, met) } })
                .set('clipboard', { case: 'exp', exp: st.mode.cursor.exp })

            case 'select': return st
                .set('mode', { case: 'cursor', cursor: { zips: st.mode.select.zipsTop, exp: st.mode.select.exp } })
                .set('clipboard', { case: 'zips', zips: getZipsBot(st.mode.select) })
        }
    })
}

export function copy<Met, Rul, Val, Dat>(): EndoReadPart<Props<Met, Rul, Val, Dat>, State<Met, Rul, Val, Dat>> {
    return updateState((pr, st): State<Met, Rul, Val, Dat> | undefined => {
        switch (st.mode.case) {
            case 'cursor': return st
                .set('clipboard', { case: 'exp', exp: st.mode.cursor.exp })

            case 'select': return st
                .set('clipboard', { case: 'zips', zips: getZipsBot(st.mode.select) })
        }
    })
}

export function paste<Met, Rul, Val, Dat>(): EndoReadPart<Props<Met, Rul, Val, Dat>, State<Met, Rul, Val, Dat>> {
    return updateState((pr, st): State<Met, Rul, Val, Dat> | undefined => {
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

export function getZipsBot<Met, Rul, Val>(select: Select<Met, Rul, Val>) {
    switch (select.orient) {
        case 'top': return select.zipsBot.reverse()
        case 'bot': return select.zipsBot
    }
}

export function setZipsBot<Met, Rul, Val>(select: Select<Met, Rul, Val>, zips: List<Zip<Met, Rul, Val>>) {
    switch (select.orient) {
        case 'top': return { ...select, zipsBot: zips.reverse() }
        case 'bot': return { ...select, zipsBot: zips }
    }
}

export function getModeMet<Met, Rul, Val, Dat>(
    gram: Grammar<Met, Rul, Val>,
    mode: Mode<Met, Rul, Val>
): Met {
    switch (mode.case) {
        case 'cursor': return mode.cursor.exp.met
        case 'select': return mode.select.exp.met
    }
}

export function buildInterpQueryString<Met, Rul, Val, Dat>(
    gram: Grammar<Met, Rul, Val>,
    parse: (met: Met, str: string) => Rul | undefined
) {
    return (
        st: State<Met, Rul, Val, Dat>,
        str: string
    ): Action<Met, Rul, Val>[] => {
        const met = getModeMet(gram, st.mode)
        const rul = parse(met, str)
        if (rul === undefined) return []
        const kids = gram.kids(rul)
        if (kids.length === 0) return [{
            case: 'replace',
            exp: makeExpTemplate(gram, met, rul)
        }]
        else return makeZipTemplates(gram, met, rul).map(zip => ({
            case: 'insert',
            zips: List([zip])
        }))
    }
}

// buildBackend

export function buildBackend<Met, Rul, Val, Dat, Env>(
    { grammar, isValidSelect, makeInitEnv, formatExp, formatZip, interpQueryString, interpKeyboardCommandEvent, handleAction, initExp }: {
        grammar: Grammar<Met, Rul, Val>,
        isValidSelect: Props<Met, Rul, Val, Dat>['isValidSelect'], // is this necessary, or can be abstracted to Language?
        initExp: Exp<Met, Rul, Val>,
        // actions
        interpQueryString: Props<Met, Rul, Val, Dat>['interpQueryString'],
        interpKeyboardCommandEvent: Props<Met, Rul, Val, Dat>['interpKeyboardCommandEvent'],
        handleAction: Props<Met, Rul, Val, Dat>['handleAction'],
        // formatting
        makeInitEnv: (st: State<Met, Rul, Val, Dat>) => Env,
        formatExp: (exp: Exp<Met, Rul, Val>, childing: Childing<Zip<Met, Rul, Val>>) => (env: Env) => ExpNode<Met, Rul, Val, Dat>,
        formatZip: (zips: List<Zip<Met, Rul, Val>>, childing: Childing<Zip<Met, Rul, Val>>) => (kid: (env: Env) => ExpNode<Met, Rul, Val, Dat>) => (env: Env) => ExpNode<Met, Rul, Val, Dat>
    },
): Backend<Met, Rul, Val, Dat> {
    return {
        props: {
            grammar,
            isValidSelect,
            format: (st, query) => {
                const initEnv = makeInitEnv(st)

                const acts: Action<Met, Rul, Val>[] | undefined =
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

                function formatQueryAround(kid: (env: Env) => ExpNode<Met, Rul, Val, Dat>, childing: Childing<Zip<Met, Rul, Val>>): (env: Env) => ExpNode<Met, Rul, Val, Dat> {
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
            interpKeyboardCommandEvent,
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

