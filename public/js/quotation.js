let editingQuotationId = null;
let selectedQuotationId = null;
let productsList = [];
let stateMap = {};

function toggleSidebar(){
    const sidebar = document.getElementById("sidebar");
    sidebar.classList.toggle("collapsed");
}

async function openModal(){

    editingQuotationId = null; // 🔹 Create mode

    await loadStates();
    await loadLedgers();
    await loadProductsList();

    document.getElementById("quotationModal").style.display = "flex";

    setTodayDate();

    // 🔥 Clear previous data
    document.getElementById("ledgerSelect").value = "";
    document.getElementById("phone").value = "";
    document.getElementById("place").value = "";
    document.getElementById("state").value = "";
document.getElementById("gst").value = "";
    document.getElementById("otherCharges").value = "";
    document.getElementById("grandTotal").innerText = "0";

    document.getElementById("quotationProductsBody").innerHTML = "";

    // 🔥 Set button text
    document.querySelector(".create-btn").innerText = "Create";

}

function closeModal(){
    document.getElementById("quotationModal").style.display = "none";
}

function openProductModalFromQuotation(){
    document.getElementById("productModal").style.display = "flex";

    // clear fields
    document.getElementById("desc").value = "";
    document.getElementById("weight").value = "";
    document.getElementById("price").value = "";
}

function closeProductModal(){
    document.getElementById("productModal").style.display = "none";
}

// ✅ Set today's date
function setTodayDate(){
    const today = new Date().toISOString().split("T")[0];
    document.getElementById("date").value = today;
}

// ✅ Load ledgers into dropdown
async function loadLedgers(){

    try{

        const res = await fetch("/api/ledgers");
        const ledgers = await res.json();

        console.log("Ledgers Loaded:", ledgers);

        const select = document.getElementById("ledgerSelect");

        select.innerHTML = `<option value="">Select Ledger</option>`;

        ledgers.forEach(l => {
            select.innerHTML += `
                <option value="${l.id}">${l.name}</option>
            `;
        });

        return ledgers;

    }catch(err){
        console.log("Ledger Error:", err);
        return [];
    }
}

async function loadStates(){
    try{
        const res = await fetch("/api/states");
        const states = await res.json();

        stateMap = {};

        states.forEach(s => {
            stateMap[s.isoCode] = s.name;
        });

    }catch(err){
        console.log("Error loading states:", err);
    }
}

function searchQuotations(){

    const input = document.getElementById("searchInput").value.toLowerCase();
    const rows = document.querySelectorAll("#quotationBody tr");

    rows.forEach(row => {

        const ledger = row.children[0].textContent.toLowerCase();
        const phone = row.children[1].textContent.toLowerCase();
        const place = row.children[2].textContent.toLowerCase();
        const date = row.children[3].textContent.toLowerCase();

        if(input === ""){
            row.style.display = "";
            row.style.backgroundColor = "";
        }
        else if(
            ledger.includes(input) ||
            phone.includes(input) ||
            place.includes(input) ||
            date.includes(input)
        ){
            row.style.display = "";
            row.style.backgroundColor = "#fff3cd"; // highlight
        }
        else{
            row.style.display = "none";
        }

    });
}

// ✅ Auto-fill phone & place
async function fillLedgerDetails(){

    const ledgerId = document.getElementById("ledgerSelect").value;

    if(!ledgerId) return;

    const res = await fetch(`/api/ledger/${ledgerId}`);
    const data = await res.json();

    document.getElementById("phone").value = data.phone || "";
document.getElementById("place").value = data.city || "";
document.getElementById("gst").value = data.gst_no || "";
document.getElementById("state").value = stateMap[data.state] || data.state || "";
}
async function loadProductsList(){
    try{
        const res = await fetch("/api/products");
        const data = await res.json();

        productsList = data; // 🔥 IMPORTANT

        console.log("Loaded Products:", productsList);

    }catch(err){
        console.log("Error loading products:", err);
    }
}
function handleSubmit(){

    if(editingQuotationId){
        updateQuotation(); // 🔥 Edit mode
    } else {
        createQuotation(); // 🔥 Create mode
    }

}
function addRow(){

    const tbody = document.getElementById("quotationProductsBody");

    let options = `<option value="">Select Product</option>`;

    productsList.forEach(p => {
        options += `<option value="${p.id}">
            ${p.products_description}
        </option>`;
    });

    const row = document.createElement("tr");

    row.innerHTML = `
    <td>
        <select onchange="onProductSelect(this)">
            ${options}
        </select>
    </td>

    <td>
    <input type="number" class="weight" min="0" step="0.01"
        oninput="calculateRow(this)">
</td>

    <td>
        <input type="number" min="1" value="1" oninput="calculateRow(this)">
    </td>

    <td>
        <input type="number" class="price" min="0" step="0.01"
            oninput="calculateRow(this)">
    </td>

    <td class="total">0</td>

    <td>
        <button onclick="removeRow(this)">X</button>
    </td>
    `;

    tbody.appendChild(row);
    console.log("Products Lists:", productsList);
}

async function saveProductFromQuotation(){

    const description = document.getElementById("desc").value;
    const weight = document.getElementById("weight").value;
    const price = document.getElementById("price").value;

    if(!description){
        alert("Enter product description");
        return;
    }

    try{

        const res = await fetch("/api/add-product", {
            method: "POST",
            headers: {
                "Content-Type":"application/json"
            },
            body: JSON.stringify({
                description,
                weight,
                price
            })
        });

        const data = await res.json();

        if(data.success){

            alert("Product Created ✅");

            closeProductModal();

            // 🔥 RELOAD PRODUCT LIST
            await loadProductsList();

            // 🔥 OPTIONAL: Auto-select newly added product (advanced later)

        }

    }catch(err){
        console.log(err);
        alert("Error saving product ❌");
    }
}

function onProductSelect(select){

    const productId = select.value;

    const product = productsList.find(p => p.id == productId);

    const row = select.closest("tr");

    if(product){

        row.querySelector(".weight").value = product.weight;
        row.querySelector(".price").value = product.unit_price;

        calculateRow(select);
    }
}
function calculateRow(element){

    const row = element.closest("tr");

    // const qty = row.querySelector("input").value;

    const qty = row.querySelector("input[type='number']").value;
    const price = row.querySelector(".price").value;

    const total =  parseFloat((qty * price).toFixed(2));
   

    row.querySelector(".total").innerText = total;

    calculateGrandTotal();
}
function calculateGrandTotal(){

    let sum = 0;

    document.querySelectorAll(".total").forEach(cell => {
        sum += Number(cell.innerText) || 0;
    });

    const other = Number(document.getElementById("otherCharges").value) || 0;

    // document.getElementById("grandTotal").innerText = sum + other;

    const grandTotal = sum + other;

    document.getElementById("grandTotal").innerText = Math.round(grandTotal);
}
function removeRow(btn){
    btn.closest("tr").remove();
    calculateGrandTotal();
}

async function createQuotation(){

    // 🔹 BASIC DETAILS
    const ledgerId = document.getElementById("ledgerSelect").value;
    const phone = document.getElementById("phone").value;
    const place = document.getElementById("place").value;
    const date = document.getElementById("date").value;

    // 🔹 VALIDATION (IMPORTANT)
    if(!ledgerId){
        alert("Please select a ledger");
        return;
    }

    // 🔹 PRODUCTS DATA
    const rows = document.querySelectorAll("#quotationProductsBody tr");
    console.log("TOTAL ROWS:", rows.length);

    let products = [];

    rows.forEach(row => {

    const productId = row.querySelector("select").value;
    const weight = row.querySelector(".weight").value;
    const qty = row.querySelector("input").value;
    const price = row.querySelector(".price").value;
    const total = row.querySelector(".total").innerText;

    console.log("ROW DATA:", {
        productId,
        weight,
        qty,
        price,
        total
    });

    if(productId){
        products.push({
            productId: Number(productId),
            weight: Number(weight),
            qty: Number(qty),
            price: Number(price),
            total: Number(total)
        });
    }

});

console.log("FINAL PRODUCTS:", products);

    // 🔹 OTHER CHARGES & GRAND TOTAL
    const otherCharges = document.getElementById("otherCharges").value || 0;
    const grandTotal = document.getElementById("grandTotal").innerText;

    // 🔹 FINAL OBJECT
    const quotationData = {
        ledgerId,
        phone,
        place,
        date,
        products,
        otherCharges,
        grandTotal
    };

    try{

    const response = await fetch("/api/create-quotation",{
        method:"POST",
        headers:{
            "Content-Type":"application/json"
        },
        body: JSON.stringify(quotationData)
    });

    const data = await response.json();

    if(data.success){

    alert("Quotation Saved ✅");

    // 🔹 Close modal first
    closeModal();

    // 🔹 Refresh table without reload
    await loadQuotations();

    // 🔹 THEN open quotation (optional)
    setTimeout(() => {
        window.open(`/api/quotation-view/${data.quotationId}`, "_blank");
    }, 300);
}

}catch(err){
    console.log(err);
    alert("Error saving quotation ❌");
}
}

async function loadQuotations(){

    try{

        const res = await fetch("/api/quotations");
        const data = await res.json();

        const tbody = document.getElementById("quotationBody");

        tbody.innerHTML = "";



data.forEach(q => {

    const isSelected = q.id == selectedQuotationId;

    tbody.innerHTML += `
<tr class="${isSelected ? 'highlight-row' : ''}" data-id="${q.id}">
    <td>${q.ledger_name}</td>
    <td>${q.phone}</td>
    <td>${q.place}</td>

   <td>${new Date(q.date).toLocaleDateString("en-IN")}</td>

    <td class="action-cell" style="text-align: right; padding-right: 40px;" >
        <div class="dots-btn" onclick="toggleMenu(this)">
            <i class="fa-solid fa-ellipsis-vertical"></i>
        </div>

        <div class="action-menu">
            <div onclick="viewQuotation(${q.id}); event.stopPropagation();" style="text-align: left; console.log('View clicked:', ${q.id})">View</div>
            <div onclick="downloadQuotation(${q.id})" style="text-align: left;" >Download</div>
            <div onclick="editQuotation(${q.id})" style="text-align: left;" >Edit</div>
            <div onclick="deleteQuotation(${q.id})" style="text-align: left;" >Delete</div>
        </div>
    </td>
</tr>
`;
});

// 🔥 AUTO SCROLL
if(selectedQuotationId){

    setTimeout(() => {
        const row = document.querySelector(`tr[data-id="${selectedQuotationId}"]`);

        if(row){
            row.scrollIntoView({
                behavior: "smooth",
                block: "center"
            });
        }
    }, 200);
}

    }catch(err){
        console.log("Error loading quotations:", err);
    }

}

function toggleMenu(btn){

    const allMenus = document.querySelectorAll(".action-menu");

    allMenus.forEach(menu => {
        if(menu !== btn.nextElementSibling){
            menu.style.display = "none";
        }
    });

    const menu = btn.nextElementSibling;

    menu.style.display = (menu.style.display === "block") ? "none" : "block";
}

// close menu when clicking outside
document.addEventListener("click", function(e){

    if(!e.target.classList.contains("dots-btn")){
        document.querySelectorAll(".action-menu").forEach(menu => {
            menu.style.display = "none";
        });
    }

});

function viewQuotation(id){
    console.log("View Clicked ", id);
    window.open(`/api/quotation-view/${id}`, "_blank");
}

function downloadQuotation(id){
    window.open(`/api/quotation-pdf/${id}`,"_blank");
}

async function editQuotation(id){

    editingQuotationId = id;

    await loadLedgers();
    await loadProductsList();

    const res = await fetch(`/api/quotation/${id}`);
    const data = await res.json();

    const q = data.quotation;
    const items = data.items;

    // 🔥 OPEN MODAL
    document.getElementById("quotationModal").style.display = "flex";

    // 🔥 CHANGE BUTTON
    document.querySelector(".create-btn").innerText = "Save";

    // 🔹 PREFILL BASIC DATA
    document.getElementById("ledgerSelect").value = q.ledger_id;
    document.getElementById("phone").value = q.phone;
    document.getElementById("place").value = q.place;
    document.getElementById("date").value = q.date.split("T")[0];

    document.getElementById("otherCharges").value = q.other_charges;

    // ✅ ✅ ✅ ADD THIS BLOCK RIGHT HERE 👇
    const ledgerRes = await fetch(`/api/ledger/${q.ledger_id}`);
    const ledgerData = await ledgerRes.json();

    document.getElementById("gst").value = ledgerData.gst_no || "";
    document.getElementById("state").value = stateMap[ledgerData.state] || ledgerData.state || "";
    // ✅ ✅ ✅ END HERE

    // 🔹 CLEAR OLD ROWS
    const tbody = document.getElementById("quotationProductsBody");
    tbody.innerHTML = "";

    // 🔹 ADD ROWS
    items.forEach(item => {

        let options = `<option value="">Select Product</option>`;

        productsList.forEach(p => {
            options += `<option value="${p.id}" ${p.id == item.product_id ? "selected" : ""}>
                ${p.products_description}
            </option>`;
        });

        const row = document.createElement("tr");

        row.innerHTML = `
        <td>
            <select onchange="onProductSelect(this)">
                ${options}
            </select>
        </td>

        <td>
    <input type="number" class="weight" value="${item.weight}"
        oninput="calculateRow(this)">
</td>

        <td>
            <input type="number" value="${item.qty}" oninput="calculateRow(this)">
        </td>

        <td>
    <input type="number" class="price" value="${item.price}" 
        oninput="calculateRow(this)">
</td>

        <td class="total">${item.total}</td>

        <td>
            <button onclick="removeRow(this)">X</button>
        </td>
        `;

        tbody.appendChild(row);

    });

    document.querySelectorAll("#quotationProductsBody tr").forEach(row => {
    calculateRow(row.querySelector("input"));
});

    // 🔥 RECALCULATE TOTAL
    calculateGrandTotal();

}
async function deleteQuotation(id){

    const confirmDelete = confirm("Are you sure you want to delete this quotation?");

    if(!confirmDelete) return;

    try{

        const res = await fetch(`/api/delete-quotation/${id}`, {
            method: "DELETE"
        });

        const data = await res.json();

        if(data.success){
            alert("Deleted successfully ✅");
            loadQuotations(); // refresh table
        }

    }catch(err){
        console.log(err);
        alert("Error deleting ❌");
    }

}

async function updateQuotation(){

    // 🔹 BASIC DETAILS
    const ledgerId = document.getElementById("ledgerSelect").value;
    const phone = document.getElementById("phone").value;
    const place = document.getElementById("place").value;
    const date = document.getElementById("date").value;

    if(!ledgerId){
        alert("Please select a ledger");
        return;
    }

    // 🔹 PRODUCTS
    const rows = document.querySelectorAll("#quotationProductsBody tr");

    let products = [];

    rows.forEach(row => {

        const productId = row.querySelector("select").value;
        const weight = row.querySelector(".weight").value;
        const qty = row.querySelector("input").value;
        const price = row.querySelector(".price").value;
        const total = row.querySelector(".total").innerText;

        if(productId){
            products.push({
                productId : Number(productId),
                weight,
                qty,
                price,
                total
            });
        }

    });

    const otherCharges = document.getElementById("otherCharges").value || 0;
    const grandTotal = document.getElementById("grandTotal").innerText;

    const updatedData = {
        ledgerId,
        phone,
        place,
        date,
        products,
        otherCharges,
        grandTotal
    };

    try{

        const res = await fetch(`/api/update-quotation/${editingQuotationId}`,{
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(updatedData)
        });

        const data = await res.json();

        if(data.success){
            alert("Updated successfully ✅");

            closeModal();
            loadQuotations();
        }

    }catch(err){
        console.log(err);
        alert("Error updating ❌");
    }

}

function getQuotationIdFromURL(){

    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");

    if(id){
        selectedQuotationId = id;
    }
}

async function loadCompanyInfo(){

    try{
        const res = await fetch("/api/company-info", {
            credentials: "include"
        });
        const data = await res.json();

        const container = document.getElementById("companyBlock");

        if(data.includeCompany){

            const u = data.user;

            container.innerHTML = `
                <h3>${u.company_name}</h3>
                <p>${u.address || ""}</p>
                <p>GST: ${u.gst_no}</p>
                <p>Phone: ${u.phone}</p>
                <p>Email: ${u.email}</p>
            `;

            container.style.display = "block";

        } else {
            container.style.display = "none";
        }

    }catch(err){
        console.log("Error loading company info:", err);
    }
}

loadCompanyInfo();
getQuotationIdFromURL();
loadQuotations();
loadProductsList();