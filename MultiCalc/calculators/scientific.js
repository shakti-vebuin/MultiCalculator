// Scientific Calculator Implementation

class ScientificCalculator {
    constructor() {
        this.display = document.getElementById('scientificDisplay');
        this.expressionDisplay = document.getElementById('scientificExpression');
        this.currentInput = '0';
        this.previousInput = '';
        this.operation = null;
        this.waitingForNewInput = false;
        this.memory = 0;
        this.angleMode = 'deg'; // 'deg' or 'rad'
        this.expression = '';
        this.init();
    }

    init() {
        this.updateDisplay();
        this.setupKeyboardListeners();
    }

    setupKeyboardListeners() {
        document.addEventListener('keydown', (e) => {
            // Only handle keyboard input when scientific calculator is active
            if (!document.getElementById('scientific').classList.contains('active')) return;

            const key = e.key;
            
            // Numbers
            if ('0123456789'.includes(key)) {
                e.preventDefault();
                this.inputNumber(key);
            }
            // Operations
            else if ('+-*/'.includes(key)) {
                e.preventDefault();
                const op = key === '*' ? '*' : key === '/' ? '/' : key;
                this.inputOperation(op);
            }
            // Decimal point
            else if (key === '.') {
                e.preventDefault();
                this.inputDecimal();
            }
            // Equals
            else if (key === 'Enter' || key === '=') {
                e.preventDefault();
                this.calculate();
            }
            // Clear
            else if (key === 'Escape' || key.toLowerCase() === 'c') {
                e.preventDefault();
                this.clear();
            }
            // Backspace
            else if (key === 'Backspace') {
                e.preventDefault();
                this.backspace();
            }
        });
    }

    inputNumber(num) {
        if (this.waitingForNewInput) {
            this.currentInput = num;
            this.waitingForNewInput = false;
        } else {
            this.currentInput = this.currentInput === '0' ? num : this.currentInput + num;
        }
        this.updateDisplay();
    }

    inputDecimal() {
        if (this.waitingForNewInput) {
            this.currentInput = '0.';
            this.waitingForNewInput = false;
        } else if (!this.currentInput.includes('.')) {
            this.currentInput += '.';
        }
        this.updateDisplay();
    }

    inputOperation(op) {
        if (this.operation && !this.waitingForNewInput) {
            this.calculate();
        }

        this.previousInput = this.currentInput;
        this.operation = op;
        this.waitingForNewInput = true;
    }

    inputFunction(func) {
        const current = parseFloat(this.currentInput);
        let result;

        try {
            switch (func) {
                case 'sin':
                    result = Math.sin(this.toRadians(current));
                    break;
                case 'cos':
                    result = Math.cos(this.toRadians(current));
                    break;
                case 'tan':
                    result = Math.tan(this.toRadians(current));
                    break;
                case 'log':
                    if (current <= 0) throw new Error('Invalid input for logarithm');
                    result = Math.log10(current);
                    break;
                case 'ln':
                    if (current <= 0) throw new Error('Invalid input for natural logarithm');
                    result = Math.log(current);
                    break;
                case 'sqrt':
                    if (current < 0) throw new Error('Invalid input for square root');
                    result = Math.sqrt(current);
                    break;
                case 'pow':
                    this.inputOperation('^');
                    return;
                case 'factorial':
                    if (current < 0 || current !== Math.floor(current) || current > 170) {
                        throw new Error('Invalid input for factorial');
                    }
                    result = this.factorial(current);
                    break;
                default:
                    return;
            }

            if (!isFinite(result)) {
                throw new Error('Result is too large or invalid');
            }

            this.currentInput = this.formatResult(result);
            this.waitingForNewInput = true;

            // Save to history
            if (window.appManager) {
                window.appManager.saveCalculation('scientific', {
                    function: func,
                    input: current
                }, result);
            }

        } catch (error) {
            this.currentInput = 'Error';
            this.waitingForNewInput = true;
        }

        this.updateDisplay();
    }

    inputConstant(constant) {
        switch (constant) {
            case 'pi':
                this.currentInput = Math.PI.toString();
                break;
            case 'e':
                this.currentInput = Math.E.toString();
                break;
        }
        this.waitingForNewInput = true;
        this.updateDisplay();
    }

    calculate() {
        if (this.operation && this.previousInput !== '' && !this.waitingForNewInput) {
            const prev = parseFloat(this.previousInput);
            const current = parseFloat(this.currentInput);
            let result;

            try {
                switch (this.operation) {
                    case '+':
                        result = prev + current;
                        break;
                    case '-':
                        result = prev - current;
                        break;
                    case '*':
                        result = prev * current;
                        break;
                    case '/':
                        if (current === 0) {
                            throw new Error('Cannot divide by zero');
                        }
                        result = prev / current;
                        break;
                    case '^':
                        result = Math.pow(prev, current);
                        break;
                    default:
                        return;
                }

                if (!isFinite(result)) {
                    throw new Error('Result is too large');
                }

                this.currentInput = this.formatResult(result);
                this.operation = null;
                this.previousInput = '';
                this.waitingForNewInput = true;

                // Save to history
                if (window.appManager) {
                    window.appManager.saveCalculation('scientific', {
                        expression: `${prev} ${this.operation || '='} ${current}`,
                        operation: this.operation
                    }, result);
                }

            } catch (error) {
                this.currentInput = 'Error';
                this.operation = null;
                this.previousInput = '';
                this.waitingForNewInput = true;
            }
        }
        
        this.updateDisplay();
    }

    clear() {
        this.currentInput = '0';
        this.previousInput = '';
        this.operation = null;
        this.waitingForNewInput = false;
        this.updateDisplay();
    }

    clearEntry() {
        this.currentInput = '0';
        this.updateDisplay();
    }

    backspace() {
        if (!this.waitingForNewInput && this.currentInput !== '0') {
            this.currentInput = this.currentInput.slice(0, -1);
            if (this.currentInput === '' || this.currentInput === '-') {
                this.currentInput = '0';
            }
            this.updateDisplay();
        }
    }

    toRadians(degrees) {
        return this.angleMode === 'deg' ? degrees * (Math.PI / 180) : degrees;
    }

    toDegrees(radians) {
        return this.angleMode === 'rad' ? radians * (180 / Math.PI) : radians;
    }

    factorial(n) {
        if (n <= 1) return 1;
        let result = 1;
        for (let i = 2; i <= n; i++) {
            result *= i;
        }
        return result;
    }

    formatResult(result) {
        // Handle very small numbers
        if (Math.abs(result) < 1e-10 && result !== 0) {
            return result.toExponential(6);
        }
        
        // Handle very large numbers
        if (Math.abs(result) > 1e12) {
            return result.toExponential(6);
        }
        
        // Remove unnecessary decimal places
        if (result % 1 === 0) {
            return result.toString();
        }
        
        // Limit decimal places to avoid floating point errors
        return parseFloat(result.toFixed(10)).toString();
    }

    updateDisplay() {
        this.display.value = this.currentInput;
    }

    updateExpressionDisplay() {
        if (this.expressionDisplay) {
            this.expressionDisplay.textContent = this.expression;
        }
    }

    // Memory functions
    memoryStore() {
        this.memory = parseFloat(this.currentInput) || 0;
    }

    memoryRecall() {
        this.currentInput = this.memory.toString();
        this.waitingForNewInput = true;
        this.updateDisplay();
    }

    memoryClear() {
        this.memory = 0;
    }

    memoryAdd() {
        this.memory += parseFloat(this.currentInput) || 0;
    }

    memorySubtract() {
        this.memory -= parseFloat(this.currentInput) || 0;
    }

    // Toggle angle mode
    toggleAngleMode() {
        this.angleMode = this.angleMode === 'deg' ? 'rad' : 'deg';
        // You could update a display indicator here
    }
}

// Initialize scientific calculator when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.scientificCalculator = new ScientificCalculator();
});
