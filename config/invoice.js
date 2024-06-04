const fs = require('fs');
const PDFDocument = require('pdfkit');

function generateHeader(doc) {
    doc
        
        .fillColor('#444444')
        .fontSize(20)
        .text('', 110, 57)
        .fontSize(10)
        .text('Konni,Pathanamthitta ', 200, 65, { align: 'right' })
        .text('Kerala, 68969', 200, 80, { align: 'right' })
        .moveDown();
}

function generateFooter(doc) {
    doc.fontSize(
        10,
    ).text(
        'Thanks for ordering. Your support is our strength.',
        50,
        700,
        { align: 'center', width: 500 },
    );
}

function generateCustomerInformation(doc, invoice) {
	const shipping = invoice.shippingAddress;
    console.log(shipping)

    doc.fontSize(18).text('Invoice', 50, 160);
    
    // doc.font('Helvetica');
    doc.fontSize(9);

    doc.lineWidth(0.1);
    // doc.fillColor('#caf4f7'); 

    // doc.rect(50, 185, 500, 65).fill();
    // doc.fillColor('black');

    doc.moveTo(50, 185).lineTo(550, 185).stroke();
	 doc.text(`Invoice Number:     ${invoice._id.toString().slice(0, 8)}`, 50, 200)
		.text(`Invoice Date:       ${new Date().toLocaleDateString()}`, 50, 215)
		.text(`Payment Method:     ${invoice.paymentMethod}`, 50, 230)

		.text(shipping.addresstype, 400, 200)
		.text(`${shipping.housename}, ${shipping.district}`, 400, 215)
		.text(
			`${shipping.town}, ${shipping.state}, ${shipping.country} ${shipping.zipcode}`,
			400,
			230,
		)
		.moveDown();
        
        doc.moveTo(50, 250).lineTo(550, 250).stroke();
    
    
    doc.lineWidth(1);
}

function generateTableHeader(doc, y) {
    doc.lineWidth(0.1);
    generateTableRow(
        doc,
        y,
        'Product Name',
        'Category',
        'Unit Price',
        'Quantity',
        'Total',
        true // Indicates that this is a header row
    );
    doc.lineWidth(0.1);

}

function generateTableRow(doc, y, c1, c2, c3, c4, c5, isHeader = false) {
    doc.fontSize(10);
    
    // Set different styling for header row
    if (isHeader) {
        // doc.font('Bold');
        doc.fillColor('#000'); // Change the color for headers
    }
    doc.text(c1, 50, y)
        .text(c2, 150, y)
        .text(c3, 280, y, { width: 90, align: 'right' })
        .text(c4, 370, y, { width: 90, align: 'right' })
        .text(c5, 0, y, { align: 'right' });

    // Reset font and color to default
    // doc.font('Regular');
    doc.fillColor('#000');
}

function generateInvoiceTable(doc, invoice) {
    let i,
        invoiceTableTop = 330;
        
    // Generate table heading
    generateTableHeader(doc, invoiceTableTop);
    
    doc.lineWidth(0.1);
    doc.moveTo(50, 360).lineTo(568, 360).stroke();
    

    for (i = 0; i < invoice.items.length; i++) {
        const item = invoice.items[i];
        const position = invoiceTableTop + (i + 2) * 25; 
    doc.fillColor('#888');

        // Adjust the starting position for the first row
        generateTableRow(
            doc,
            position,
            item.product.name,
            item.product.category,
            item.product.unitPrice,
            item.quantity,
            item.product.price * item.quantity,
        );
    }
    doc.fillColor('#000');
    const subtotalPosition = invoiceTableTop + (invoice.items.length + 2) * 25 + 20;
    // const discountPosition = subtotalPosition + 20;
    // const totalPricePosition = discountPosition + 30;
    const totalPricePosition =subtotalPosition;

    
    doc.lineWidth(0.1);
    doc.moveTo(50, subtotalPosition-20).lineTo(568, subtotalPosition-20).stroke();

    // doc.moveDown().text(`Subtotal:                     ${ invoice.TotalPrice}`, 435, subtotalPosition);
    // doc.text(`Discount:                     ${invoice.discount.disamnt}`, 435, discountPosition);
    doc.text(`Total Price:                  ${invoice.TotalPrice}`, 435, totalPricePosition);

}


function createInvoice(order,res) {
    return new Promise((resolve, reject) => {
        let doc = new PDFDocument({ margin: 50 });

        generateHeader(doc); // Invoke `generateHeader` function.
        generateCustomerInformation(doc, order); // Invoke `generateCustomerInformation` function.
        generateInvoiceTable(doc, order); // Invoke `generateInvoiceTable` function.
        generateFooter(doc);// Invoke `generateFooter` function.
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=invoice.pdf');
    
        doc.pipe(res);
        doc.end();
    });
}

module.exports = {
	createInvoice,
};