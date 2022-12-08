import { List } from "immutable"
import * as Language from "../Language"

export type Pre = Language.Pre<Met, Rul, Val>
export type Exp = Language.Exp<Met, Rul, Val>
export type Zip = Language.Zip<Met, Rul, Val>

export type Met
  = 'bnd'
  | 'exp'

export type Rul
  // bnf
  = 'bnd'
  // exp
  | 'var'
  | 'app'
  | 'lam'
  | 'hol'

export type Val = BndVal | VarVal | AppVal | LamVal | HolVal
export type BndVal = { label: string }
export type VarVal = { label: string }
export type AppVal = { indentedArg: boolean }
export type LamVal = { indentedBod: boolean }
export type HolVal = {}

export function isApl(zip: Zip | undefined): boolean {
  return zip !== undefined && zip.rul === 'app' && zip.kidsLeft.size === 0
}

export function isArg(zip: Zip | undefined): boolean {
  return zip !== undefined && zip.rul === 'app' && zip.kidsLeft.size === 1
}

export function isBnd(zip: Zip | undefined): boolean {
  return zip !== undefined && zip.rul === 'lam' && zip.kidsLeft.size === 0
}

export function isBod(zip: Zip | undefined): boolean {
  return zip !== undefined && zip.rul === 'lam' && zip.kidsLeft.size === 1
}

export function prettyPre(pre: Pre): string {
  switch (pre.rul) {
    case 'bnd': return "@\"" + (pre.val as BndVal).label + "\""
    case 'var': return "\"" + (pre.val as VarVal).label + "\""
    case 'app': return "(_ _)"
    case 'lam': return "(_ ↦ _)"
    case 'hol': return "?"
  }
}

export default function language(): Language.Language<Met, Rul, Val> {
  let grammar: Language.Grammar<Met, Rul, Val> = {
    rules: (met) => ({
      'bnd': [] as Rul[],
      'exp': ['var', 'app', 'hol'] as Rul[]
    }[met]),
    valueDefault: (rul) => ({
      'bnd': { label: "" } as Val,
      'var': { label: "" } as Val,
      'app': { indentedArg: false } as Val,
      'lam': { indentedBod: false } as Val,
      'hol': {} as Val
    }[rul]),
    kids: (rul) => ({
      'bnd': [] as Met[],
      'var': [] as Met[],
      'app': ['exp', 'exp'] as Met[],
      'lam': ['bnd', 'exp'] as Met[],
      'hol': [] as Met[]
    }[rul]),
    holeRule: (met) => ({
      'bnd': 'bnd' as Rul,
      'exp': 'hol' as Rul
    }[met])
  }

  function isParenthesized(zips: List<Zip>, exp: Exp): boolean {
    let zip = zips.get(0)
    if (zip === undefined) return false
    switch (exp.rul) {
      case 'bnd': return false
      case 'var': return false
      case 'app': return !isApl(zip)
      case 'lam': return !isBod(zip)
      case 'hol': return false
    }
  }

  function isIndentable(zips: List<Zip>, exp: Exp): boolean {
    let zip = zips.get(0)
    if (zip === undefined) return false
    if (isArg(zip) || isBod(zip)) return true
    return false
  }

  return {
    grammar,
    isParenthesized,
    isIndentable
  }
}