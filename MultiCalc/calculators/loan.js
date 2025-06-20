// Loan Calculator Implementation

class LoanCalculator {
    constructor() {
        this.init();
    }

    init() {
        this.setupInputListeners();
        this.loadPreferences();
    }

    setupInputListeners() {
        const inputs = ['loanAmount', 'interestRate', 'loanTerm'];
        
        inputs.forEach(inputId => {
            const input = document.getElementById(inputId);
            if (input) {
                input.addEventListener('input', 
                    window.utils.debounce(() => this.autoCalculate(), 500)
                );
            }
        });
    }

    loadPreferences() {
        try {
            const saved = localStorage.getItem('loan_calculator_preferences');
            if (saved) {
                const preferences = JSON.parse(saved);
                
                Object.keys(preferences).forEach(key => {
                    const input = document.getElementById(key);
                    if (input && preferences[key]) {
                        input.value = preferences[key];
                    }
                });
            }
        } catch (error) {
            console.warn('Could not load loan calculator preferences:', error);
        }
    }

    savePreferences() {
        try {
            const preferences = {
                loanAmount: document.getElementById('loanAmount').value,
                interestRate: document.getElementById('interestRate').value,
                loanTerm: document.getElementById('loanTerm').value,
                timestamp: Date.now()
            };
            
            localStorage.setItem('loan_calculator_preferences', JSON.stringify(preferences));
        } catch (error) {
            console.warn('Could not save loan calculator preferences:', error);
        }
    }

    autoCalculate() {
        const loanAmount = document.getElementById('loanAmount').value;
        const interestRate = document.getElementById('interestRate').value;
        const loanTerm = document.getElementById('loanTerm').value;
        
        if (loanAmount && interestRate && loanTerm) {
            this.calculate();
        }
    }

    calculate() {
        const loanAmountInput = document.getElementById('loanAmount');
        const interestRateInput = document.getElementById('interestRate');
        const loanTermInput = document.getElementById('loanTerm');
        const resultsDiv = document.getElementById('loanResults');

        // Validate inputs
        const amountValidation = window.utils.validateNumber(loanAmountInput.value, 0.01);
        const rateValidation = window.utils.validateNumber(interestRateInput.value, 0, 100);
        const termValidation = window.utils.validateNumber(loanTermInput.value, 0.1);

        if (!amountValidation.valid) {
            this.showError('Please enter a valid loan amount (minimum $0.01)');
            return;
        }

        if (!rateValidation.valid) {
            this.showError('Please enter a valid annual interest rate (0-100%)');
            return;
        }

        if (!termValidation.valid) {
            this.showError('Please enter a valid loan term (minimum 0.1 years)');
            return;
        }

        const principal = amountValidation.value;
        const annualRate = rateValidation.value;
        const termYears = termValidation.value;

        // Calculate loan details
        const loanDetails = this.calculateLoanDetails(principal, annualRate, termYears);

        if (!loanDetails) {
            this.showError('Error calculating loan details');
            return;
        }

        // Update basic results
        document.getElementById('monthlyPayment').textContent = window.appManager.formatCurrency(loanDetails.monthlyPayment);
        document.getElementById('totalInterest').textContent = window.appManager.formatCurrency(loanDetails.totalInterest);
        document.getElementById('totalLoanAmount').textContent = window.appManager.formatCurrency(loanDetails.totalAmount);

        // Show detailed breakdown
        this.showDetailedBreakdown(loanDetails, principal, annualRate, termYears);

        // Save preferences and calculation
        this.savePreferences();
        
        if (window.appManager) {
            window.appManager.saveCalculation('loan', {
                principal: principal,
                annualRate: annualRate,
                termYears: termYears
            }, loanDetails);
        }
    }

    calculateLoanDetails(principal, annualRate, termYears) {
        try {
            // Handle zero interest rate
            if (annualRate === 0) {
                const monthlyPayment = principal / (termYears * 12);
                return {
                    monthlyPayment: monthlyPayment,
                    totalInterest: 0,
                    totalAmount: principal,
                    schedule: this.generateAmortizationSchedule(principal, 0, termYears, monthlyPayment)
                };
            }

            // Convert annual rate to monthly rate
            const monthlyRate = annualRate / 100 / 12;
            const numberOfPayments = termYears * 12;

            // Calculate monthly payment using the formula:
            // M = P * [r(1+r)^n] / [(1+r)^n - 1]
            const monthlyPayment = principal * 
                (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / 
                (Math.pow(1 + monthlyRate, numberOfPayments) - 1);

            const totalAmount = monthlyPayment * numberOfPayments;
            const totalInterest = totalAmount - principal;

            // Generate amortization schedule
            const schedule = this.generateAmortizationSchedule(principal, annualRate, termYears, monthlyPayment);

            return {
                monthlyPayment: monthlyPayment,
                totalInterest: totalInterest,
                totalAmount: totalAmount,
                numberOfPayments: numberOfPayments,
                schedule: schedule
            };

        } catch (error) {
            console.error('Error calculating loan details:', error);
            return null;
        }
    }

    generateAmortizationSchedule(principal, annualRate, termYears, monthlyPayment) {
        const schedule = [];
        const monthlyRate = annualRate / 100 / 12;
        let remainingBalance = principal;
        let totalInterestPaid = 0;
        
        const numberOfPayments = Math.round(termYears * 12);

        for (let month = 1; month <= numberOfPayments; month++) {
            const interestPayment = remainingBalance * monthlyRate;
            const principalPayment = monthlyPayment - interestPayment;
            
            remainingBalance = Math.max(0, remainingBalance - principalPayment);
            totalInterestPaid += interestPayment;

            schedule.push({
                month: month,
                payment: monthlyPayment,
                principalPayment: principalPayment,
                interestPayment: interestPayment,
                remainingBalance: remainingBalance,
                totalInterestPaid: totalInterestPaid
            });

            // Break if balance is paid off
            if (remainingBalance <= 0.01) {
                break;
            }
        }

        return schedule;
    }

    showDetailedBreakdown(loanDetails, principal, annualRate, termYears) {
        const resultsDiv = document.getElementById('loanResults');
        
        // Add breakdown section if it doesn't exist
        let breakdownDiv = document.getElementById('loanBreakdown');
        if (!breakdownDiv) {
            breakdownDiv = document.createElement('div');
            breakdownDiv.id = 'loanBreakdown';
            breakdownDiv.className = 'loan-breakdown';
            resultsDiv.appendChild(breakdownDiv);
        }

        const interestToLoanRatio = (loanDetails.totalInterest / principal) * 100;
        const effectiveRate = annualRate > 0 ? annualRate : 0;

        breakdownDiv.innerHTML = `
            <div class="breakdown-section">
                <h4>Loan Breakdown:</h4>
                <div class="breakdown-grid">
                    <div class="breakdown-item">
                        <span>Loan Amount:</span>
                        <span>${window.appManager.formatCurrency(principal)}</span>
                    </div>
                    <div class="breakdown-item">
                        <span>Annual Interest Rate:</span>
                        <span>${effectiveRate.toFixed(2)}%</span>
                    </div>
                    <div class="breakdown-item">
                        <span>Loan Term:</span>
                        <span>${termYears} years (${Math.round(termYears * 12)} months)</span>
                    </div>
                    <div class="breakdown-item">
                        <span>Monthly Payment:</span>
                        <span>${window.appManager.formatCurrency(loanDetails.monthlyPayment)}</span>
                    </div>
                    <div class="breakdown-item">
                        <span>Total Interest:</span>
                        <span>${window.appManager.formatCurrency(loanDetails.totalInterest)}</span>
                    </div>
                    <div class="breakdown-item total">
                        <span>Total Amount:</span>
                        <span>${window.appManager.formatCurrency(loanDetails.totalAmount)}</span>
                    </div>
                </div>

                <div class="loan-analysis">
                    <h5>Loan Analysis:</h5>
                    <div class="analysis-grid">
                        <div class="analysis-item">
                            <span>Interest as % of Loan:</span>
                            <span>${interestToLoanRatio.toFixed(2)}%</span>
                        </div>
                        <div class="analysis-item">
                            <span>Monthly Interest Rate:</span>
                            <span>${(effectiveRate / 12).toFixed(4)}%</span>
                        </div>
                        <div class="analysis-item">
                            <span>Total Payments:</span>
                            <span>${Math.round(termYears * 12)} payments</span>
                        </div>
                        <div class="analysis-item">
                            <span>Payment to Loan Ratio:</span>
                            <span>${((loanDetails.monthlyPayment / principal) * 100).toFixed(4)}%</span>
                        </div>
                    </div>
                </div>

                <div class="payoff-scenarios">
                    <h5>Early Payoff Scenarios:</h5>
                    <div class="scenarios-grid">
                        ${this.generatePayoffScenarios(principal, annualRate, termYears, loanDetails.monthlyPayment)}
                    </div>
                </div>

                <div class="amortization-summary">
                    <h5>Payment Distribution Over Time:</h5>
                    <div class="payment-distribution">
                        ${this.generatePaymentDistribution(loanDetails.schedule)}
                    </div>
                </div>

                <div class="amortization-actions">
                    <button class="btn" onclick="loanCalculator.showAmortizationTable()">View Full Amortization Schedule</button>
                    <button class="btn" onclick="loanCalculator.exportCalculation()">Export Calculation</button>
                </div>
            </div>
        `;
    }

    generatePayoffScenarios(principal, annualRate, termYears, monthlyPayment) {
        const scenarios = [
            { extra: 50, label: 'Extra $50/month' },
            { extra: 100, label: 'Extra $100/month' },
            { extra: 200, label: 'Extra $200/month' },
            { extra: monthlyPayment * 0.1, label: 'Extra 10% payment' }
        ];

        return scenarios.map(scenario => {
            const newPayment = monthlyPayment + scenario.extra;
            const newDetails = this.calculatePayoffTime(principal, annualRate, newPayment);
            
            if (newDetails) {
                const timeSaved = (termYears * 12) - newDetails.months;
                const interestSaved = this.calculateLoanDetails(principal, annualRate, termYears).totalInterest - newDetails.totalInterest;
                
                return `
                    <div class="scenario-item">
                        <div class="scenario-label">${scenario.label}</div>
                        <div class="scenario-payment">Payment: ${window.appManager.formatCurrency(newPayment)}</div>
                        <div class="scenario-time">Time: ${Math.floor(newDetails.months / 12)} years, ${newDetails.months % 12} months</div>
                        <div class="scenario-savings">
                            <span>Time Saved: ${timeSaved} months</span><br>
                            <span>Interest Saved: ${window.appManager.formatCurrency(interestSaved)}</span>
                        </div>
                    </div>
                `;
            }
            return '';
        }).join('');
    }

    calculatePayoffTime(principal, annualRate, monthlyPayment) {
        if (annualRate === 0) {
            const months = Math.ceil(principal / monthlyPayment);
            return {
                months: months,
                totalInterest: 0,
                totalAmount: principal
            };
        }

        const monthlyRate = annualRate / 100 / 12;
        let balance = principal;
        let months = 0;
        let totalInterest = 0;
        const maxMonths = 600; // 50 years max

        while (balance > 0.01 && months < maxMonths) {
            const interestPayment = balance * monthlyRate;
            const principalPayment = monthlyPayment - interestPayment;
            
            if (principalPayment <= 0) {
                return null; // Payment too small to cover interest
            }
            
            balance -= principalPayment;
            totalInterest += interestPayment;
            months++;
        }

        return {
            months: months,
            totalInterest: totalInterest,
            totalAmount: principal + totalInterest
        };
    }

    generatePaymentDistribution(schedule) {
        if (!schedule || schedule.length === 0) return '';

        const firstPayment = schedule[0];
        const midPayment = schedule[Math.floor(schedule.length / 2)];
        const lastPayment = schedule[schedule.length - 1];

        return `
            <div class="distribution-comparison">
                <div class="payment-period">
                    <h6>First Payment (Month 1)</h6>
                    <div class="payment-breakdown">
                        <div>Principal: ${window.appManager.formatCurrency(firstPayment.principalPayment)}</div>
                        <div>Interest: ${window.appManager.formatCurrency(firstPayment.interestPayment)}</div>
                        <div>Remaining: ${window.appManager.formatCurrency(firstPayment.remainingBalance)}</div>
                    </div>
                </div>
                
                <div class="payment-period">
                    <h6>Mid-term Payment (Month ${midPayment.month})</h6>
                    <div class="payment-breakdown">
                        <div>Principal: ${window.appManager.formatCurrency(midPayment.principalPayment)}</div>
                        <div>Interest: ${window.appManager.formatCurrency(midPayment.interestPayment)}</div>
                        <div>Remaining: ${window.appManager.formatCurrency(midPayment.remainingBalance)}</div>
                    </div>
                </div>
                
                <div class="payment-period">
                    <h6>Final Payment (Month ${lastPayment.month})</h6>
                    <div class="payment-breakdown">
                        <div>Principal: ${window.appManager.formatCurrency(lastPayment.principalPayment)}</div>
                        <div>Interest: ${window.appManager.formatCurrency(lastPayment.interestPayment)}</div>
                        <div>Remaining: ${window.appManager.formatCurrency(lastPayment.remainingBalance)}</div>
                    </div>
                </div>
            </div>
        `;
    }

    showAmortizationTable() {
        const loanAmount = parseFloat(document.getElementById('loanAmount').value);
        const interestRate = parseFloat(document.getElementById('interestRate').value);
        const loanTerm = parseFloat(document.getElementById('loanTerm').value);

        if (!loanAmount || !loanTerm) {
            this.showError('Please calculate a loan first');
            return;
        }

        const loanDetails = this.calculateLoanDetails(loanAmount, interestRate || 0, loanTerm);
        
        if (!loanDetails || !loanDetails.schedule) {
            this.showError('Error generating amortization schedule');
            return;
        }

        // Create modal or new window for the table
        const tableHTML = this.generateAmortizationTableHTML(loanDetails.schedule);
        
        // Create a new window to display the table
        const newWindow = window.open('', '_blank', 'width=800,height=600,scrollbars=yes');
        newWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Amortization Schedule</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    table { border-collapse: collapse; width: 100%; margin-top: 20px; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: right; }
                    th { background-color: #f2f2f2; }
                    .currency { color: #007bff; }
                    .header { text-align: center; margin-bottom: 20px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h2>Loan Amortization Schedule</h2>
                    <p>Loan Amount: ${window.appManager.formatCurrency(loanAmount)} | 
                       Rate: ${interestRate.toFixed(2)}% | 
                       Term: ${loanTerm} years</p>
                </div>
                ${tableHTML}
            </body>
            </html>
        `);
        newWindow.document.close();
    }

    generateAmortizationTableHTML(schedule) {
        const rows = schedule.map(payment => `
            <tr>
                <td>${payment.month}</td>
                <td class="currency">${window.appManager.formatCurrency(payment.payment)}</td>
                <td class="currency">${window.appManager.formatCurrency(payment.principalPayment)}</td>
                <td class="currency">${window.appManager.formatCurrency(payment.interestPayment)}</td>
                <td class="currency">${window.appManager.formatCurrency(payment.remainingBalance)}</td>
                <td class="currency">${window.appManager.formatCurrency(payment.totalInterestPaid)}</td>
            </tr>
        `).join('');

        return `
            <table>
                <thead>
                    <tr>
                        <th>Payment #</th>
                        <th>Payment Amount</th>
                        <th>Principal</th>
                        <th>Interest</th>
                        <th>Remaining Balance</th>
                        <th>Total Interest Paid</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows}
                </tbody>
            </table>
        `;
    }

    showError(message) {
        const resultsDiv = document.getElementById('loanResults');
        resultsDiv.innerHTML = `<div class="error-message" style="color: var(--danger-color); text-align: center; padding: 1rem;">${message}</div>`;
    }

    // Different loan types calculations
    calculateSimpleInterest(principal, rate, time) {
        const interest = principal * (rate / 100) * time;
        return {
            interest: interest,
            totalAmount: principal + interest
        };
    }

    calculateCompoundInterest(principal, rate, compoundingFrequency, time) {
        const amount = principal * Math.pow((1 + (rate / 100) / compoundingFrequency), compoundingFrequency * time);
        return {
            interest: amount - principal,
            totalAmount: amount
        };
    }

    // Export calculation
    exportCalculation() {
        const loanAmount = parseFloat(document.getElementById('loanAmount').value);
        const interestRate = parseFloat(document.getElementById('interestRate').value);
        const loanTerm = parseFloat(document.getElementById('loanTerm').value);

        if (!loanAmount || !loanTerm) {
            this.showError('Please calculate a loan first');
            return;
        }

        const loanDetails = this.calculateLoanDetails(loanAmount, interestRate || 0, loanTerm);
        
        const exportData = {
            calculator: 'Loan Calculator',
            inputs: {
                loanAmount,
                interestRate: interestRate || 0,
                loanTerm
            },
            results: loanDetails,
            timestamp: new Date().toISOString()
        };

        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `loan-calculation-${new Date().getTime()}.json`;
        link.click();
        
        URL.revokeObjectURL(url);
    }

    // Clear all inputs
    clearAll() {
        document.getElementById('loanAmount').value = '';
        document.getElementById('interestRate').value = '';
        document.getElementById('loanTerm').value = '';
        
        const resultsDiv = document.getElementById('loanResults');
        resultsDiv.innerHTML = `
            <div class="result-item">
                <span>Monthly Payment:</span>
                <span id="monthlyPayment">$0.00</span>
            </div>
            <div class="result-item">
                <span>Total Interest:</span>
                <span id="totalInterest">$0.00</span>
            </div>
            <div class="result-item">
                <span>Total Amount:</span>
                <span id="totalLoanAmount">$0.00</span>
            </div>
        `;
    }
}

// Initialize loan calculator when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.loanCalculator = new LoanCalculator();
});
