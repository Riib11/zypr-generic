import * as Language from "../Language"

export type Pre = Language.Pre<Met, Rul, Val>
export type Exp = Language.Exp<Met, Rul, Val>
export type Zip = Language.Zip<Met, Rul, Val>

export type Met
    = 'exp'

export type Rul
    = 'var'
    | 'app'
    | 'hol'

export type Val = VarVal | AppVal | HolVal
export type VarVal = { label: string }
export type AppVal = { indentedArg: boolean }
export type HolVal = {}

export const grammar: Language.Grammar<Met, Rul, Val> =
    Language.buildGrammar<Met, Rul, Val>({
        rules: {
            'exp': ['var', 'app', 'hol']
        },
        valueDefault: {
            'var': { label: "" },
            'app': { indentedArg: false },
            'hol': {}
        },
        kids: {
            'var': [],
            'app': ['exp', 'exp'],
            'hol': []
        },
        holeRule: {
            'exp': 'hol'
        }
    })
