export default function interactString(event: KeyboardEvent, str: string): string | undefined {
    if (event.key.match("Backspace") && !event.ctrlKey) {
        return str.slice(0, str.length - 1)
    } else if (event.key.match("Backspace") && event.ctrlKey) {
        return ""
    } else if (event.key.match(/^.$/) && event.key !== " ") {
        return str.concat(event.key)
    }
    // if (event.key.match(/^[0-9a-z]$/)) {
    //     return str.concat(event.key)
    // } 
    return undefined
}