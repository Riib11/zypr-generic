import { List, Record, RecordOf } from 'immutable'
import { EndoPart } from '../Endo'
import { Direction } from './Direction'
import { Node } from './Node'

// Env: render environment
// Dat: render data

export type Backend<Exp, Zip, Dat> = {
    props: Props<Exp, Zip, Dat>,
    state: State<Exp, Zip, Dat>
}

export type Props<Exp, Zip, Dat> = {
    formatMode: (mode: Mode<Exp, Zip>) => Node<Dat>,
    interpQuery: (mode: Mode<Exp, Zip>, str: string) => QueryInterp<Exp, Zip>[],
    handleAction: (act: Action<Exp, Zip>) => EndoPart<State<Exp, Zip, Dat>>
}

export type Action<Exp, Zip>
    = { case: 'move', dir: Direction }
    | { case: 'set_cursor', cursor: Cursor<Exp, Zip> }
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

export type QueryInterp<Exp, Zip>
    = { case: 'insert', zips: Zip }
    | { case: 'replace', exps: Exp }

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
    formatExp: (exp: Exp) => (env: Env) => Node<Dat>,
    formatZip: (zip: List<Step>) => (kid: (env: Env) => Node<Dat>) => (env: Env) => Node<Dat>,
    // actions
    interpQuery: (mode: Mode<Exp, List<Step>>, str: string) => QueryInterp<Exp, List<Step>>[],
    handleAction: (act: Action<Exp, List<Step>>) => EndoPart<State<Exp, List<Step>, Dat>>,
    // program
    initExp: Exp,
): Backend<Exp, List<Step>, Dat> {
    return {
        props: {
            formatMode: (mode) => {
                switch (mode.case) {
                    case 'cursor':
                        return formatZip(mode.cusror.zip)
                            (formatExp(mode.cusror.exp))
                            (initEnv)
                    case 'select':
                        return formatZip(mode.select.zip_top)
                            (formatZip(mode.select.zip_bot)
                                (formatExp(mode.select.exp)))
                            (initEnv)
                }
            },
            interpQuery,
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
