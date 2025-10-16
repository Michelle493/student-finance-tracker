function main() {
  const addTransactionBtn = document.getElementById("add-transaction-btn");
  const addTransactionModal = document.getElementById("add-transaction-modal");
  const initialSetupModal = document.getElementById("initial-setup-modal");
  const transactionForm = document.getElementById("transaction-form");
  const initialSetupForm = document.getElementById("initial-setup-form");
  const cancelTransactionBtn = document.getElementById("cancel-transaction");

  let transactions = JSON.parse(localStorage.getItem("transactions")) || [];
  let goals = JSON.parse(localStorage.getItem("goals")) || {};
  let spendingChart;

  function showModal(modal) {
    modal.showModal();
  }

  function closeModal(modal) {
    modal.close();
  }

  function updateUI() {
    updateSummary();
    renderTransactions();
    renderChart();
  }

  function updateSummary() {
    const monthlyIncome = transactions
      .filter((t) => t.type === "income")
      .reduce((acc, t) => acc + t.amount, 0);

    const monthlyExpenses = transactions
      .filter((t) => t.type === "expense")
      .reduce((acc, t) => acc + t.amount, 0);

    const totalBalance = monthlyIncome - monthlyExpenses;

    document.getElementById(
      "total-balance"
    ).textContent = `₦${totalBalance.toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })}`;
    document.getElementById(
      "monthly-income"
    ).textContent = `₦${monthlyIncome.toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })}`;
    document.getElementById(
      "monthly-expenses"
    ).textContent = `₦${monthlyExpenses.toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })}`;
    document.getElementById("savings-goal").textContent = `₦${(
      goals.savings || 0
    ).toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })}`;

    if (goals.savings > 0) {
      const savingsPercentage = Math.max(
        0,
        (totalBalance / goals.savings) * 100
      );
      document.getElementById(
        "savings-percentage"
      ).textContent = `${savingsPercentage.toFixed(0)}% reached`;
    }
  }

  function renderTransactions() {
    const transactionList = document.getElementById("transaction-list");
    transactionList.innerHTML = "";
    const recentTransactions = transactions.slice(-6).reverse();

    const icons = {
      income: `
                <div class="transaction-icon income">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 5V19" stroke="#28a745" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M18 11L12 5L6 11" stroke="#28a745" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </div>`,
      expense: `
                <div class="transaction-icon expense">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 19V5" stroke="#dc3545" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M6 13L12 19L18 13" stroke="#dc3545" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </div>`,
    };

    recentTransactions.forEach((t) => {
      const item = document.createElement("li");
      item.classList.add("transaction");
      item.innerHTML = `
                <div class="transaction-details">
                    ${icons[t.type]}
                    <div>
                        <p>${t.description}</p>
                        <span>${t.category} - ${new Date(
        t.date
      ).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                    </div>
                </div>
                <span class="amount ${t.type}">${
        t.type === "income" ? "+" : ""
      }₦${t.amount.toFixed(2)}</span>
            `;
      transactionList.appendChild(item);
    });
  }

  function renderChart() {
    const ctx = document.getElementById("spending-chart").getContext("2d");
    const expenseData = transactions
      .filter((t) => t.type === "expense")
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      }, {});

    const labels = Object.keys(expenseData);
    const values = Object.values(expenseData);

    function generateColors(n) {
      return Array.from({ length: n }, (_, i) => {
        const hue = Math.round((360 * i) / n);
        return `hsl(${hue}, 65%, 60%)`;
      });
    }

    const chartData = {
      labels,
      datasets: [
        {
          data: values,
          backgroundColor: generateColors(labels.length),
        },
      ],
    };

    if (spendingChart) {
      spendingChart.destroy();
    }

    spendingChart = new Chart(ctx, {
      type: "pie",
      data: chartData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "bottom",
          },
        },
      },
    });
  }

  // Event Listeners
  addTransactionBtn.addEventListener("click", () =>
    showModal(addTransactionModal)
  );
  cancelTransactionBtn.addEventListener("click", () =>
    closeModal(addTransactionModal)
  );

  transactionForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const formData = new FormData(transactionForm);
    const newTransaction = {
      id: Date.now(),
      type: formData.get("type"),
      description: formData.get("description"),
      amount: parseFloat(formData.get("amount")),
      category: formData.get("category"),
      date: formData.get("date"),
    };
    transactions.push(newTransaction);
    localStorage.setItem("transactions", JSON.stringify(transactions));
    updateUI();
    closeModal(addTransactionModal);
    transactionForm.reset();
  });

  initialSetupForm.addEventListener("submit", (e) => {
    e.preventDefault();
    goals.income = parseFloat(document.getElementById("setup-income").value);
    goals.savings = parseFloat(document.getElementById("setup-savings").value);
    localStorage.setItem("goals", JSON.stringify(goals));
    updateUI();
    closeModal(initialSetupModal);
  });

  // Initial Load
  function init() {
    if (!goals.income || !goals.savings) {
      showModal(initialSetupModal);
    }
    updateUI();
  }

  init();
}

document.addEventListener("DOMContentLoaded", main);
