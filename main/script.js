document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const currencySelect = document.getElementById('currencySelect');
    const participantNameInput = document.getElementById('participantNameInput');
    const addParticipantBtn = document.getElementById('addParticipantBtn');
    const participantList = document.getElementById('participantList');
    const noParticipantsPlaceholder = document.getElementById('noParticipantsPlaceholder');

    const expenseInputPlaceholder = document.getElementById('expenseInputPlaceholder');
    const newExpenseForm = document.getElementById('newExpenseForm');
    const expensePaidBySelect = document.getElementById('expensePaidBy');
    const expenseAmountInput = document.getElementById('expenseAmount');
    const expenseDescriptionInput = document.getElementById('expenseDescription');
    const addExpenseBtn = document.getElementById('addExpenseBtn');
    const expenseList = document.getElementById('expenseList');
    const noExpensesPlaceholder = document.getElementById('noExpensesPlaceholder');

    const calculateSplitBtn = document.getElementById('calculateSplitBtn'); // Ensure this is correctly referenced
    const settlementSummaryDiv = document.getElementById('settlementSummary');
    const totalExpensesDisplay = document.getElementById('totalExpensesDisplay');
    const settlementList = document.getElementById('settlementList');
    const noSettlementNeeded = document.getElementById('noSettlementNeeded');
    const clearAllDataBtn = document.getElementById('clearAllDataBtn');

    // --- Data Storage ---
    let participants = []; // Stores just names: ['John', 'Sarah']
    let expenses = [];    // Stores objects: { id: uniqueId, paidBy: 'John', amount: 25.50, description: 'Dinner' }
    let currentCurrencySymbol = '$';
    let nextExpenseId = 1; // For unique IDs for expenses

    // --- Initial Load from Local Storage ---
    loadFromLocalStorage();
    renderAll(); // Initial render to populate UI based on loaded data

    // --- Event Listeners ---
    currencySelect.addEventListener('change', (e) => {
        currentCurrencySymbol = e.target.value;
        renderAll(); // Re-render to update currency symbols
    });

    addParticipantBtn.addEventListener('click', addParticipant);
    participantNameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addParticipant();
    });

    addExpenseBtn.addEventListener('click', addExpense);
    expenseAmountInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addExpense();
    });
    expenseDescriptionInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addExpense();
    });

    // THIS IS THE CRITICAL LINE TO ENSURE THE LISTENER IS ATTACHED
    calculateSplitBtn.addEventListener('click', calculateSplits);
    //
    
    clearAllDataBtn.addEventListener('click', clearAllData);

    // --- Participant Management ---
    function addParticipant() {
        const name = participantNameInput.value.trim();
        if (name && !participants.includes(name)) {
            participants.push(name);
            participantNameInput.value = ''; // Clear input
            saveToLocalStorage();
            renderAll(); // Re-render participants and expense form
            hideSettlementSummary();
        } else if (name) {
            alert('Participant with this name already exists!');
        }
    }

    function removeParticipant(nameToRemove) {
        // Remove participant
        participants = participants.filter(name => name !== nameToRemove);
        // Remove expenses paid by or involving this participant
        expenses = expenses.filter(expense => expense.paidBy !== nameToRemove);

        saveToLocalStorage();
        renderAll();
        hideSettlementSummary();
    }

    function renderParticipants() {
        participantList.innerHTML = ''; // Clear existing list
        if (participants.length === 0) {
            noParticipantsPlaceholder.classList.remove('hidden');
        } else {
            noParticipantsPlaceholder.classList.add('hidden');
            participants.forEach(name => {
                const li = document.createElement('li');
                li.innerHTML = `
                    <span>${name}</span>
                    <button class="remove-btn" data-name="${name}">&times;</button>
                `;
                participantList.appendChild(li);
            });
        }
        attachRemoveParticipantListeners();
    }

    function attachRemoveParticipantListeners() {
        document.querySelectorAll('#participantList .remove-btn').forEach(button => {
            button.onclick = (e) => removeParticipant(e.target.dataset.name);
        });
    }

    // --- Expense Management ---
    function renderExpenseFormAndList() {
        if (participants.length === 0) {
            expenseInputPlaceholder.classList.remove('hidden');
            newExpenseForm.classList.add('hidden');
            expenseList.classList.add('hidden'); // Also hide the expense list when no participants
            noExpensesPlaceholder.classList.add('hidden'); // And its placeholder
            calculateSplitBtn.classList.add('hidden'); // Hide calculate button if no participants
        } else {
            expenseInputPlaceholder.classList.add('hidden');
            newExpenseForm.classList.remove('hidden');
            expenseList.classList.remove('hidden');
            calculateSplitBtn.classList.remove('hidden'); // Show calculate button
            renderPaidBySelect();
        }

        renderExpensesList();
    }

    function renderPaidBySelect() {
        expensePaidBySelect.innerHTML = ''; // Clear existing options
        if (participants.length === 0) {
            const option = document.createElement('option');
            option.value = '';
            option.textContent = 'No participants to select';
            option.disabled = true;
            option.selected = true;
            expensePaidBySelect.appendChild(option);
            addExpenseBtn.disabled = true;
        } else {
            addExpenseBtn.disabled = false;
            participants.forEach(name => {
                const option = document.createElement('option');
                option.value = name;
                option.textContent = name;
                expensePaidBySelect.appendChild(option);
            });
            // Select the first participant by default
            expensePaidBySelect.value = participants[0];
        }
    }

    function addExpense() {
        const paidBy = expensePaidBySelect.value;
        const amount = parseFloat(expenseAmountInput.value);
        const description = expenseDescriptionInput.value.trim();

        if (!paidBy) {
            alert('Please select who paid for the expense.');
            return;
        }
        if (isNaN(amount) || amount <= 0) {
            alert('Please enter a valid amount greater than zero.');
            return;
        }

        expenses.push({
            id: nextExpenseId++,
            paidBy: paidBy,
            amount: amount,
            description: description || 'Unnamed Expense' // Default description
        });

        expenseAmountInput.value = '';
        expenseDescriptionInput.value = '';
        saveToLocalStorage();
        renderExpensesList();
        hideSettlementSummary();
    }

    function removeExpense(idToRemove) {
        expenses = expenses.filter(expense => expense.id !== idToRemove);
        saveToLocalStorage();
        renderExpensesList();
        hideSettlementSummary();
    }

    function renderExpensesList() {
        expenseList.innerHTML = ''; // Clear existing list
        if (expenses.length === 0) {
            noExpensesPlaceholder.classList.remove('hidden');
        } else {
            noExpensesPlaceholder.classList.add('hidden');
            expenses.forEach(expense => {
                const li = document.createElement('li');
                li.innerHTML = `
                    <div class="expense-details">
                        <span class="amount">${currentCurrencySymbol}${expense.amount.toFixed(2)}</span>
                        <span class="description">${expense.description}</span>
                        <span class="paid-by">(paid by ${expense.paidBy})</span>
                    </div>
                    <button class="remove-btn" data-id="${expense.id}">&times;</button>
                `;
                expenseList.appendChild(li);
            });
        }
        attachRemoveExpenseListeners();
    }

    function attachRemoveExpenseListeners() {
        document.querySelectorAll('#expenseList .remove-btn').forEach(button => {
            button.onclick = (e) => removeExpense(parseInt(e.target.dataset.id));
        });
    }

    // --- Calculation Logic (Revised for Itemized Expenses) ---
    function calculateSplits() {
        if (participants.length < 2) {
            alert('Please add at least two participants to split expenses.');
            return;
        }
        if (expenses.length === 0) { // <--- ADDED THIS SPECIFIC CHECK
            alert('No expenses entered. Please add some expenses first.');
            return;
        }

        let totalPaid = 0;
        const paidByMap = {}; // Maps participant name to total amount they paid
        participants.forEach(p => paidByMap[p] = 0); // Initialize all to 0

        expenses.forEach(expense => {
            totalPaid += expense.amount;
            // Ensure expense.paidBy exists in our current participants list
            if (paidByMap.hasOwnProperty(expense.paidBy)) {
                 paidByMap[expense.paidBy] += expense.amount;
            } else {
                // Handle cases where a participant was removed but their expense lingered (shouldn't happen with current removeParticipant logic, but good for robustness)
                // Optionally, add a warning or re-add the participant temporarily for calculation
                console.warn(`Expense paid by ${expense.paidBy} but they are no longer a participant. Skipping their paid amount for calculation.`);
            }
        });

        if (totalPaid === 0) { // <--- This check is still valid if expenses exist but all amounts are 0
            alert('Total expenses sum to zero. No payments needed.');
            hideSettlementSummary();
            return;
        }

        const averageShare = totalPaid / participants.length;

        // Determine who is owed and who owes
        const balances = {}; // { name: balance }
        participants.forEach(name => {
            balances[name] = paidByMap[name] - averageShare;
        });

        let creditors = [];
        let debtors = [];

        for (const name in balances) {
            const balance = balances[name];
            if (balance > 0.01) { // Positive balance (owed), use small epsilon
                creditors.push({ name: name, amount: balance });
            } else if (balance < -0.01) { // Negative balance (owes), use small epsilon
                debtors.push({ name: name, amount: -balance }); // Store as positive amount owed
            }
        }

        creditors.sort((a, b) => b.amount - a.amount);
        debtors.sort((a, b) => b.amount - a.amount);

        const settlements = [];

        while (debtors.length > 0 && creditors.length > 0) {
            const debtor = debtors[0];
            const creditor = creditors[0];

            const amountToTransfer = Math.min(debtor.amount, creditor.amount);

            if (amountToTransfer > 0.01) { // Only record if significant amount
                settlements.push({
                    from: debtor.name,
                    to: creditor.name,
                    amount: amountToTransfer
                });
            }

            debtor.amount -= amountToTransfer;
            creditor.amount -= amountToTransfer;

            if (debtor.amount <= 0.01) {
                debtors.shift();
            }
            if (creditor.amount <= 0.01) {
                creditors.shift();
            }
        }

        displaySettlements(totalPaid, settlements);
    }

    function displaySettlements(totalPaid, settlements) {
        settlementList.innerHTML = '';
        totalExpensesDisplay.textContent = `Total Expenses: ${currentCurrencySymbol}${totalPaid.toFixed(2)}`;
        settlementSummaryDiv.classList.remove('hidden');

        if (settlements.length === 0) {
            noSettlementNeeded.classList.remove('hidden');
            totalExpensesDisplay.classList.add('hidden');
        } else {
            noSettlementNeeded.classList.add('hidden');
            totalExpensesDisplay.classList.remove('hidden');
            settlements.forEach(s => {
                const li = document.createElement('li');
                li.textContent = `${s.from} owes ${s.to} ${currentCurrencySymbol}${s.amount.toFixed(2)}`;
                settlementList.appendChild(li);
            });
        }
    }

    function hideSettlementSummary() {
        settlementSummaryDiv.classList.add('hidden');
    }

    // --- Local Storage Management ---
    function saveToLocalStorage() {
        const dataToSave = {
            participants: participants,
            expenses: expenses,
            currency: currentCurrencySymbol,
            nextExpenseId: nextExpenseId
        };
        localStorage.setItem('tripSplitterData', JSON.stringify(dataToSave));
    }

    function loadFromLocalStorage() {
        const savedData = localStorage.getItem('tripSplitterData');
        if (savedData) {
            const data = JSON.parse(savedData);
            participants = data.participants || [];
            expenses = data.expenses || [];
            currentCurrencySymbol = data.currency || '$';
            nextExpenseId = data.nextExpenseId || 1;

            // Ensure the currency dropdown reflects the loaded currency
            const currencyOptionExists = Array.from(currencySelect.options).some(option => option.value === currentCurrencySymbol);
            if (currencyOptionExists) {
                currencySelect.value = currentCurrencySymbol;
            } else {
                // Fallback to default if saved currency is not in options
                currentCurrencySymbol = '$';
                currencySelect.value = '$';
            }
        }
    }

    // --- Clear All Data ---
    function clearAllData() {
        if (confirm('Are you sure you want to start a new trip? All current data will be cleared.')) {
            localStorage.removeItem('tripSplitterData');
            participants = [];
            expenses = [];
            currentCurrencySymbol = '$'; // Reset to default
            nextExpenseId = 1;
            currencySelect.value = '$'; // Reset currency dropdown

            renderAll();
            hideSettlementSummary();
        }
    }

    // --- Render All Elements ---
    function renderAll() {
        renderParticipants();
        renderExpenseFormAndList(); // Handles both form and list
        // Settlement summary is hidden by default and shown after calculation
    }
});