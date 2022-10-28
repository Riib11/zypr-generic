import { List, Map } from 'immutable';

export type Grammar<Meta, Rule> =
  Map<
    Meta,
    Map<Rule, List<Item<Meta>>>
  >

export type Item<Meta> = Meta | Atom;

export type Atom = 'string' | 'unit'