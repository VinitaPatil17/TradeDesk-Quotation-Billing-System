let editingProductId = null;

function toggleSidebar(){
    const sidebar = document.getElementById("sidebar");
    sidebar.classList.toggle("collapsed");
}
function openModal(){

    editingProductId = null; // NEW PRODUCT
    document.getElementById("productModal").style.display="flex";

    // clear fields
    document.getElementById("desc").value = "";
    document.getElementById("weight").value = "";
    document.getElementById("price").value = "";

}

function closeModal(){
    document.getElementById("productModal").style.display="none";
}

async function saveProduct(){

    const description = document.getElementById("desc").value;
    const weight = document.getElementById("weight").value;
    const price = document.getElementById("price").value;

    let url = "/api/add-product";

    if(editingProductId){
        url = "/api/update-product";
    }

    const response = await fetch(url, {
        method:"POST",
        headers:{
            "Content-Type":"application/json"
        },
        body: JSON.stringify({
            id: editingProductId,
            description,
            weight,
            price
        })
    });

    const data = await response.json();

    if(data.success){
        alert(editingProductId ? "Product Updated ✅" : "Product Saved ✅");
        closeModal();
        loadProducts();
    }
}

async function deleteProduct(id){

    const confirmDelete = confirm("Are you sure you want to delete this product?");

    if(!confirmDelete) return;

    const res = await fetch("/api/delete-product", {
        method:"POST",
        headers:{
            "Content-Type":"application/json"
        },
        body: JSON.stringify({ id })
    });

    const data = await res.json();

    if(data.success){
        alert("Product Deleted ✅");
        loadProducts();
    }
}

async function loadProducts(){

    const products = await (await fetch("/api/products")).json();

    const table = document.getElementById("productsBody");
    table.innerHTML = "";

    products.forEach(p => {

        let row = `
        <tr>

        <td>
            <input type="checkbox"
                class="row-checkbox"
                value="${p.id}"
                onchange="handleRowSelect()">
        </td>

        <td>${p.products_description}</td>

        <td>${p.weight}</td>

        <td>${p.unit_price}</td>

        <td class="action-cell" style="text-align: right;">

            <i class="fa-solid fa-ellipsis-vertical dots-btn"
               onclick="toggleMenu(event, ${p.id})"></i>

            <div class="action-menu" id="menu-${p.id}">
                <div onclick="editProduct(${p.id})">Edit</div>
                <div onclick="deleteProduct(${p.id})">Delete</div>
            </div>

        </td>

        </tr>
        `;

        table.innerHTML += row;

    });
}

function toggleSelectAll(master){

    const checkboxes = document.querySelectorAll(".row-checkbox");

    checkboxes.forEach(cb => {
        cb.checked = master.checked;
    });

    updateActionBar();
}

function handleRowSelect(){
    updateActionBar();
}

function updateActionBar(){

    const selected = document.querySelectorAll(".row-checkbox:checked");
    const actionBar = document.getElementById("actionBar");
    const count = document.getElementById("selectedCount");

    if(selected.length > 0){
        actionBar.style.display = "flex";
        count.innerText = selected.length + " selected";
    } else {
        actionBar.style.display = "none";
    }

    // 🔥 sync header checkbox
    const all = document.querySelectorAll(".row-checkbox");
    const selectAll = document.getElementById("selectAll");

    if(all.length === selected.length){
        selectAll.checked = true;
    } else {
        selectAll.checked = false;
    }
}

function clearSelection(){

    document.querySelectorAll(".row-checkbox").forEach(cb => {
        cb.checked = false;
    });

    document.getElementById("selectAll").checked = false;

    updateActionBar();
}

async function deleteSelected(){

    const selected = document.querySelectorAll(".row-checkbox:checked");

    if(selected.length === 0) return;

    const confirmDelete = confirm("Delete selected products?");

    if(!confirmDelete) return;

    const ids = [];

    selected.forEach(cb => {
        ids.push(cb.value);
    });

    const res = await fetch("/api/delete-multiple-products", {
        method:"POST",
        headers:{
            "Content-Type":"application/json"
        },
        body: JSON.stringify({ ids })
    });

    const data = await res.json();

    if(data.success){
        alert("Deleted Successfully ✅");
        loadProducts();
        clearSelection();
    }
}

function toggleMenu(e, id){
    e.stopPropagation();

    document.querySelectorAll(".action-menu").forEach(menu => {
        menu.style.display = "none";
    });

    const menu = document.getElementById(`menu-${id}`);
    menu.style.display = "block";
}

document.addEventListener("click", () => {
    document.querySelectorAll(".action-menu").forEach(menu => {
        menu.style.display = "none";
    });
});

async function editProduct(id){

    const res = await fetch(`/api/products/${id}`);
    const data = await res.json();

    const p = data.product;

    editingProductId = id;

    document.getElementById("desc").value = p.products_description;
    document.getElementById("weight").value = p.weight;
    document.getElementById("price").value = p.unit_price;

    document.getElementById("productModal").style.display="flex";
}

function searchProducts(){

    const input = document.getElementById("searchInput").value.toLowerCase();
    const rows = document.querySelectorAll("#productsBody tr");

    rows.forEach(row => {
        const description = row.children[0].textContent.toLowerCase();

        if(input === ""){
            row.style.backgroundColor = "";
        }else if(description.includes(input)){
            row.style.backgroundColor = "#fff3cd";
        }else{
            row.style.backgroundColor = "";
        }
    });
}

function openColumnModal(){
document.getElementById("columnModal").style.display="flex";
}

async function updateProductField(productId, field, value){

console.log("Updating product:", productId, field, value);

const res = await fetch("/api/update-product-field",{

method:"POST",

headers:{
"Content-Type":"application/json"
},

body:JSON.stringify({
productId,
field,
value
})

});

const data = await res.json();

if(!data.success){
alert("Error updating");
}

}

loadProducts();