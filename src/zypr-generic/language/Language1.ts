import { List, RecordOf } from "immutable"

// PreExp

// export type PreExp = {
//     case: Exp['case'],
//     dat: Exp['dat']
// }

export type PreExp
    = { case: 'var', dat: { label: string } }
    | { case: 'app', dat: { indentedArg: boolean } }

// Exp

// Exp <: PreExp
export type Exp
    = { case: 'var', dat: { label: string } }
    | { case: 'app', dat: { indentedArg: boolean }, apl: Exp, arg: Exp }

// Zip

export type Zip = List<Step>

// ZipStep <: PreExp
export type Step = PreExp & {
    kidsLeft: List<Exp>,
    kidsRight: List<Exp>
}


// {
//     case: PreExp['case'],
//     dat: PreExp['dat'],
//     kidsLeft: List<Exp>,
//     kidsRight: List<Exp>
// }

// Dat

export type Dat = {
    preExp: PreExp | undefined,
    indented: boolean
}
