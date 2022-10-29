import { List, Map } from 'immutable';

export type Grammar<Meta, Rule> =
  (meta: Meta) => (rule: Rule) => List<Meta>

export type ShowGrammar<Meta, Rule> =
  (meta: Meta, rule: Rule) => (exps: List<string>) => string