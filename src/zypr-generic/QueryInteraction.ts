import interactString from "../StringInteraction";
import { Query } from "./Editor";

export default function interactQuery(
    event: KeyboardEvent,
    query: Query
): Query | undefined {
    const isQueryless = query.str.length === 0
    if (event.key === 'ArrowLeft' && !isQueryless) {
        event.preventDefault()
        return { str: query.str, i: query.i - 1 }
    }
    else if (event.key === 'ArrowRight' && !isQueryless) {
        event.preventDefault()
        return { str: query.str, i: query.i + 1 }
    }
    else if (event.key === 'Escape') {
        event.preventDefault()
        return { str: "", i: 0 }
    }
    else {
        const str = interactString(event, query.str)
        if (str === undefined) return undefined
        event.preventDefault()
        return { str, i: 0 }
    }
}