import PDFDocument from 'pdfkit';
import { Readable } from 'stream';
import { format } from 'date-fns';
const axios = require('axios');
const fs = require('fs');
const path = require('path');

type LineItem = {
    date: string;
    items: { name: string; quantity: number; pricePer100: number, total: number, unit: string  }[];
    dateTotal: number;
};

type MonthGroup = {
    month: string;
    items: { name: string; quantity: number; pricePer100: number, total: number, unit: string }[];
    monthTotal: number;
};

function groupActionsByDate(actions, priceList: any): LineItem[] {
    const grouped = new Map<string, LineItem>();

    for (const action of actions) {
        const date = format(new Date(action.timestamp), 'yyyy-MM-dd');
        let productName = action.plantBatch?.plant?.name || '';
        const quantity = action.plantBatch?.amount || 1;
        let pricePer100 = 0;
        let unitMultiplier = 1 / 100;

        if (action.recipe) {
            productName = action.recipe.name;
            const recipePriceEntry = priceList.recipeList?.find(p => 
                p.recipe?.id == action.recipe.id && 
                (p.unit === action.unit || (!p.unit && (action.unit === 'GRAM' || !action.unit)))
            );
            pricePer100 = recipePriceEntry ? recipePriceEntry.price : 0;
            if (action.unit && action.unit.startsWith('BOX_')) {
                unitMultiplier = 1;
            }
        } else if (action.plantBatch?.plant) {
            const listIndex = priceList.list.findIndex(p => p.plant.id == action.plantBatch.plant.id);
            pricePer100 = listIndex >= 0 ? priceList.list[listIndex].price : 0;
        }

        if (!grouped.has(date)) {
            grouped.set(date, { date, items: [], dateTotal: 0 });
        }

        const group = grouped.get(date)!;
        const itemUnit = (action.unit && action.unit.startsWith('BOX_')) ? 'ks' : 'g';
        const existingItem = group.items.find(i => i.name === productName && i.unit === itemUnit);
        const itemTotal = pricePer100 * quantity * unitMultiplier;

        if (existingItem) {
            existingItem.quantity += quantity;
            existingItem.total += itemTotal;
        } else {
            group.items.push({ name: productName, quantity, pricePer100, total: itemTotal, unit: itemUnit });
        }

        group.dateTotal += itemTotal;
    }

    return Array.from(grouped.values());
}

function groupDeliveriesByDate(deliveries: any[], priceList: any): LineItem[] {
    const grouped = new Map<string, LineItem>();

    for (const delivery of deliveries) {
        const date = format(new Date(delivery.deliveredAt || delivery.createdAt), 'yyyy-MM-dd');

        if (!grouped.has(date)) {
            grouped.set(date, { date, items: [], dateTotal: 0 });
        }
        const group = grouped.get(date)!;

        for (const item of delivery.deliveredItems || []) {
            let productName = item.recipe?.name || '';
            const quantity = item.amount || 0;
            let pricePer100 = 0;
            let unitMultiplier = 1 / 100; // Default for GRAM (price per 100g)

            if (item.recipe) {
                productName = item.recipe.name;
                const recipePriceEntry = priceList.recipeList?.find(p => 
                    p.recipe?.id == item.recipe.id && 
                    (p.unit === item.unit || (!p.unit && (item.unit === 'GRAM' || !item.unit)))
                );
                pricePer100 = recipePriceEntry ? recipePriceEntry.price : 0;
                
                // If unit is BOX_*, the price is per piece (ks), not per 100g
                if (item.unit && item.unit.startsWith('BOX_')) {
                    unitMultiplier = 1;
                }
            }
            // else if (item.plant) {
            //     const listIndex = priceList.list.findIndex(p => p.plant.id == item.plant.id);
            //     pricePer100 = listIndex >= 0 ? priceList.list[listIndex].price : 0;
            // }

            const itemUnit = (item.unit && item.unit.startsWith('BOX_')) ? 'ks' : 'g';
            const existingItem = group.items.find(i => i.name === productName && i.unit === itemUnit);
            const itemTotal = pricePer100 * quantity * unitMultiplier;

            if (existingItem) {
                existingItem.quantity += quantity;
                existingItem.total += itemTotal;
            } else {
                group.items.push({ name: productName, quantity, pricePer100, total: itemTotal, unit: itemUnit });
            }

            group.dateTotal += itemTotal;
        }
    }

    return Array.from(grouped.values()).sort((a, b) => a.date.localeCompare(b.date));
}

function groupActionsByMonthAndPlant(actions, priceList: any): MonthGroup[] {
    const groupedByMonth = new Map<string, MonthGroup>();

    for (const action of actions) {
        const date = new Date(action.timestamp);
        const monthKey = format(date, 'yyyy-MM');
        let productName = action.plantBatch?.plant?.name || '';
        const quantity = action.plantBatch?.amount || 1;
        let pricePer100 = 0;
        let unitMultiplier = 1 / 100;

        if (action.recipe) {
            productName = action.recipe.name;
            const recipePriceEntry = priceList.recipeList?.find(p => 
                p.recipe?.id == action.recipe.id && 
                (p.unit === action.unit || (!p.unit && (action.unit === 'GRAM' || !action.unit)))
            );
            pricePer100 = recipePriceEntry ? recipePriceEntry.price : 0;
            if (action.unit && action.unit.startsWith('BOX_')) {
                unitMultiplier = 1;
            }
        } else if (action.plantBatch?.plant) {
            const listIndex = priceList.list.findIndex(p => p.plant.id == action.plantBatch.plant.id);
            pricePer100 = listIndex >= 0 ? priceList.list[listIndex].price : 0;
        }

        if (!groupedByMonth.has(monthKey)) {
            groupedByMonth.set(monthKey, { month: monthKey, items: [], monthTotal: 0 });
        }

        const group = groupedByMonth.get(monthKey)!;
        const itemUnit = (action.unit && action.unit.startsWith('BOX_')) ? 'ks' : 'g';
        const existingItem = group.items.find(i => i.name === productName && i.unit === itemUnit);
        const itemTotal = pricePer100 * quantity * unitMultiplier;

        if (existingItem) {
            existingItem.quantity += quantity;
            existingItem.total += itemTotal;
        } else {
            group.items.push({ name: productName, quantity, pricePer100, total: itemTotal, unit: itemUnit });
        }

        group.monthTotal += itemTotal;
    }

    return Array.from(groupedByMonth.values()).sort((a, b) => a.month.localeCompare(b.month));
}

function groupBoxBatchesByDate(batches, priceList: any): LineItem[] {
    const grouped = new Map<string, LineItem>();

    for (const batch of batches) {
        for (const delivery of batch.deliveries) {
            const date = format(new Date(batch.dueToDate), 'yyyy-MM-dd');
            
            if (!grouped.has(date)) {
                grouped.set(date, { date, items: [], dateTotal: 0 });
            }
            const group = grouped.get(date)!;

            for (const boxBatch of delivery.box_batches) {
                const productName = boxBatch.plant.name + " (box S)";
                const quantity = boxBatch.amount || 0;
                
                // look up size S and apply the price
                const boxPriceEntry = priceList.boxList.find(bp => 
                    bp.plant.id == boxBatch.plant.id && bp.size === 'S'
                );
                const pricePerBox = boxPriceEntry ? boxPriceEntry.price : 0;

                const existingItem = group.items.find(i => i.name === productName && i.unit === 'ks');
                if (existingItem) {
                    existingItem.quantity += quantity;
                    existingItem.total += pricePerBox * quantity;
                } else {
                    group.items.push({ 
                        name: productName, 
                        quantity, 
                        pricePer100: pricePerBox,
                        total: pricePerBox * quantity,
                        unit: 'ks'
                    });
                }
                group.dateTotal += pricePerBox * quantity;
            }
        }
    }

    return Array.from(grouped.values()).sort((a, b) => a.date.localeCompare(b.date));
}

export async function generateBoxInvoicePdf(batches: any[], customer: any, me: any, startDate: Date) {
    const doc = new PDFDocument({ size: "A4", margin: 50 });

    doc.registerFont('regular', 'fonts/Podkova-Regular.ttf')
    doc.registerFont('bold', 'fonts/Podkova-Bold.ttf')

    const chunks: Buffer[] = [];

    const invoiceNum = getInvoiceNum(startDate, customer);
    console.log('customer.orders[0]:',customer.orders[0]);
    console.log('customer',customer);
    const priceList = customer.orders[0].price_list;
    const grouped = groupBoxBatchesByDate(batches, priceList);
    const totalSum = grouped.reduce((acc, g) => acc + g.dateTotal, 0);

    generateHeader(doc, invoiceNum);
    generatePersonalInfo(doc, customer, me);
    await generatePaymentDetail(doc, 250, me.billing.account || me.account, invoiceNum, me.billing.bankNum || me.bankNum, totalSum)
    generateInvoiceTable(doc, totalSum, grouped);
    doc.end();

    return new Promise<Buffer>((resolve, reject) => {
        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);
    });
}

export async function generateAggregatedInvoicePdf(actions: any[], customer: any, me: any, startDate: Date) {
    const doc = new PDFDocument({ size: "A4", margin: 50 });

    doc.registerFont('regular', 'fonts/Podkova-Regular.ttf')
    doc.registerFont('bold', 'fonts/Podkova-Bold.ttf')

    const chunks: Buffer[] = [];

    const invoiceNum = getInvoiceNum(startDate, customer);
    const priceList = customer.orders[0].price_list;
    const grouped = groupActionsByMonthAndPlant(actions, priceList);
    const totalSum = grouped.reduce((acc, g) => acc + g.monthTotal, 0);

    generateHeader(doc, invoiceNum);
    generatePersonalInfo(doc, customer, me);
    await generatePaymentDetail(doc, 250, me.billing.account || me.account, invoiceNum, me.billing.bankNum || me.bankNum, totalSum)
    await generateAggregatedInvoiceTable(doc, totalSum, grouped)
    doc.end();

    return new Promise<Buffer>((resolve, reject) => {
        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);
    });
}


export async function generateInvoicePdf(actions: any[], customer: any, me: any, startDate: Date) {
    const doc = new PDFDocument({size: "A4", margin: 50 });



    doc.registerFont('regular', 'fonts/Podkova-Regular.ttf')
    doc.registerFont('bold', 'fonts/Podkova-Bold.ttf')

    const chunks: Buffer[] = [];


    const invoiceNum = getInvoiceNum(startDate, customer);

    // Group actions by delivery date
    const priceList = customer.orders[0].price_list;
    const grouped = groupActionsByDate(actions, priceList);
    const totalSum = grouped.reduce((acc, g) => acc + g.dateTotal, 0);


    generateHeader(doc, invoiceNum);
    generatePersonalInfo(doc, customer, me);
    await generatePaymentDetail(doc, 250,  me.account, invoiceNum, me.bankNum, totalSum)
    await generateInvoiceTable(doc, totalSum, grouped)

    doc.end();

    return new Promise<Buffer>((resolve, reject) => {
        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);
    });
}

export async function generateBatchDeliveryInvoicePdf(deliveries: any[], customer: any, me: any, startDate: Date) {
    const doc = new PDFDocument({ size: "A4", margin: 50 });

    doc.registerFont('regular', 'fonts/Podkova-Regular.ttf')
    doc.registerFont('bold', 'fonts/Podkova-Bold.ttf')

    const chunks: Buffer[] = [];

    const invoiceNum = getInvoiceNum(startDate, customer);

    // Group deliveries by delivery date
    const priceList = customer.orders[0].price_list;
    const grouped = groupDeliveriesByDate(deliveries, priceList);
    const totalSum = grouped.reduce((acc, g) => acc + g.dateTotal, 0);

    generateHeader(doc, invoiceNum);
    generatePersonalInfo(doc, customer, me);
    await generatePaymentDetail(doc, 250, me.billing.account || me.account, invoiceNum, me.billing.bankNum || me.bankNum, totalSum)
    await generateInvoiceTable(doc, totalSum, grouped)

    doc.end();

    return new Promise<Buffer>((resolve, reject) => {
        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);
    });
}

const generateHeader = (doc, invoiceNum) => {
    doc
        .image("public/logo/logo_text.png", 50, 50, { width: 200 })
        .fillColor("#444444")
        .font('regular')
        .fontSize(10)
        .text('Faktura číslo:', 50, 60, { align: "right" })
        .font('bold')
        .fontSize(20)
        .text(invoiceNum, 50, 70, { align: "right" })
        .moveDown();
}

function generatePersonalInfo(doc, customer, me) {
    const start = 110
    doc
        .fillColor("#444444")
        .fontSize(20)
        .text("Dodavatel", 50, start)
        .text("Odběratel", 350, start)
        .moveDown();

    doc
        .fontSize(10)
        .text(me.billing.officialName, 50, start + 25)
        .text(me.billing.address.street, 50, start + 40)
        .text(`${me.billing.address.postCode}, ${me.billing.address.city}`, 50, start + 55)
        .text(customer.billing.address.country, 50, start + 70)
        .text(`Ičo: ${me.billing.ico}`, 50, start + 85)
        .text('Neplátce DPH', 50, start + 100)
        .text('obchod@zrzavaopice.cz', 50, start + 115)
        .moveDown();

    doc
        .fontSize(10)
        .text(customer.billing.officialName, 350, start + 25)
        .text(customer.billing.address.street, 350, start + 40)
        .text(`${customer.billing.address.postCode}, ${customer.billing.address.city}`, 350, start + 55)
        .text(customer.billing.address.country, 350, start + 70)
        .text(`Ičo: ${customer.billing.ico}`, 350, start + 85)
        .text(customer.billing.dic ? `Dič: ${customer.billing.dic}`: '', 350, start + 100)
        .moveDown();

}


const generatePaymentDetail = async (doc, start: number, account, vsCode, bankNum, totalPrice) => {


    const filePath = await generateQrCode(account, vsCode, bankNum, totalPrice);

    let orderDate = new Date()
    const createdAt = `${orderDate.getDate()}. ${orderDate.getMonth() + 1}. ${orderDate.getFullYear()}`;
    orderDate.setDate(orderDate.getDate() + 15);
    const payUntil = `${orderDate.getDate()}. ${orderDate.getMonth() + 1}. ${orderDate.getFullYear()}`;

    generateHr(doc, start);
    doc
        .text('Datum vystavení', 50, start + 10)
        .text('Datum splatnosti', 50, start + 25)
        .text('Způsob platby:', 50, start + 40)
        .text('Číslo účtu:', 50, start + 55)
        .text('Variabilní symbol:', 50, start + 70)
        .font('bold')
        .text(createdAt, 150, start + 10)
        .text(payUntil, 150, start + 25)
        .text('Převodem', 150, start + 40)
        .text(`${account}/${bankNum}`, 150, start + 55)
        .text(vsCode, 150, start + 70);
    if (filePath != '') {
        doc.image(filePath, 475, start + 5, {width: 75})
    }
    generateHr(doc, start + 90);


}

function generateHr(doc, y, lineW = 1) {
    doc
        .strokeColor("#aaaaaa")
        .lineWidth(lineW)
        .moveTo(50, y)
        .lineTo(550, y)
        .stroke();
}

const generateQrCode = async (account: string, vsCode: string, bankNum: string, totalPrice: string ) => {
    const api = 'https://api.paylibo.com/paylibo/generator/czech/image';
    const url = `${api}?accountNumber=${account}&bankCode=${bankNum}&amount=${totalPrice}&currency=CZK&vs=${vsCode}`;
    const saveDirectory = '.tmp/qrPayment/';
    let filePath ='';
    try {
        filePath = await savePngFileFromUrl(url, saveDirectory, vsCode)
    } catch (error) {
        console.error({vsCode, error}, 'generate qrcode failed');
    }
    return filePath;
}

async function savePngFileFromUrl(url, saveDirectory, name) {
    try {
        if (!fs.existsSync(saveDirectory)) {
            fs.mkdirSync(saveDirectory, { recursive: true });
        }

        const fileName = path.basename(`${name}.png`);
        const filePath = path.join(saveDirectory, fileName);

        await downloadAndSaveFile(url, filePath);

        return filePath;
    } catch (error) {
        throw new Error(`Error saving PNG file from URL: ${error.message}`);
    }
}

async function downloadAndSaveFile(url, filePath) {
    try {
        const response = await axios({
            url,
            method: 'GET',
            responseType: 'stream'
        });

        const writer = fs.createWriteStream(filePath);
        response.data.pipe(writer);

        return new Promise((resolve, reject) => {
            writer.on('finish', () => resolve(filePath));
            writer.on('error', reject);
        });
    } catch (error) {
        throw new Error(`Error downloading file: ${error.message}`);
    }
}

const generateInvoiceTable = (doc, totalPrice, groupedActions: any[]) => {

    let actualRow = 370;

    generateTableRow(
        doc,
        actualRow,
        ["Doručení", "Druh", "Množství", "Cena za j.", "Součet"]
    );
    actualRow += 15;
    generateHr(doc, actualRow, 3);
    actualRow += 2;
    groupedActions.forEach((group, index) => {
        let deliveryDate = format(new Date(group.date), 'dd.MM.yyyy')
        actualRow += 2;
        group.items.forEach((item, index) => {

            if(index>0) {
                deliveryDate = '';
            }
            const priceLabel = item.unit === 'g' ? ' /100g' : ' /ks';
            generateTableRow(doc, actualRow, [deliveryDate, item.name, item.quantity + " " + item.unit, formatCurrency(item.pricePer100) + priceLabel, formatCurrency(item.total)] );
            actualRow = actualRow + 10;
        });
        actualRow += 2;
        generateHr(doc, actualRow, 1);
    });
    generateHr(doc, actualRow, 2);
    actualRow += 20;
    doc
        .fontSize(15)
        .font('bold')
        .text('Celkem k úhradě:', 200, actualRow, { width: 250, align: "right" })
        .text(formatCurrency(totalPrice), 250, actualRow, { align: "right" });
}

const generateAggregatedInvoiceTable = (doc, totalPrice, monthGroups: MonthGroup[]) => {

    let actualRow = 370;

    generateTableRow(
        doc,
        actualRow,
        ["Měsíc", "Druh", "Množství", "Cena za j.", "Součet"]
    );

    actualRow += 15;
    generateHr(doc, actualRow, 3);
    actualRow += 2;
    monthGroups.forEach((group, index) => {
        let monthName = format(new Date(group.month + '-01'), 'MM/yyyy')
        actualRow += 2;
        group.items.forEach((item, index) => {

            if (index > 0) {
                monthName = '';
            }
            const priceLabel = item.unit === 'g' ? ' /100g' : ' /ks';
            generateTableRow(doc, actualRow, [monthName, item.name, item.quantity + " " + item.unit, formatCurrency(item.pricePer100) + priceLabel, formatCurrency(item.total)]);
            actualRow = actualRow + 10;
        });
        actualRow += 2;
        generateHr(doc, actualRow, 1);
    });
    generateHr(doc, actualRow, 2);
    actualRow += 20;
    doc
        .fontSize(15)
        .font('bold')
        .text('Celkem k úhradě:', 200, actualRow, { width: 250, align: "right" })
        .text(formatCurrency(totalPrice), 250, actualRow, { align: "right" });
}

function generateTableRow(
    doc,
    y: number,
    cols: string[]
) {
    doc
        .fontSize(10)
        .text(cols[0], 50, y)
        .text(cols[1], 150, y)
        .text(cols[2], 280, y)
        .text(cols[3], 380, y)
        .text(cols[4], 400, y,  { align: "right" });
}


function formatCurrency(value) {
    return (value).toFixed(2) + ' Kč';
}


function getInvoiceNum(startDate: Date, customer) {
    let monthString = (startDate.getMonth() + 1).toString();
    if (monthString.length === 1) {
        monthString = 0 + monthString;
    }
    let customerInvoiceId = customer.invoiceStaticId.toString();
    if (customerInvoiceId.length === 1) {
        customerInvoiceId = 0 + customerInvoiceId;
    }
    return startDate.getFullYear() + customerInvoiceId + monthString;
}
