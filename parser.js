import { bodies } from "./system.js";

var placeholders = []; // fifo, queue

function titleCase(text) { // make the keys all lowercase later
    return text.charAt(0).toUpperCase() + text.substr(1).toLowerCase();
}

export function parseRef(text, ref) {
    if (!isNaN(parseFloat(text))) { // unreliable; later add math support
        return parseFloat(text);
    }

    var x = text.split(".");
    if (titleCase(x[0]) in bodies) {
        x[0] = titleCase(x[0]);
        ref = bodies;
    }
    for (var i of x) {
        ref = ref[i];
    }
    return ref;
}
function parseFunction(text, sandbox) {
    var matches = [...text.matchAll(/([\w.]+)\(([^\(\)]*)\)/g)]; // if remove \), exclude closing bracket from .* too
    // console.log(matches);

    for (var x of matches) {
        var fn = parseRef(x[1], sandbox);
        var args = x[2].split(",");

        for (var i = 0; i < args.length; i++) {
            var parameter = args[i].trim();

            if (parameter[0] == "&") args[i] = placeholders.shift();
            else args[i] = parseRef(parameter, sandbox);
        }
        // Must preserve length to maintain index accuracy
        text = text.slice(0, x.index) + "&".repeat(x[0].length) + text.slice(x.index + x[0].length);
        placeholders.push(fn(...args));
    }
    return text;
}
export function parse(text, sandbox) {
    if (text.includes("=")) { // Assign variable
        var text = text.split("=");
        var varName = text[0].trim();
        var value = text[1].trim();

        sandbox[varName] = parse(value, sandbox);
        return sandbox[varName];
    }
    for (var i = 0; i < 10; i++) { // Execute all functions until all parentheses have collapsed
        text = parseFunction(text, sandbox);
        if (!text.includes("(")) { // No more functions to execute
            var tmp = placeholders.shift(); // should be empty after this point
            return tmp == undefined ? parseRef(text, sandbox) : tmp; // No functions in the first place, print variable instead
        }
    }
    return "SyntaxError: Unclosed bracket"
}