// Initialize DataTable
const table = $('#purchasesTable').DataTable({
    order: [[4, 'desc']],
    pageLength: 25
});

// Item ID to name mapping
const itemMap = {
    '97': 'Bunch of Flowers',
    '902': 'Bunch of Carnations',
    '129': 'Dozen Roses',
    '901': 'Daffodil',
    '904': 'Funeral Wreath',
    '183': 'Single Red Rose',
    '184': 'Bunch of Black Roses',
    '260': 'Dahlia',
    '272': 'Edelweiss',
    '903': 'White Lily',
    '263': 'Crocus',
    '617': 'Banana Orchid',
    '264': 'Orchid',
    '271': 'Ceibo Flower',
    '267': 'Heather',
    '277': 'Cherry Blossom',
    '276': 'Peony',
    '282': 'African Violet',
    '385': 'Tribulus Omanense',
    '435': 'Dozen White Roses',
    '187': 'Teddy Bear Plushie',
    '186': 'Sheep Plushie',
    '215': 'Kitten Plushie',
    '273': 'Chamois Plushie',
    '261': 'Wolverine Plushie',
    '618': 'Stingray Plushie',
    '258': 'Jaguar Plushie',
    '266': 'Nessie Plushie',
    '268': 'Red Fox Plushie',
    '269': 'Monkey Plushie',
    '274': 'Panda Plushie',
    '281': 'Lion Plushie',
    '384': 'Camel Plushie',
    '180': 'Bottle of Beer',
    '426': 'Bottle of Tequila',
    '294': 'Bottle of Sake',
    '181': 'Bottle of Champagne',
    '550': 'Bottle of Kandy Kane',
    '531': 'Bottle of Pumpkin Brew',
    '542': 'Bottle of Wicked Witch',
    '551': 'Bottle of Minty Mayhem',
    '638': 'Bottle of Christmas Cocktail',
    '552': 'Bottle of Mistletoe Madness',
    '541': 'Bottle of Stinky Swamp Punch',
    '984': 'Bottle of Moonshine',
    '873': 'Bottle of Green Stout',
    '924': 'Bottle of Christmas Spirit',
    '985': 'Can of Goose Juice',
    '986': 'Can of Damp Valley',
    '987': 'Can of Crocozade',
    '553': 'Can of Santa Shooters',
    '530': 'Can of Munster',
    '554': 'Can of Rockstar Rudolph',
    '532': 'Can of Red Cow',
    '533': 'Can of Taurine Elite',
    '555': 'Can of X-MASS',
    '206': 'Xanax',
    '368': 'Lawyer\'s Business Card',
    '366': 'Erotic DVD',
    '367': 'Feathery Hotel Coupon',
    '329': 'Skateboard',
    '106': 'Parachute',
    '331': 'Dumbbells',
    '330': 'Boxing Gloves',
    '815': 'Keg of Beer',
    '365': 'Box of Medical Supplies',
    '369': 'Lottery Voucher',
    '817': 'Six-Pack of Alcohol',
    '364': 'Box of Grenades',
    '818': 'Six-Pack of Energy Drink',
    '283': 'Donator Pack',
};

// Load purchases from localStorage
function loadPurchases() {
    const purchases = JSON.parse(localStorage.getItem('tornPurchases') || '[]');
    table.clear();
    purchases.forEach(p => {
        table.row.add([
            p.itemName,
            p.quantity,
            p.price.toFixed(2),
            (p.quantity * p.price).toFixed(2),
            new Date(p.date).toLocaleString(),
            p.source
        ]);
    });
    table.draw();
}

// Save purchase to localStorage
function savePurchase(purchase) {
    const purchases = JSON.parse(localStorage.getItem('tornPurchases') || '[]');
    const exists = purchases.some(p => 
        p.itemName === purchase.itemName && 
        p.quantity === purchase.quantity && 
        p.date === purchase.date
    );
    if (!exists) {
        purchases.push(purchase);
        localStorage.setItem('tornPurchases', JSON.stringify(purchases));
        loadPurchases();
        return true;
    }
    return false;
}

// Load API key from localStorage on page load
$(document).ready(() => {
    loadPurchases();
    const savedApiKey = localStorage.getItem('tornApiKey');
    if (savedApiKey) {
        $('#apiKey').val(savedApiKey);
    }

    // Initialize autocomplete for calcItemName
    const purchases = JSON.parse(localStorage.getItem('tornPurchases') || '[]');
    const itemNames = [...new Set([
        ...purchases.map(p => p.itemName),
        ...Object.values(itemMap)
    ])];
    $('#calcItemName').autocomplete({
        source: itemNames,
        minLength: 2
    });
});

// Save API key to localStorage on input change
$('#apiKey').on('input', () => {
    const apiKey = $('#apiKey').val().trim();
    localStorage.setItem('tornApiKey', apiKey);
});

// Fetch recent purchases from Torn API
$('#fetchPurchases').click(async () => {
    const apiKey = $('#apiKey').val().trim();
    if (!apiKey) {
        alert('Please enter a valid API key.');
        return;
    }
    try {
        const response = await fetch(`https://api.torn.com/user/?selections=log&key=${apiKey}`);
        const data = await response.json();
        if (data.error) {
            alert(`API Error: ${data.error.error} (Code: ${data.error.code})`);
            return;
        }
        const logs = data.log || {};
        let newPurchases = 0;
        Object.values(logs).forEach(log => {
            if (log.title === 'Item market buy' || log.title === 'Bazaar buy') {
                const data = log.data || {};
                const items = data.items || [];
                const costEach = data.cost_each || 0;
                const source = log.title === 'Item market buy' ? 'Item Market' : 'Bazaar';
                items.forEach(item => {
                    const itemId = item.id.toString();
                    const itemName = itemMap[itemId] || `Unknown Item (ID: ${itemId})`;
                    if (!itemMap[itemId]) {
                        console.warn(`Unknown item ID: ${itemId}. Please update itemMap.`);
                    }
                    const quantity = item.qty || 1;
                    if (quantity > 0 && costEach > 0) {
                        const purchase = {
                            itemName,
                            quantity,
                            price: costEach,
                            date: new Date(log.timestamp * 1000).toISOString(),
                            source
                        };
                        if (savePurchase(purchase)) {
                            newPurchases++;
                        }
                    } else {
                        console.warn('Skipping invalid purchase:', log);
                    }
                });
            }
        });
        alert(newPurchases > 0 ? `${newPurchases} purchases fetched successfully!` : 'No new purchases found.');
    } catch (err) {
        alert('Error fetching purchases: ' + err.message);
        console.error('Fetch Error:', err);
    }
});

// Toggle manual entry form
$('#addManual').click(() => $('#manualForm').toggle());
$('#cancelManual').click(() => $('#manualForm').hide());

// Handle manual purchase form submission
$('#purchaseForm').submit(e => {
    e.preventDefault();
    const purchase = {
        itemName: $('#itemName').val(),
        quantity: parseInt($('#quantity').val()),
        price: parseFloat($('#price').val()),
        date: new Date().toISOString(),
        source: $('#source').val()
    };
    savePurchase(purchase);
    $('#purchaseForm')[0].reset();
    $('#manualForm').hide();
});

// Calculate item purchase summary
$('#calcItemName').on('input', () => {
    const itemName = $('#calcItemName').val().trim();
    const purchases = JSON.parse(localStorage.getItem('tornPurchases') || '[]');
    const itemPurchases = purchases.filter(p => p.itemName.toLowerCase().includes(itemName.toLowerCase()));

    if (itemPurchases.length > 0) {
        const totalQuantity = itemPurchases.reduce((sum, p) => sum + p.quantity, 0);
        const totalPrice = itemPurchases.reduce((sum, p) => sum + p.quantity * p.price, 0);
        const prices = itemPurchases.map(p => p.price);
        const avgPrice = itemPurchases.reduce((sum, p) => sum + p.price * p.quantity, 0) / totalQuantity;
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);

        $('#itemNameDisplay').text(itemName || 'Matching Items');
        $('#totalQuantity').text(totalQuantity);
        $('#avgPrice').text(avgPrice.toFixed(2));
        $('#minPrice').text(minPrice.toFixed(2));
        $('#maxPrice').text(maxPrice.toFixed(2));
        $('#totalPrice').text(totalPrice.toFixed(2));
        $('#calcResults').show();
    } else {
        $('#calcResults').hide();
    }
});
