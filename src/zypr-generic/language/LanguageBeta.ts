import * as Language from "../Language"

export type Pre = Language.Pre<Met, Rul, Val>
export type Exp = Language.Exp<Met, Rul, Val>
export type Zip = Language.Zip<Met, Rul, Val>

export type Met
    = 'bnd'
    | 'exp'

export type Rul
    = 'bnd'  // bnd
    | 'var' | 'app' | 'lam' | 'hol' // exp

export type Val = BndVal | VarVal | AppVal | HolVal
export type BndVal = { label: string }
export type VarVal = { label: string }
export type AppVal = { indentedArg: boolean }
export type LamVal = { indentedBod: boolean }
export type HolVal = {}

export const isArg = (zip: Zip) =>
    zip.rul === 'app' && zip.kidsLeft.size === 1

export const isApl = (zip: Zip) =>
    zip.rul === 'app' && zip.kidsLeft.size === 0

export const isBod = (zip: Zip) =>
    zip.rul === 'lam' && zip.kidsLeft.size == 1


export default function grammar(): Language.Grammar<Met, Rul, Val> {
    return Language.buildGrammar<Met, Rul, Val>({
        rules: {
            'bnd': ['bnd'],
            'exp': ['var', 'app', 'lam', 'hol']
        },
        valueDefault: {
            // bnd
            'bnd': { label: "" },
            // exp
            'var': { label: "" },
            'app': { indentedArg: false },
            'lam': { indentedBod: false },
            'hol': {}
        },
        kids: {
            // bnd
            'bnd': [],
            // exp
            'var': [],
            'app': ['exp', 'exp'],
            'lam': ['bnd', 'exp'],
            'hol': []
        },
        holeRule: {
            'bnd': 'bnd',
            'exp': 'hol'
        }
    })
}