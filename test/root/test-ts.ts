// >> ts-snippet
export function sum(a, b){
    return a + b;
}
// << ts-snippet

// >> ts-snippet-with-hidden-section
export function div(a, b){
    // >> (hide)
    console.log("You should not see this!")
    // << (hide)    
    return a / b;
}
// << ts-snippet-with-hidden-section
