const express = require("express");
const router = express.Router();
const db = require("../config/db");
const PDFDocument = require("pdfkit");


// ✅ ADD PRODUCT
router.post("/add-product", async (req, res) => {

    const { description, weight, price } = req.body;

    try {

        const result = await db.query(
            "INSERT INTO products (products_description, weight, unit_price) VALUES ($1,$2,$3) RETURNING id",
            [description, weight, price]
        );

        const productId = result.rows[0].id;

        res.json({ success: true });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false });
    }
});

router.get("/products", async (req,res)=>{

try{

const result = await db.query("SELECT * FROM products ORDER BY id DESC");
res.json(result.rows);

}catch(err){
console.log(err);
}

});

router.get("/products/:id", async (req, res) => {

    const { id } = req.params;

    const result = await db.query(
        "SELECT * FROM products WHERE id=$1",
        [id]
    );

    res.json({ product: result.rows[0] });
});

router.post("/update-product", async (req, res) => {

    const { id, description, weight, price } = req.body;

    await db.query(
        `UPDATE products
         SET products_description=$1, weight=$2, unit_price=$3
         WHERE id=$4`,
        [description, weight, price, id]
    );

    res.json({ success: true });
});

router.post("/delete-product", async (req, res) => {

    const { id } = req.body;

    await db.query(
        "DELETE FROM products WHERE id=$1",
        [id]
    );

    res.json({ success: true });
});

router.post("/delete-multiple-products", async (req, res) => {

    const { ids } = req.body;

    try {

        await db.query(
            `DELETE FROM products WHERE id = ANY($1::int[])`,
            [ids]
        );

        res.json({ success: true });

    } catch (err) {
        console.log(err);
        res.json({ success: false });
    }

});

// ADD LEDGER
router.post("/add-ledger", async (req,res)=>{

const { name, gst, state, city, phone } = req.body;

try{

await db.query(
"INSERT INTO ledgers(name, gst_no, state, city, phone) VALUES($1,$2,$3,$4,$5)",
[name, gst, state, city, phone]
);

res.json({success:true});

}catch(err){
console.log(err);
res.status(500).json({success:false});
}

});

// GET LEDGERS
router.get("/ledgers", async (req,res)=>{

try{

const result = await db.query("SELECT * FROM ledgers ORDER BY id DESC");
res.json(result.rows);

}catch(err){
console.log(err);
}

});

router.post("/update-ledger", async (req, res) => {

    const { id, name, gst, state, city, phone } = req.body;

    try {

        await db.query(
            `UPDATE ledgers 
             SET name=$1, gst_no=$2, state=$3, city=$4, phone=$5
             WHERE id=$6`,
            [name, gst, state, city, phone, id]
        );

        res.json({ success: true });

    } catch (err) {
        console.log(err);
        res.status(500).json({ success: false });
    }

});

// GET single ledger (for autofill)
router.get("/ledger/:id", async (req,res)=>{

const id = req.params.id;

try{

const result = await db.query(
"SELECT * FROM ledgers WHERE id=$1",
[id]
);

if(result.rows.length === 0){
return res.status(404).json({});
}

res.json(result.rows[0]);

}catch(err){
console.log(err);
res.status(500).json({});
}

});


// ✅ CREATE QUOTATION
router.post("/create-quotation", async (req, res) => {

    const {
        ledgerId,
        phone,
        place,
        date,
        products,
        otherCharges,
        grandTotal
    } = req.body;

    try {

        // 🔹 1. Insert quotation
        const result = await db.query(
            `INSERT INTO quotations 
            (ledger_id, phone, place, date, other_charges, grand_total) 
            VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
            [ledgerId, phone, place, date, otherCharges, grandTotal]
        );

        const quotationId = result.rows[0].id;

        // 🔹 2. Insert products
        for(let i = 0; i < products.length; i++){

            const item = products[i];

            await db.query(
                `INSERT INTO quotation_items
                (quotation_id, product_id, weight, qty, price, total)
                VALUES ($1,$2,$3,$4,$5,$6)`,
                [
                    quotationId,
                    item.productId,
                    item.weight,
                    item.qty,
                    item.price,
                    item.total
                ]
            );
        }

        res.json({ success: true, quotationId });

    } catch (err) {
        console.log(err);
        res.status(500).json({ success: false });
    }

});


router.get("/quotation-view/:id", async (req, res) => {

    const id = req.params.id;

    try {

        const q = await db.query(`
            SELECT q.*, l.name AS ledger_name
            FROM quotations q
            JOIN ledgers l ON q.ledger_id = l.id
            WHERE q.id=$1
        `, [id]);

        const items = await db.query(`
            SELECT qi.*, p.products_description
            FROM quotation_items qi
            JOIN products p ON qi.product_id = p.id
            WHERE qi.quotation_id=$1
        `, [id]);

        const user = await db.query(
            "SELECT company_name, address, gst_no, phone, email, include_company FROM users WHERE id = $1",
            [req.session.userId] // or your user id logic
        );

        res.render("quotationTemplate", {
            quotation: q.rows[0],
            items: items.rows,
            isDownload: false,
            company: user.rows[0] || {}
        });

    } catch (err) {
        console.log(err);
        res.send("Error loading quotation");
    }

});

router.get("/quotation-pdf/:id", async (req, res) => {

    const id = req.params.id;

    try {

        const q = await db.query(`
            SELECT q.*, l.name AS ledger_name
            FROM quotations q
            JOIN ledgers l ON q.ledger_id = l.id
            WHERE q.id = $1
        `, [id]);

        const items = await db.query(`
            SELECT qi.*, p.products_description
            FROM quotation_items qi
            JOIN products p ON qi.product_id = p.id
            WHERE qi.quotation_id = $1
        `, [id]);

        const user = await db.query(
            "SELECT company_name, address, gst_no, phone, email, include_company FROM users WHERE id = $1",
            [req.session.userId] // or your user id logic
        );

        res.render("quotationTemplate", {
            quotation: q.rows[0],
            items: items.rows,
            isDownload: true,
            company: user.rows[0] || {}
        });

    } catch (err) {
        console.log(err);
        res.status(500).send("Error generating PDF");
    }

});

// ✅ GET ALL QUOTATIONS
router.get("/quotations", async (req, res) => {

    try {

        const result = await db.query(`
            SELECT q.id, q.phone, q.place, q.date, q.grand_total, l.name AS ledger_name
            FROM quotations q
            JOIN ledgers l ON q.ledger_id = l.id
            ORDER BY q.id DESC
        `);

        res.json(result.rows);

    } catch (err) {
        console.log(err);
        res.status(500).json({ success: false });
    }

});


router.delete("/delete-quotation/:id", async (req, res) => {

    const id = req.params.id;

    try {

        // 🔹 First delete items (important - foreign key)
        await db.query(
            "DELETE FROM quotation_items WHERE quotation_id=$1",
            [id]
        );

        // 🔹 Then delete main quotation
        await db.query(
            "DELETE FROM quotations WHERE id=$1",
            [id]
        );

        res.json({ success: true });

    } catch (err) {
        console.log(err);
        res.status(500).json({ success: false });
    }

});

router.get("/quotation/:id", async (req, res) => {

    const id = req.params.id;

    try {

        const q = await db.query(`
            SELECT q.*, l.name AS ledger_name
            FROM quotations q
            JOIN ledgers l ON q.ledger_id = l.id
            WHERE q.id = $1
        `, [id]);

        const items = await db.query(`
            SELECT qi.*, p.products_description
            FROM quotation_items qi
            JOIN products p ON qi.product_id = p.id
            WHERE qi.quotation_id = $1
        `, [id]);

        res.json({
            quotation: q.rows[0],
            items: items.rows
        });

    } catch (err) {
        console.log(err);
        res.status(500).json({ success: false });
    }

});

router.put("/update-quotation/:id", async (req, res) => {

    const id = req.params.id;

    const {
        ledgerId,
        phone,
        place,
        date,
        products,
        otherCharges,
        grandTotal
    } = req.body;

    try {

        // 🔹 1. Update main quotation
        await db.query(
            `UPDATE quotations 
             SET ledger_id=$1, phone=$2, place=$3, date=$4, 
                 other_charges=$5, grand_total=$6
             WHERE id=$7`,
            [ledgerId, phone, place, date, otherCharges, grandTotal, id]
        );

        // 🔹 2. Delete old items
        await db.query(
            "DELETE FROM quotation_items WHERE quotation_id=$1",
            [id]
        );

        // 🔹 3. Insert new items
        for(let i = 0; i < products.length; i++){

            const item = products[i];

            await db.query(
                `INSERT INTO quotation_items
                (quotation_id, product_id, weight, qty, price, total)
                VALUES ($1,$2,$3,$4,$5,$6)`,
                [
                    id,
                    item.productId,
                    item.weight,
                    item.qty,
                    item.price,
                    item.total
                ]
            );
        }

        res.json({ success: true });

    } catch (err) {
        console.log(err);
        res.status(500).json({ success: false });
    }

});

router.post("/delete-multiple-ledgers", async (req, res) => {

    const { ids } = req.body;

    try {

        await db.query(
            "DELETE FROM ledgers WHERE id = ANY($1::int[])",
            [ids]
        );

        res.json({ success: true });

    } catch (err) {
        console.log(err);
        res.status(500).json({ success: false });
    }

});

module.exports = router;