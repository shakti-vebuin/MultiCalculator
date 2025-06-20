// Indian GST Calculator Implementation

class GSTCalculator {
    constructor() {
        this.currentMode = 'add';
        this.gstRates = {
            0: { name: '0% (Exempt)', cgst: 0, sgst: 0, igst: 0 },
            5: { name: '5% (Essential items)', cgst: 2.5, sgst: 2.5, igst: 5 },
            12: { name: '12% (Standard items)', cgst: 6, sgst: 6, igst: 12 },
            18: { name: '18% (Most goods & services)', cgst: 9, sgst: 9, igst: 18 },
            28: { name: '28% (Luxury items)', cgst: 14, sgst: 14, igst: 28 }
        };
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupGSTTabs();
        this.loadPreferences();
    }

    setupEventListeners() {
        // GST tab switching
        document.querySelectorAll('.gst-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const type = e.target.dataset.type;
                this.switchGSTMode(type);
            });
        });

        // Auto-calculate on input changes
        const addGSTInputs = ['baseAmount', 'gstRate'];
        addGSTInputs.forEach(inputId => {
            const input = document.getElementById(inputId);
            if (input) {
                input.addEventListener('input', 
                    window.utils.debounce(() => this.autoCalculateAdd(), 300)
                );
                input.addEventListener('change', () => this.autoCalculateAdd());
            }
        });

        const removeGSTInputs = ['totalAmountWithGST', 'gstRateRemove'];
        removeGSTInputs.forEach(inputId => {
            const input = document.getElementById(inputId);
            if (input) {
                input.addEventListener('input', 
                    window.utils.debounce(() => this.autoCalculateRemove(), 300)
                );
                input.addEventListener('change', () => this.autoCalculateRemove());
            }
        });
    }

    setupGSTTabs() {
        document.querySelectorAll('.gst-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        
        const activeTab = document.querySelector(`[data-type="${this.currentMode}"]`);
        if (activeTab) {
            activeTab.classList.add('active');
        }

        // Show/hide sections
        document.querySelectorAll('.gst-section').forEach(section => {
            section.classList.remove('active');
        });
        
        const activeSection = document.getElementById(
            this.currentMode === 'add' ? 'addGST' : 'removeGST'
        );
        if (activeSection) {
            activeSection.classList.add('active');
        }
    }

    switchGSTMode(mode) {
        this.currentMode = mode;
        this.setupGSTTabs();
        this.clearResults();
    }

    loadPreferences() {
        try {
            const saved = localStorage.getItem('gst_calculator_preferences');
            if (saved) {
                const preferences = JSON.parse(saved);
                
                if (preferences.defaultGSTRate) {
                    const gstRateSelect = document.getElementById('gstRate');
                    const gstRateRemoveSelect = document.getElementById('gstRateRemove');
                    
                    if (gstRateSelect) gstRateSelect.value = preferences.defaultGSTRate;
                    if (gstRateRemoveSelect) gstRateRemoveSelect.value = preferences.defaultGSTRate;
                }
            }
        } catch (error) {
            console.warn('Could not load GST calculator preferences:', error);
        }
    }

    savePreferences() {
        try {
            const preferences = {
                defaultGSTRate: document.getElementById('gstRate')?.value || '18',
                currentMode: this.currentMode,
                timestamp: Date.now()
            };
            
            localStorage.setItem('gst_calculator_preferences', JSON.stringify(preferences));
        } catch (error) {
            console.warn('Could not save GST calculator preferences:', error);
        }
    }

    autoCalculateAdd() {
        const baseAmount = document.getElementById('baseAmount').value;
        const gstRate = document.getElementById('gstRate').value;
        
        if (baseAmount && gstRate) {
            this.addGST();
        }
    }

    autoCalculateRemove() {
        const totalAmount = document.getElementById('totalAmountWithGST').value;
        const gstRate = document.getElementById('gstRateRemove').value;
        
        if (totalAmount && gstRate) {
            this.removeGST();
        }
    }

    addGST() {
        const baseAmountInput = document.getElementById('baseAmount');
        const gstRateSelect = document.getElementById('gstRate');
        const resultsDiv = document.getElementById('addGSTResults');

        const amountValidation = window.utils.validateNumber(baseAmountInput.value, 0);
        if (!amountValidation.valid) {
            window.appManager.showError(amountValidation.message, resultsDiv);
            return;
        }

        const baseAmount = amountValidation.value;
        const gstRate = parseFloat(gstRateSelect.value);
        const gstInfo = this.gstRates[gstRate];

        if (!gstInfo) {
            window.appManager.showError('Invalid GST rate selected', resultsDiv);
            return;
        }

        // Calculate GST components
        const calculations = this.calculateGSTAddition(baseAmount, gstRate);

        // Update display
        document.getElementById('cgstAmount').textContent = `₹${window.appManager.formatNumber(calculations.cgst)}`;
        document.getElementById('sgstAmount').textContent = `₹${window.appManager.formatNumber(calculations.sgst)}`;
        document.getElementById('totalGSTAmount').textContent = `₹${window.appManager.formatNumber(calculations.totalGST)}`;
        document.getElementById('totalWithGST').textContent = `₹${window.appManager.formatNumber(calculations.totalWithGST)}`;

        // Show detailed breakdown
        this.showAddGSTBreakdown(baseAmount, gstRate, calculations, gstInfo);

        // Save preferences and calculation
        this.savePreferences();
        
        if (window.appManager) {
            window.appManager.saveCalculation('gst', {
                type: 'add',
                baseAmount: baseAmount,
                gstRate: gstRate
            }, calculations);
        }
    }

    removeGST() {
        const totalAmountInput = document.getElementById('totalAmountWithGST');
        const gstRateSelect = document.getElementById('gstRateRemove');
        const resultsDiv = document.getElementById('removeGSTResults');

        const amountValidation = window.utils.validateNumber(totalAmountInput.value, 0);
        if (!amountValidation.valid) {
            window.appManager.showError(amountValidation.message, resultsDiv);
            return;
        }

        const totalAmountWithGST = amountValidation.value;
        const gstRate = parseFloat(gstRateSelect.value);
        const gstInfo = this.gstRates[gstRate];

        if (!gstInfo) {
            window.appManager.showError('Invalid GST rate selected', resultsDiv);
            return;
        }

        // Calculate base amount and GST
        const calculations = this.calculateGSTRemoval(totalAmountWithGST, gstRate);

        // Update display
        document.getElementById('baseAmountResult').textContent = `₹${window.appManager.formatNumber(calculations.baseAmount)}`;
        document.getElementById('gstAmountResult').textContent = `₹${window.appManager.formatNumber(calculations.gstAmount)}`;

        // Show detailed breakdown
        this.showRemoveGSTBreakdown(totalAmountWithGST, gstRate, calculations, gstInfo);

        // Save preferences and calculation
        this.savePreferences();
        
        if (window.appManager) {
            window.appManager.saveCalculation('gst', {
                type: 'remove',
                totalAmountWithGST: totalAmountWithGST,
                gstRate: gstRate
            }, calculations);
        }
    }

    calculateGSTAddition(baseAmount, gstRate) {
        const gstInfo = this.gstRates[gstRate];
        
        const cgst = (baseAmount * gstInfo.cgst) / 100;
        const sgst = (baseAmount * gstInfo.sgst) / 100;
        const igst = (baseAmount * gstInfo.igst) / 100;
        const totalGST = cgst + sgst; // For intra-state (CGST + SGST)
        const totalWithGST = baseAmount + totalGST;

        return {
            baseAmount: baseAmount,
            cgst: cgst,
            sgst: sgst,
            igst: igst,
            totalGST: totalGST,
            totalWithGST: totalWithGST,
            gstRate: gstRate
        };
    }

    calculateGSTRemoval(totalAmountWithGST, gstRate) {
        // Formula: Base Amount = Total Amount / (1 + GST Rate/100)
        const baseAmount = totalAmountWithGST / (1 + (gstRate / 100));
        const gstAmount = totalAmountWithGST - baseAmount;
        
        const gstInfo = this.gstRates[gstRate];
        const cgst = (baseAmount * gstInfo.cgst) / 100;
        const sgst = (baseAmount * gstInfo.sgst) / 100;
        const igst = (baseAmount * gstInfo.igst) / 100;

        return {
            baseAmount: baseAmount,
            gstAmount: gstAmount,
            cgst: cgst,
            sgst: sgst,
            igst: igst,
            totalAmountWithGST: totalAmountWithGST,
            gstRate: gstRate
        };
    }

    showAddGSTBreakdown(baseAmount, gstRate, calculations, gstInfo) {
        const resultsDiv = document.getElementById('addGSTResults');
        
        // Add breakdown section if it doesn't exist
        let breakdownDiv = document.getElementById('addGSTBreakdown');
        if (!breakdownDiv) {
            breakdownDiv = document.createElement('div');
            breakdownDiv.id = 'addGSTBreakdown';
            breakdownDiv.className = 'gst-breakdown';
            resultsDiv.appendChild(breakdownDiv);
        }

        breakdownDiv.innerHTML = `
            <div class="breakdown-section">
                <h4>GST Calculation Breakdown:</h4>
                
                <div class="gst-info">
                    <h5>GST Rate Information:</h5>
                    <p><strong>${gstRate}%</strong> - ${gstInfo.name}</p>
                </div>

                <div class="calculation-details">
                    <h5>Calculation Details:</h5>
                    <div class="calculation-grid">
                        <div class="calc-item">
                            <span>Base Amount:</span>
                            <span>₹${window.appManager.formatNumber(baseAmount)}</span>
                        </div>
                        <div class="calc-item">
                            <span>CGST (${gstInfo.cgst}%):</span>
                            <span>₹${window.appManager.formatNumber(calculations.cgst)}</span>
                        </div>
                        <div class="calc-item">
                            <span>SGST (${gstInfo.sgst}%):</span>
                            <span>₹${window.appManager.formatNumber(calculations.sgst)}</span>
                        </div>
                        <div class="calc-item total">
                            <span>Total GST:</span>
                            <span>₹${window.appManager.formatNumber(calculations.totalGST)}</span>
                        </div>
                        <div class="calc-item final">
                            <span>Final Amount:</span>
                            <span>₹${window.appManager.formatNumber(calculations.totalWithGST)}</span>
                        </div>
                    </div>
                </div>

                <div class="inter-state-info">
                    <h5>Inter-state Transaction (IGST):</h5>
                    <div class="igst-details">
                        <p>For inter-state sales, instead of CGST + SGST:</p>
                        <div class="calc-item">
                            <span>IGST (${gstInfo.igst}%):</span>
                            <span>₹${window.appManager.formatNumber(calculations.igst)}</span>
                        </div>
                        <div class="calc-item">
                            <span>Total with IGST:</span>
                            <span>₹${window.appManager.formatNumber(baseAmount + calculations.igst)}</span>
                        </div>
                    </div>
                </div>

                <div class="gst-formulas">
                    <h5>Formulas Used:</h5>
                    <div class="formula-list">
                        <p><strong>CGST:</strong> Base Amount × ${gstInfo.cgst}% = ₹${window.appManager.formatNumber(calculations.cgst)}</p>
                        <p><strong>SGST:</strong> Base Amount × ${gstInfo.sgst}% = ₹${window.appManager.formatNumber(calculations.sgst)}</p>
                        <p><strong>Total:</strong> Base Amount + CGST + SGST = ₹${window.appManager.formatNumber(calculations.totalWithGST)}</p>
                    </div>
                </div>

                <div class="tax-compliance">
                    <h5>Tax Compliance Notes:</h5>
                    <ul class="compliance-list">
                        <li>CGST + SGST applies for intra-state transactions</li>
                        <li>IGST applies for inter-state transactions</li>
                        <li>GST registration required for turnover > ₹20 lakhs (₹10 lakhs for special states)</li>
                        <li>Input tax credit available for registered businesses</li>
                        ${gstRate === 0 ? '<li><strong>This item is exempt from GST</strong></li>' : ''}
                    </ul>
                </div>
            </div>
        `;
    }

    showRemoveGSTBreakdown(totalAmount, gstRate, calculations, gstInfo) {
        const resultsDiv = document.getElementById('removeGSTResults');
        
        // Add breakdown section if it doesn't exist
        let breakdownDiv = document.getElementById('removeGSTBreakdown');
        if (!breakdownDiv) {
            breakdownDiv = document.createElement('div');
            breakdownDiv.id = 'removeGSTBreakdown';
            breakdownDiv.className = 'gst-breakdown';
            resultsDiv.appendChild(breakdownDiv);
        }

        const effectiveRate = gstRate / (100 + gstRate) * 100;

        breakdownDiv.innerHTML = `
            <div class="breakdown-section">
                <h4>GST Removal Breakdown:</h4>
                
                <div class="gst-info">
                    <h5>GST Rate Information:</h5>
                    <p><strong>${gstRate}%</strong> - ${gstInfo.name}</p>
                </div>

                <div class="calculation-details">
                    <h5>Reverse Calculation:</h5>
                    <div class="calculation-grid">
                        <div class="calc-item">
                            <span>Total Amount (with GST):</span>
                            <span>₹${window.appManager.formatNumber(totalAmount)}</span>
                        </div>
                        <div class="calc-item">
                            <span>Base Amount:</span>
                            <span>₹${window.appManager.formatNumber(calculations.baseAmount)}</span>
                        </div>
                        <div class="calc-item">
                            <span>GST Amount:</span>
                            <span>₹${window.appManager.formatNumber(calculations.gstAmount)}</span>
                        </div>
                        <div class="calc-item">
                            <span>CGST (${gstInfo.cgst}%):</span>
                            <span>₹${window.appManager.formatNumber(calculations.cgst)}</span>
                        </div>
                        <div class="calc-item">
                            <span>SGST (${gstInfo.sgst}%):</span>
                            <span>₹${window.appManager.formatNumber(calculations.sgst)}</span>
                        </div>
                    </div>
                </div>

                <div class="verification">
                    <h5>Verification:</h5>
                    <div class="verification-grid">
                        <div class="verify-item">
                            <span>Base + GST:</span>
                            <span>₹${window.appManager.formatNumber(calculations.baseAmount + calculations.gstAmount)}</span>
                        </div>
                        <div class="verify-item">
                            <span>Original Total:</span>
                            <span>₹${window.appManager.formatNumber(totalAmount)}</span>
                        </div>
                        <div class="verify-item ${Math.abs((calculations.baseAmount + calculations.gstAmount) - totalAmount) < 0.01 ? 'verified' : 'error'}">
                            <span>Status:</span>
                            <span>${Math.abs((calculations.baseAmount + calculations.gstAmount) - totalAmount) < 0.01 ? '✓ Verified' : '✗ Error'}</span>
                        </div>
                    </div>
                </div>

                <div class="gst-formulas">
                    <h5>Formulas Used:</h5>
                    <div class="formula-list">
                        <p><strong>Base Amount:</strong> Total Amount ÷ (1 + GST Rate/100)</p>
                        <p><strong>Calculation:</strong> ₹${window.appManager.formatNumber(totalAmount)} ÷ (1 + ${gstRate}/100) = ₹${window.appManager.formatNumber(calculations.baseAmount)}</p>
                        <p><strong>GST Amount:</strong> Total Amount - Base Amount = ₹${window.appManager.formatNumber(calculations.gstAmount)}</p>
                        <p><strong>Effective Rate:</strong> ${effectiveRate.toFixed(4)}% of total amount</p>
                    </div>
                </div>

                <div class="inter-state-info">
                    <h5>Inter-state Transaction (IGST):</h5>
                    <div class="igst-details">
                        <div class="calc-item">
                            <span>IGST (${gstInfo.igst}%):</span>
                            <span>₹${window.appManager.formatNumber(calculations.igst)}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    clearResults() {
        const resultDivs = ['addGSTResults', 'removeGSTResults'];
        resultDivs.forEach(id => {
            const div = document.getElementById(id);
            if (div) {
                // Reset to original structure
                if (id === 'addGSTResults') {
                    div.innerHTML = `
                        <div class="result-item">
                            <span>CGST (₹):</span>
                            <span id="cgstAmount">₹0.00</span>
                        </div>
                        <div class="result-item">
                            <span>SGST (₹):</span>
                            <span id="sgstAmount">₹0.00</span>
                        </div>
                        <div class="result-item">
                            <span>Total GST (₹):</span>
                            <span id="totalGSTAmount">₹0.00</span>
                        </div>
                        <div class="result-item">
                            <span>Total Amount (₹):</span>
                            <span id="totalWithGST">₹0.00</span>
                        </div>
                    `;
                } else {
                    div.innerHTML = `
                        <div class="result-item">
                            <span>Base Amount (₹):</span>
                            <span id="baseAmountResult">₹0.00</span>
                        </div>
                        <div class="result-item">
                            <span>GST Amount (₹):</span>
                            <span id="gstAmountResult">₹0.00</span>
                        </div>
                    `;
                }
            }
        });
    }

    // Bulk GST calculation for multiple items
    calculateBulkGST(items) {
        return items.map(item => {
            if (this.currentMode === 'add') {
                return this.calculateGSTAddition(item.amount, item.gstRate);
            } else {
                return this.calculateGSTRemoval(item.amount, item.gstRate);
            }
        });
    }

    // HSN code lookup (simplified)
    getGSTRateByHSN(hsnCode) {
        // Simplified HSN to GST rate mapping
        const hsnRates = {
            '1001': 0,  // Wheat
            '1006': 0,  // Rice
            '2402': 28, // Cigarettes
            '8703': 28, // Motor cars
            '6403': 5,  // Footwear
            '8517': 18, // Mobile phones
            // Add more HSN codes as needed
        };
        
        return hsnRates[hsnCode] || 18; // Default to 18% if not found
    }

    // Generate GST invoice format
    generateGSTInvoice(items, customerDetails, supplierDetails) {
        const calculations = this.calculateBulkGST(items);
        const totalBaseAmount = calculations.reduce((sum, calc) => sum + calc.baseAmount, 0);
        const totalGSTAmount = calculations.reduce((sum, calc) => sum + calc.totalGST, 0);
        const grandTotal = totalBaseAmount + totalGSTAmount;

        return {
            invoice: {
                number: `INV-${Date.now()}`,
                date: new Date().toLocaleDateString(),
                supplier: supplierDetails,
                customer: customerDetails,
                items: items.map((item, index) => ({
                    ...item,
                    ...calculations[index]
                })),
                totals: {
                    baseAmount: totalBaseAmount,
                    gstAmount: totalGSTAmount,
                    grandTotal: grandTotal
                }
            }
        };
    }

    // Export GST calculation
    exportCalculation() {
        const history = window.appManager.getCalculationHistory('gst');
        
        if (history.length === 0) {
            window.appManager.showError('No GST calculations to export', 'addGSTResults');
            return;
        }

        const exportData = {
            calculator: 'Indian GST Calculator',
            calculations: history,
            gstRates: this.gstRates,
            exportDate: new Date().toISOString(),
            complianceInfo: {
                applicableFrom: 'July 1, 2017',
                lastUpdated: 'Current rates as per GST Council decisions',
                note: 'Please verify current rates with official sources'
            }
        };

        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `gst-calculations-${new Date().getTime()}.json`;
        link.click();
        
        URL.revokeObjectURL(url);
    }

    // Clear all inputs
    clearAll() {
        document.getElementById('baseAmount').value = '';
        document.getElementById('totalAmountWithGST').value = '';
        document.getElementById('gstRate').value = '18';
        document.getElementById('gstRateRemove').value = '18';
        this.clearResults();
    }
}

// Initialize GST calculator when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.gstCalculator = new GSTCalculator();
});
