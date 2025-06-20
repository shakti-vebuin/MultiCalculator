// Tip Calculator Implementation

class TipCalculator {
    constructor() {
        this.init();
    }

    init() {
        this.setupInputListeners();
        this.loadPreferences();
    }

    setupInputListeners() {
        const inputs = ['billAmount', 'tipPercentage', 'numberOfPeople'];
        
        inputs.forEach(inputId => {
            const input = document.getElementById(inputId);
            if (input) {
                input.addEventListener('input', 
                    window.utils.debounce(() => this.calculate(), 300)
                );
            }
        });
    }

    loadPreferences() {
        try {
            const saved = localStorage.getItem('tip_calculator_preferences');
            if (saved) {
                const preferences = JSON.parse(saved);
                
                if (preferences.defaultTipPercentage) {
                    document.getElementById('tipPercentage').value = preferences.defaultTipPercentage;
                }
                
                if (preferences.defaultNumberOfPeople) {
                    document.getElementById('numberOfPeople').value = preferences.defaultNumberOfPeople;
                }
            }
        } catch (error) {
            console.warn('Could not load tip calculator preferences:', error);
        }
    }

    savePreferences() {
        try {
            const preferences = {
                defaultTipPercentage: document.getElementById('tipPercentage').value,
                defaultNumberOfPeople: document.getElementById('numberOfPeople').value,
                timestamp: Date.now()
            };
            
            localStorage.setItem('tip_calculator_preferences', JSON.stringify(preferences));
        } catch (error) {
            console.warn('Could not save tip calculator preferences:', error);
        }
    }

    setTipPercent(percent) {
        document.getElementById('tipPercentage').value = percent;
        this.calculate();
    }

    calculate() {
        const billAmountInput = document.getElementById('billAmount');
        const tipPercentageInput = document.getElementById('tipPercentage');
        const numberOfPeopleInput = document.getElementById('numberOfPeople');
        const resultsDiv = document.getElementById('tipResults');

        // Validate inputs
        const billValidation = window.utils.validateNumber(billAmountInput.value, 0);
        const tipValidation = window.utils.validateNumber(tipPercentageInput.value, 0, 100);
        const peopleValidation = window.utils.validateNumber(numberOfPeopleInput.value, 1);

        if (!billValidation.valid) {
            this.showError('Please enter a valid bill amount');
            return;
        }

        if (!tipValidation.valid) {
            this.showError('Please enter a valid tip percentage (0-100%)');
            return;
        }

        if (!peopleValidation.valid) {
            this.showError('Please enter a valid number of people (minimum 1)');
            return;
        }

        const billAmount = billValidation.value;
        const tipPercentage = tipValidation.value;
        const numberOfPeople = peopleValidation.value;

        // Calculate tip and totals
        const tipAmount = (tipPercentage / 100) * billAmount;
        const totalAmount = billAmount + tipAmount;
        const perPersonAmount = totalAmount / numberOfPeople;
        const tipPerPerson = tipAmount / numberOfPeople;

        // Update display
        document.getElementById('tipAmount').textContent = window.appManager.formatCurrency(tipAmount);
        document.getElementById('totalAmount').textContent = window.appManager.formatCurrency(totalAmount);
        document.getElementById('perPersonAmount').textContent = window.appManager.formatCurrency(perPersonAmount);

        // Show detailed breakdown
        this.showDetailedBreakdown(billAmount, tipAmount, totalAmount, numberOfPeople, tipPerPerson, perPersonAmount);

        // Save preferences and calculation
        this.savePreferences();
        
        if (window.appManager) {
            window.appManager.saveCalculation('tip', {
                billAmount: billAmount,
                tipPercentage: tipPercentage,
                numberOfPeople: numberOfPeople
            }, {
                tipAmount: tipAmount,
                totalAmount: totalAmount,
                perPersonAmount: perPersonAmount
            });
        }
    }

    showDetailedBreakdown(billAmount, tipAmount, totalAmount, numberOfPeople, tipPerPerson, perPersonAmount) {
        const resultsDiv = document.getElementById('tipResults');
        
        // Add breakdown section if it doesn't exist
        let breakdownDiv = document.getElementById('tipBreakdown');
        if (!breakdownDiv) {
            breakdownDiv = document.createElement('div');
            breakdownDiv.id = 'tipBreakdown';
            breakdownDiv.className = 'tip-breakdown';
            resultsDiv.appendChild(breakdownDiv);
        }

        breakdownDiv.innerHTML = `
            <div class="breakdown-section">
                <h4>Detailed Breakdown:</h4>
                <div class="breakdown-grid">
                    <div class="breakdown-item">
                        <span>Bill Amount:</span>
                        <span>${window.appManager.formatCurrency(billAmount)}</span>
                    </div>
                    <div class="breakdown-item">
                        <span>Tip Amount:</span>
                        <span>${window.appManager.formatCurrency(tipAmount)}</span>
                    </div>
                    <div class="breakdown-item total">
                        <span>Total Amount:</span>
                        <span>${window.appManager.formatCurrency(totalAmount)}</span>
                    </div>
                </div>
                
                ${numberOfPeople > 1 ? `
                    <div class="per-person-section">
                        <h5>Per Person (${numberOfPeople} people):</h5>
                        <div class="breakdown-grid">
                            <div class="breakdown-item">
                                <span>Bill per person:</span>
                                <span>${window.appManager.formatCurrency(billAmount / numberOfPeople)}</span>
                            </div>
                            <div class="breakdown-item">
                                <span>Tip per person:</span>
                                <span>${window.appManager.formatCurrency(tipPerPerson)}</span>
                            </div>
                            <div class="breakdown-item total">
                                <span>Total per person:</span>
                                <span>${window.appManager.formatCurrency(perPersonAmount)}</span>
                            </div>
                        </div>
                    </div>
                ` : ''}
                
                <div class="tip-suggestions">
                    <h5>Other tip amounts:</h5>
                    <div class="suggestions-grid">
                        ${this.generateTipSuggestions(billAmount, numberOfPeople)}
                    </div>
                </div>
            </div>
        `;
    }

    generateTipSuggestions(billAmount, numberOfPeople) {
        const tipPercentages = [10, 15, 18, 20, 25];
        const currentTipPercent = parseFloat(document.getElementById('tipPercentage').value);
        
        return tipPercentages
            .filter(percent => percent !== currentTipPercent)
            .map(percent => {
                const tipAmount = (percent / 100) * billAmount;
                const totalAmount = billAmount + tipAmount;
                const perPersonAmount = totalAmount / numberOfPeople;
                
                return `
                    <div class="suggestion-item" onclick="tipCalculator.setTipPercent(${percent})">
                        <div class="suggestion-percent">${percent}%</div>
                        <div class="suggestion-total">${window.appManager.formatCurrency(totalAmount)}</div>
                        ${numberOfPeople > 1 ? `<div class="suggestion-per-person">${window.appManager.formatCurrency(perPersonAmount)}/person</div>` : ''}
                    </div>
                `;
            }).join('');
    }

    showError(message) {
        const resultsDiv = document.getElementById('tipResults');
        resultsDiv.innerHTML = `<div class="error-message" style="color: var(--danger-color); text-align: center; padding: 1rem;">${message}</div>`;
    }

    // Split bill functionality
    calculateSplitBill() {
        const billAmount = parseFloat(document.getElementById('billAmount').value || 0);
        const tipPercentage = parseFloat(document.getElementById('tipPercentage').value || 0);
        const numberOfPeople = parseInt(document.getElementById('numberOfPeople').value || 1);

        if (billAmount <= 0 || numberOfPeople <= 0) {
            this.showError('Please enter valid bill amount and number of people');
            return;
        }

        const tipAmount = (tipPercentage / 100) * billAmount;
        const totalAmount = billAmount + tipAmount;
        
        const billPerPerson = billAmount / numberOfPeople;
        const tipPerPerson = tipAmount / numberOfPeople;
        const totalPerPerson = totalAmount / numberOfPeople;

        return {
            billPerPerson,
            tipPerPerson,
            totalPerPerson,
            totalBill: billAmount,
            totalTip: tipAmount,
            totalAmount: totalAmount
        };
    }

    // Round amounts for easier cash payments
    roundForCash(amount, roundTo = 0.25) {
        return Math.ceil(amount / roundTo) * roundTo;
    }

    // Calculate tip to reach a round number
    calculateTipForRoundTotal(billAmount, targetTotal) {
        const tipAmount = targetTotal - billAmount;
        const tipPercentage = (tipAmount / billAmount) * 100;
        
        return {
            tipAmount,
            tipPercentage,
            targetTotal
        };
    }

    // Export tip calculation
    exportCalculation() {
        const billAmount = parseFloat(document.getElementById('billAmount').value || 0);
        const tipPercentage = parseFloat(document.getElementById('tipPercentage').value || 0);
        const numberOfPeople = parseInt(document.getElementById('numberOfPeople').value || 1);

        if (billAmount <= 0) {
            this.showError('Please calculate a tip first');
            return;
        }

        const calculation = this.calculateSplitBill();
        
        const exportData = {
            calculator: 'Tip Calculator',
            inputs: {
                billAmount,
                tipPercentage,
                numberOfPeople
            },
            results: calculation,
            timestamp: new Date().toISOString(),
            formattedResults: {
                tipAmount: window.appManager.formatCurrency(calculation.totalTip),
                totalAmount: window.appManager.formatCurrency(calculation.totalAmount),
                perPersonAmount: window.appManager.formatCurrency(calculation.totalPerPerson)
            }
        };

        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `tip-calculation-${new Date().getTime()}.json`;
        link.click();
        
        URL.revokeObjectURL(url);
    }

    // Clear all inputs
    clearAll() {
        document.getElementById('billAmount').value = '';
        document.getElementById('tipPercentage').value = '15';
        document.getElementById('numberOfPeople').value = '1';
        
        const resultsDiv = document.getElementById('tipResults');
        resultsDiv.innerHTML = `
            <div class="result-item">
                <span>Tip Amount:</span>
                <span id="tipAmount">$0.00</span>
            </div>
            <div class="result-item">
                <span>Total Amount:</span>
                <span id="totalAmount">$0.00</span>
            </div>
            <div class="result-item">
                <span>Per Person:</span>
                <span id="perPersonAmount">$0.00</span>
            </div>
        `;
    }
}

// Initialize tip calculator when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.tipCalculator = new TipCalculator();
});
