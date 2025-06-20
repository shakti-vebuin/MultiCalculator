// Standard Calculator Implementation

class StandardCalculator {
    constructor() {
        this.display = document.getElementById('standardDisplay');
        this.expressionDisplay = document.getElementById('standardExpression');
        this.currentInput = '0';
        this.previousInput = '';
        this.operation = null;
        this.waitingForNewInput = false;
        this.expression = '';
        this.init();
    }

    init() {
        this.updateDisplay();
        this.setupKeyboardListeners();
    }

    setupKeyboardListeners() {
        document.addEventListener('keydown', (e) => {
            // Only handle keyboard input when standard calculator is active
            if (!document.getElementById('standard').classList.contains('active')) return;

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
            if (this.operation) {
                this.expression = this.previousInput + ' ' + this.operation + ' ' + num;
                this.updateExpressionDisplay();
            }
        } else {
            this.currentInput = this.currentInput === '0' ? num : this.currentInput + num;
            if (this.operation) {
                this.expression = this.previousInput + ' ' + this.operation + ' ' + this.currentInput;
                this.updateExpressionDisplay();
            }
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
        this.expression = this.previousInput + ' ' + op + ' ';
        this.waitingForNewInput = true;
        this.updateExpressionDisplay();
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
                    default:
                        return;
                }

                // Check for overflow or invalid results
                if (!isFinite(result)) {
                    throw new Error('Result is too large');
                }

                // Update expression to show full calculation
                this.expression = this.previousInput + ' ' + this.operation + ' ' + this.currentInput + ' = ' + this.formatResult(result);
                this.currentInput = this.formatResult(result);
                this.operation = null;
                this.previousInput = '';
                this.waitingForNewInput = true;

                // Save to history
                if (window.appManager) {
                    window.appManager.saveCalculation('standard', {
                        expression: this.expression,
                        operation: this.operation
                    }, result);
                }

            } catch (error) {
                this.currentInput = 'Error';
                this.expression = 'Error';
                this.operation = null;
                this.previousInput = '';
                this.waitingForNewInput = true;
            }
        }
        
        this.updateDisplay();
        this.updateExpressionDisplay();
    }

    clear() {
        this.currentInput = '0';
        this.previousInput = '';
        this.operation = null;
        this.expression = '';
        this.waitingForNewInput = false;
        this.updateDisplay();
        this.updateExpressionDisplay();
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
}

// Initialize standard calculator when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.standardCalculator = new StandardCalculator();
});
