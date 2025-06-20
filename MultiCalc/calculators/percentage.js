// Percentage Calculator Implementation

class PercentageCalculator {
    constructor() {
        this.init();
    }

    init() {
        this.setupInputListeners();
    }

    setupInputListeners() {
        // Auto-calculate on input change
        const inputs = [
            'percentValue', 'baseValue', 'originalValue', 
            'newValue', 'partValue', 'wholeValue'
        ];

        inputs.forEach(inputId => {
            const input = document.getElementById(inputId);
            if (input) {
                input.addEventListener('input', 
                    window.utils.debounce(() => this.autoCalculate(inputId), 500)
                );
            }
        });
    }

    autoCalculate(inputId) {
        // Auto-calculate based on which input was changed
        if (['percentValue', 'baseValue'].includes(inputId)) {
            const percent = document.getElementById('percentValue').value;
            const base = document.getElementById('baseValue').value;
            if (percent && base) {
                this.calculatePercentOf();
            }
        } else if (['originalValue', 'newValue'].includes(inputId)) {
            const original = document.getElementById('originalValue').value;
            const newVal = document.getElementById('newValue').value;
            if (original && newVal) {
                this.calculateChange();
            }
        } else if (['partValue', 'wholeValue'].includes(inputId)) {
            const part = document.getElementById('partValue').value;
            const whole = document.getElementById('wholeValue').value;
            if (part && whole) {
                this.calculateWhatPercent();
            }
        }
    }

    calculatePercentOf() {
        const percentInput = document.getElementById('percentValue');
        const baseInput = document.getElementById('baseValue');
        const resultDiv = document.getElementById('percentOfResult');

        const percentValidation = window.utils.validateNumber(percentInput.value, 0);
        const baseValidation = window.utils.validateNumber(baseInput.value);

        if (!percentValidation.valid) {
            window.appManager.showError(percentValidation.message, resultDiv);
            return;
        }

        if (!baseValidation.valid) {
            window.appManager.showError(baseValidation.message, resultDiv);
            return;
        }

        const percent = percentValidation.value;
        const base = baseValidation.value;
        const result = (percent / 100) * base;

        resultDiv.innerHTML = `
            <div class="result-breakdown">
                <h4>Result:</h4>
                <p><strong>${percent}% of ${window.appManager.formatNumber(base)} = ${window.appManager.formatNumber(result)}</strong></p>
                <div class="calculation-steps">
                    <p>Calculation: (${percent} ÷ 100) × ${window.appManager.formatNumber(base)} = ${window.appManager.formatNumber(result)}</p>
                </div>
            </div>
        `;

        // Save to history
        if (window.appManager) {
            window.appManager.saveCalculation('percentage', {
                type: 'percentOf',
                percent: percent,
                base: base
            }, result);
        }
    }

    calculateChange() {
        const originalInput = document.getElementById('originalValue');
        const newInput = document.getElementById('newValue');
        const resultDiv = document.getElementById('percentChangeResult');

        const originalValidation = window.utils.validateNumber(originalInput.value);
        const newValidation = window.utils.validateNumber(newInput.value);

        if (!originalValidation.valid) {
            window.appManager.showError(originalValidation.message, resultDiv);
            return;
        }

        if (!newValidation.valid) {
            window.appManager.showError(newValidation.message, resultDiv);
            return;
        }

        const original = originalValidation.value;
        const newValue = newValidation.value;

        if (original === 0) {
            window.appManager.showError('Original value cannot be zero', resultDiv);
            return;
        }

        const change = newValue - original;
        const percentChange = (change / original) * 100;
        const isIncrease = change > 0;
        const changeType = isIncrease ? 'increase' : 'decrease';
        const absPercentChange = Math.abs(percentChange);

        resultDiv.innerHTML = `
            <div class="result-breakdown">
                <h4>Result:</h4>
                <p><strong>${absPercentChange.toFixed(2)}% ${changeType}</strong></p>
                <div class="calculation-details">
                    <p>Original Value: ${window.appManager.formatNumber(original)}</p>
                    <p>New Value: ${window.appManager.formatNumber(newValue)}</p>
                    <p>Absolute Change: ${window.appManager.formatNumber(Math.abs(change))}</p>
                    <p>Percentage Change: ${percentChange.toFixed(2)}%</p>
                </div>
                <div class="calculation-steps">
                    <p>Formula: ((New Value - Original Value) / Original Value) × 100</p>
                    <p>Calculation: ((${window.appManager.formatNumber(newValue)} - ${window.appManager.formatNumber(original)}) / ${window.appManager.formatNumber(original)}) × 100 = ${percentChange.toFixed(2)}%</p>
                </div>
            </div>
        `;

        // Save to history
        if (window.appManager) {
            window.appManager.saveCalculation('percentage', {
                type: 'percentChange',
                original: original,
                newValue: newValue
            }, percentChange);
        }
    }

    calculateWhatPercent() {
        const partInput = document.getElementById('partValue');
        const wholeInput = document.getElementById('wholeValue');
        const resultDiv = document.getElementById('whatPercentResult');

        const partValidation = window.utils.validateNumber(partInput.value);
        const wholeValidation = window.utils.validateNumber(wholeInput.value);

        if (!partValidation.valid) {
            window.appManager.showError(partValidation.message, resultDiv);
            return;
        }

        if (!wholeValidation.valid) {
            window.appManager.showError(wholeValidation.message, resultDiv);
            return;
        }

        const part = partValidation.value;
        const whole = wholeValidation.value;

        if (whole === 0) {
            window.appManager.showError('Whole value cannot be zero', resultDiv);
            return;
        }

        const percentage = (part / whole) * 100;

        resultDiv.innerHTML = `
            <div class="result-breakdown">
                <h4>Result:</h4>
                <p><strong>${window.appManager.formatNumber(part)} is ${percentage.toFixed(2)}% of ${window.appManager.formatNumber(whole)}</strong></p>
                <div class="calculation-details">
                    <p>Part: ${window.appManager.formatNumber(part)}</p>
                    <p>Whole: ${window.appManager.formatNumber(whole)}</p>
                    <p>Percentage: ${percentage.toFixed(2)}%</p>
                </div>
                <div class="calculation-steps">
                    <p>Formula: (Part / Whole) × 100</p>
                    <p>Calculation: (${window.appManager.formatNumber(part)} / ${window.appManager.formatNumber(whole)}) × 100 = ${percentage.toFixed(2)}%</p>
                </div>
            </div>
        `;

        // Save to history
        if (window.appManager) {
            window.appManager.saveCalculation('percentage', {
                type: 'whatPercent',
                part: part,
                whole: whole
            }, percentage);
        }
    }

    // Additional percentage calculations

    calculateMarkup() {
        // Calculate markup percentage
        const cost = parseFloat(document.getElementById('costValue')?.value || 0);
        const price = parseFloat(document.getElementById('priceValue')?.value || 0);
        
        if (cost === 0) return;
        
        const markup = ((price - cost) / cost) * 100;
        return markup;
    }

    calculateDiscount() {
        // Calculate discount amount and final price
        const originalPrice = parseFloat(document.getElementById('originalPrice')?.value || 0);
        const discountPercent = parseFloat(document.getElementById('discountPercent')?.value || 0);
        
        const discountAmount = (discountPercent / 100) * originalPrice;
        const finalPrice = originalPrice - discountAmount;
        
        return {
            discountAmount: discountAmount,
            finalPrice: finalPrice
        };
    }

    calculateTax() {
        // Calculate tax amount and total with tax
        const baseAmount = parseFloat(document.getElementById('taxBaseAmount')?.value || 0);
        const taxPercent = parseFloat(document.getElementById('taxPercent')?.value || 0);
        
        const taxAmount = (taxPercent / 100) * baseAmount;
        const totalWithTax = baseAmount + taxAmount;
        
        return {
            taxAmount: taxAmount,
            totalWithTax: totalWithTax
        };
    }

    // Clear all inputs and results
    clearAll() {
        const inputs = [
            'percentValue', 'baseValue', 'originalValue', 
            'newValue', 'partValue', 'wholeValue'
        ];
        
        inputs.forEach(inputId => {
            const input = document.getElementById(inputId);
            if (input) input.value = '';
        });

        const results = [
            'percentOfResult', 'percentChangeResult', 'whatPercentResult'
        ];
        
        results.forEach(resultId => {
            const result = document.getElementById(resultId);
            if (result) result.innerHTML = '';
        });
    }

    // Export results
    exportResults() {
        const results = [];
        
        // Collect all visible results
        const resultElements = [
            { id: 'percentOfResult', type: 'Percentage Of' },
            { id: 'percentChangeResult', type: 'Percentage Change' },
            { id: 'whatPercentResult', type: 'What Percent' }
        ];
        
        resultElements.forEach(({ id, type }) => {
            const element = document.getElementById(id);
            if (element && element.innerHTML.trim()) {
                results.push({
                    type: type,
                    result: element.textContent.trim(),
                    timestamp: new Date().toLocaleString()
                });
            }
        });
        
        if (results.length > 0) {
            const exportData = {
                calculator: 'Percentage Calculator',
                results: results,
                exportDate: new Date().toISOString()
            };
            
            const dataStr = JSON.stringify(exportData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = `percentage-calculations-${new Date().getTime()}.json`;
            link.click();
            
            URL.revokeObjectURL(url);
        }
    }
}

// Initialize percentage calculator when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.percentageCalculator = new PercentageCalculator();
});
