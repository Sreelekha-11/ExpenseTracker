const form = document.getElementById("transaction-form");
const titleInput = document.getElementById("title");
const amountInput = document.getElementById("amount");
const typeInput = document.getElementById("type");
const categoryInput = document.getElementById("category");
const dateInput = document.getElementById("date");
const transactionList = document.getElementById("transaction-list");
const filterInput = document.getElementById("filter");
const expenseChart = document.getElementById("expense-chart");
const balanceElement = document.getElementById("balance");
const incomeElement = document.getElementById("income");
const expenseElement = document.getElementById("expense");

// Set today's date
const today = new Date().toISOString().split("T")[0];

dateInput.value = today;
dateInput.max = today;

document.getElementById("today").textContent =
    new Date().toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric"
    });

// Load saved transactions
let transactions = [];

try {
    const savedTransactions = JSON.parse(
        localStorage.getItem("transactions")
    );

    if (Array.isArray(savedTransactions)) {
        transactions = savedTransactions.filter(function(transaction) {
            return transaction &&
                typeof transaction.title === "string" &&
                Number.isFinite(transaction.amount) &&
                transaction.amount > 0 &&
                ["income", "expense"].includes(transaction.type) &&
                typeof transaction.category === "string" &&
                typeof transaction.date === "string";
        });
    }
} catch (error) {
    transactions = [];
}

// Format currency
function formatCurrency(amount) {
    return amount.toLocaleString("en-IN", {
        style: "currency",
        currency: "INR"
    });
}

// Save transactions
function saveTransactions() {
    localStorage.setItem(
        "transactions",
        JSON.stringify(transactions)
    );
}

// Update dashboard
function updateSummary() {

    let totalIncome = 0;
    let totalExpense = 0;

    transactions.forEach(function(transaction) {

        if (transaction.type === "income") {
            totalIncome += transaction.amount;
        } else {
            totalExpense += transaction.amount;
        }

    });

    const balance = totalIncome - totalExpense;

    balanceElement.textContent = formatCurrency(balance);
    incomeElement.textContent = formatCurrency(totalIncome);
    expenseElement.textContent = formatCurrency(totalExpense);
}

// Display transactions
function displayTransactions() {

    transactionList.innerHTML = "";

    const selectedFilter = filterInput.value;

    const filteredTransactions = transactions.filter(
        function(transaction) {

            if (selectedFilter === "all") {
                return true;
            }

            return transaction.type === selectedFilter;

        }
    );

    if (filteredTransactions.length === 0) {

        transactionList.innerHTML =
            '<p class="empty">No transactions found.</p>';

        return;
    }

    filteredTransactions.forEach(function(transaction) {

        const item = document.createElement("div");
        item.className = "transaction";

        const info = document.createElement("div");
        info.className = "transaction-info";

        const name = document.createElement("h3");
        name.textContent = transaction.title;

        const details = document.createElement("p");

        details.textContent =
            transaction.category + " • " + transaction.date;

        info.appendChild(name);
        info.appendChild(details);

        const right = document.createElement("div");
        right.className = "transaction-right";

        const amount = document.createElement("div");
        amount.className = "transaction-amount";

        if (transaction.type === "income") {

            amount.classList.add("positive");

            amount.textContent =
                "+ " + formatCurrency(transaction.amount);

        } else {

            amount.classList.add("negative");

            amount.textContent =
                "- " + formatCurrency(transaction.amount);

        }

        const deleteButton = document.createElement("button");

        deleteButton.className = "delete-btn";
        deleteButton.textContent = "Delete";

        deleteButton.addEventListener("click", function() {
            deleteTransaction(transaction.id);
        });

        right.appendChild(amount);
        right.appendChild(deleteButton);

        item.appendChild(info);
        item.appendChild(right);

        transactionList.appendChild(item);

    });
}

// Delete transaction
function deleteTransaction(id) {

    const confirmDelete = confirm(
        "Are you sure you want to delete this transaction?"
    );

    if (!confirmDelete) {
        return;
    }

    transactions = transactions.filter(function(transaction) {
        return transaction.id !== id;
    });

    saveTransactions();
    updateSummary();
    displayTransactions();
    updateExpenseChart();
}

// Expense category visualization
function updateExpenseChart() {

    expenseChart.innerHTML = "";

    const categoryTotals = {};

    let totalExpense = 0;

    // Calculate expenses category-wise
    transactions.forEach(function(transaction) {

        if (transaction.type === "expense") {

            if (!categoryTotals[transaction.category]) {
                categoryTotals[transaction.category] = 0;
            }

            categoryTotals[transaction.category] += transaction.amount;

            totalExpense += transaction.amount;
        }

    });

    if (totalExpense === 0) {

        expenseChart.innerHTML =
            '<p class="empty">No expense data available yet.</p>';

        return;
    }

    // Sort categories by expense amount
    const sortedCategories = Object.entries(categoryTotals)
        .sort(function(a, b) {
            return b[1] - a[1];
        });

    sortedCategories.forEach(function(category) {

        const categoryName = category[0];
        const categoryAmount = category[1];

        const percentage =
            (categoryAmount / totalExpense) * 100;

        const chartItem = document.createElement("div");
        chartItem.className = "chart-item";

        const chartInfo = document.createElement("div");
        chartInfo.className = "chart-info";

        const name = document.createElement("span");
        name.textContent = categoryName;

        const value = document.createElement("span");

        value.textContent =
            formatCurrency(categoryAmount) +
            " (" + percentage.toFixed(1) + "%)";

        chartInfo.appendChild(name);
        chartInfo.appendChild(value);

        const track = document.createElement("div");
        track.className = "chart-track";

        const fill = document.createElement("div");
        fill.className = "chart-fill";

        fill.style.width = percentage + "%";

        track.appendChild(fill);

        chartItem.appendChild(chartInfo);
        chartItem.appendChild(track);

        expenseChart.appendChild(chartItem);

    });
}

// Add new transaction
form.addEventListener("submit", function(event) {

    event.preventDefault();

    const title = titleInput.value.trim();
    const amount = Number(amountInput.value);
    const type = typeInput.value;
    const category = categoryInput.value;
    const date = dateInput.value;

    if (!title || !Number.isFinite(amount) || amount <= 0) {

        alert("Please enter a valid title and amount.");
        return;

    }

    if (!date || date > today) {

        alert("Please select a valid date.");
        return;

    }

    const transaction = {

        id: Date.now(),

        title: title,

        amount: amount,

        type: type,

        category: category,

        date: date

    };

    transactions.unshift(transaction);

    saveTransactions();

    updateSummary();

    displayTransactions();

    updateExpenseChart();

    form.reset();

    dateInput.value = today;

});

// Filter transactions
filterInput.addEventListener("change", function() {

    displayTransactions();

});

// Initial display
updateSummary();

displayTransactions();

updateExpenseChart();
