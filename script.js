// Initialize arrays to store transactions and original prices
let transactions = [];
let originalPrices = {};

// Load data from localStorage when the page loads
window.onload = function () {
  if (localStorage.getItem('transactions')) {
    transactions = JSON.parse(localStorage.getItem('transactions'));
  }
  if (localStorage.getItem('originalPrices')) {
    originalPrices = JSON.parse(localStorage.getItem('originalPrices'));
  }
  updateTable();
  populateItemSuggestions(); // Populate the item suggestions for autocomplete
};

// Function to populate the item suggestions for autocomplete
function populateItemSuggestions() {
  const datalist = document.getElementById("item-suggestions");
  datalist.innerHTML = ""; // Clear existing options

  // Populate with item names from originalPrices
  Object.keys(originalPrices).forEach(item => {
    const option = document.createElement("option");
    option.value = item; // Set the item name as the value
    datalist.appendChild(option);
  });
}

// Function to save data to localStorage
function saveData() {
  localStorage.setItem('transactions', JSON.stringify(transactions));
  localStorage.setItem('originalPrices', JSON.stringify(originalPrices));
}

// Function to calculate profit or loss for a transaction
function calculateProfit(transaction) {
  const originalPrice = originalPrices[transaction.itemName] || 0;
  const totalBuying = transaction.buyingPrice * transaction.quantity;
  const totalOriginal = originalPrice * transaction.quantity;
  const profit = totalOriginal - totalBuying;
  return profit;
}

// Function to update the transaction table
function updateTable() {
  const tableBody = document.getElementById('transactionTable');
  tableBody.innerHTML = ''; // Clear existing rows

  transactions.forEach((transaction, index) => {
    const profit = calculateProfit(transaction);
    const profitClass = profit >= 0 ? 'profit' : 'loss';

    const row = document.createElement('tr');

    row.innerHTML = `
      <td>${transaction.itemName}</td>
      <td>${transaction.quantity}</td>
      <td>${transaction.buyingPrice.toLocaleString()}</td>
      <td>${(originalPrices[transaction.itemName] || 'N/A').toLocaleString()}</td>
      <td>${(transaction.buyingPrice * transaction.quantity).toLocaleString()}</td>
      <td>${(originalPrices[transaction.itemName] * transaction.quantity || 'N/A').toLocaleString()}</td>
      <td class="${profitClass}">${profit !== 'N/A' ? profit.toLocaleString() : 'N/A'}</td>
      <td>
        <button class="edit-btn" onclick="editTransaction(${index})">Edit</button>
        <button class="delete-btn" onclick="deleteTransaction(${index})">Delete</button>
      </td>
    `;

    tableBody.appendChild(row);
  });
}

// Handle adding a new transaction
document.getElementById('transactionForm').addEventListener('submit', function (event) {
  event.preventDefault();

  const itemName = document.getElementById('itemName').value.trim();
  const quantity = parseInt(document.getElementById('quantity').value);
  const buyingPrice = parseFloat(document.getElementById('buyingPrice').value);

  if (itemName === '' || isNaN(quantity) || isNaN(buyingPrice)) {
    alert('Please fill in all fields correctly.');
    return;
  }

  // Add the new transaction
  transactions.push({
    itemName,
    quantity,
    buyingPrice
  });

  // Save and update the table
  saveData();
  updateTable();

  // Reset the form
  document.getElementById('transactionForm').reset();
});

// Handle setting original prices
document.getElementById('priceForm').addEventListener('submit', function (event) {
  event.preventDefault();

  const originalItemName = document.getElementById('originalItemName').value.trim();
  const originalPrice = parseFloat(document.getElementById('originalPrice').value);

  if (originalItemName === '' || isNaN(originalPrice)) {
    alert('Please fill in all fields correctly.');
    return;
  }

  // Set the original price for the item
  originalPrices[originalItemName] = originalPrice;

  // Save and update the table
  saveData();
  updateTable();
  populateItemSuggestions(); // Update suggestions after setting original prices

  // Reset the form
  document.getElementById('priceForm').reset();
});

// Handle editing a transaction
function editTransaction(index) {
  const transaction = transactions[index];

  // Pre-fill the form with the transaction data
  document.getElementById('itemName').value = transaction.itemName;
  document.getElementById('quantity').value = transaction.quantity;
  document.getElementById('buyingPrice').value = transaction.buyingPrice;

  // Delete the original transaction and update the table
  deleteTransaction(index);
}

// Handle deleting a transaction
function deleteTransaction(index) {
  // Remove the transaction from the array
  transactions.splice(index, 1);

  // Save and update the table
  saveData();
  updateTable();
}