function extractLineItems(text) {
    const lines = text.split('\n');
    const lineItems = [];
    let currentLineItem = null;
    let isInLineItemsSection = false;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // Skip empty lines
        if (!line) continue;

        // Check if we're entering the line items section
        if (line.toLowerCase().includes('quantity') && 
            line.toLowerCase().includes('unit price') && 
            line.toLowerCase().includes('amount')) {
            isInLineItemsSection = true;
            continue;
        }

        // Check if we're leaving the line items section
        if (isInLineItemsSection && 
            (line.toLowerCase().includes('subtotal') || 
             line.toLowerCase().includes('total'))) {
            isInLineItemsSection = false;
            continue;
        }

        if (isInLineItemsSection) {
            // Try to parse the line as a line item
            const parts = line.split(/\s+/);
            if (parts.length >= 3) {
                // Check if this is a new line item (starts with a number)
                if (/^\d+$/.test(parts[0])) {
                    // If we have a previous line item, save it
                    if (currentLineItem) {
                        lineItems.push(currentLineItem);
                    }

                    // Create new line item
                    currentLineItem = {
                        quantity: parseInt(parts[0]),
                        unitPrice: parseFloat(parts[parts.length - 2].replace(/[^0-9.]/g, '')),
                        amount: parseFloat(parts[parts.length - 1].replace(/[^0-9.]/g, '')),
                        description: parts.slice(1, -2).join(' ')
                    };
                } else if (currentLineItem) {
                    // Append to current line item's description
                    currentLineItem.description += ' ' + line;
                }
            }
        }
    }

    // Add the last line item if exists
    if (currentLineItem) {
        lineItems.push(currentLineItem);
    }

    return lineItems;
}

module.exports = {
    extractLineItems
}; 