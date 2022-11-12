import { List, RecordOf } from "immutable"

// PreExp
export type PreExp
    = { case: 'var', dat: { label: string } }
    | { case: 'app', dat: { indentedArg: boolean } }

// Exp
// Exp <: PreExp
export type Exp
    = { case: 'var', dat: { label: string } }
    | { case: 'app', dat: { indentedArg: boolean }, apl: Exp, arg: Exp }

// Zip
// Zip <: PreExp
export type Zip = PreExp & {
    kidsLeft: List<Exp>,
    kidsRight: List<Exp>
}

// Dat
export type Dat = {
    preExp: PreExp | undefined,
    indented: boolean
}
