export const gradeSubmission = async (code: string, strikes: number) => {
    // 1. Simulate AI Processing Delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // 2. Security Check
    if (strikes >= 3) {
        return { passed: false, score: 0, feedback: "Failed due to security violations." };
    }

    // 3. Logic Check (Mocking AI)
    // We check if the user actually wrote the function signature or logic
    const hasFunction = code.includes("def reverse_string");
    const hasReturn = code.includes("return");
    const hasSlice = code.includes("[::-1]"); // Common python reversal trick

    if (hasFunction && hasReturn && hasSlice) {
        return { 
            passed: true, 
            score: 100, 
            feedback: "Perfect! Optimal solution detected." 
        };
    } else if (hasFunction && hasReturn) {
        return { 
            passed: true, 
            score: 80, 
            feedback: "Good attempt, but logic could be more Pythonic." 
        };
    } else {
        return { 
            passed: false, 
            score: 20, 
            feedback: "Syntax Error: Function definition missing." 
        };
    }
};