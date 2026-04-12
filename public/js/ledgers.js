let selectedIds =[];
let editLedgerId = null;

function toggleSidebar(){
    const sidebar = document.getElementById("sidebar");
    sidebar.classList.toggle("collapsed");
}

function openModal(){

    editLedgerId = null; // 🔥 important

    document.getElementById("ledgerModal").style.display = "flex";

    // clear fields
    document.getElementById("name").value = "";
    document.getElementById("gst").value = "";
    document.getElementById("state").value = "";
    document.getElementById("city").value = "";
    document.getElementById("phone").value = "";

    loadStates(); // 🔥 important

    document.getElementById("city").innerHTML = `<option value="">Select City</option>`;

    // reset button text
    document.getElementById("saveLedgerBtn").innerText = "Create";
}

async function loadStates(){
    try{
        const res = await fetch("/api/states");
        const states = await res.json();

        const stateSelect = document.getElementById("state");

        stateSelect.innerHTML = `<option value="">Select State</option>`;

        states.forEach(s => {
            stateSelect.innerHTML += `
                <option value="${s.isoCode}">
                    ${s.name}
                </option>
            `;
        });

    }catch(err){
        console.log("Error loading states:", err);
    }
}

// async function loadCities(){

//     console.log("loadCities called 🔥"); // 👈 add this

//     const stateCode = document.getElementById("state").value;

//     if(!stateCode) return;

//     try{
//         const res = await fetch(`/api/cities/${stateCode}`);
//         const cities = await res.json();

//         const citySelect = document.getElementById("city");

//         citySelect.innerHTML = `<option value="">Select City</option>`;

//         if(!stateCode){
//     document.getElementById("city").innerHTML = `<option value="">Select State First</option>`;
//     return;
// }

//         cities.forEach(c => {
//             citySelect.innerHTML += `
//                 <option value="${c.name}">
//                     ${c.name}
//                 </option>
//             `;
//         });

//     }catch(err){
//         console.log("Error loading cities:", err);
//     }
// }

async function loadCities(){
    console.log("loadCities called 🔥"); // 👈 add this
    const stateCode = document.getElementById("state").value;

    if(!stateCode) return;

    try{
        const res = await fetch(`/api/cities/${stateCode}`);
        const cities = await res.json();

        console.log("Cities API response:", cities); // 👈 IMPORTANT

        const citySelect = document.getElementById("city");

        citySelect.innerHTML = `<option value="">Select City</option>`;

        cities.forEach(c => {
            citySelect.innerHTML += `
                <option value="${c.name}">
                    ${c.name}
                </option>
            `;
        });

    }catch(err){
        console.log("Error loading cities:", err);
    }
}

function validateGST(input){

    input.value = input.value
        .replace(/[^a-zA-Z0-9]/g, "") // remove special chars
        .toUpperCase(); // optional (GST usually uppercase)

    if(input.value.length > 14){
        input.value = input.value.slice(0, 14);
    }
}

function validatePhone(input){

    input.value = input.value.replace(/[^0-9]/g, "");

    if(input.value.length > 10){
        input.value = input.value.slice(0, 10);
    }
}

function closeModal(){
    document.getElementById("ledgerModal").style.display = "none";
}

async function saveLedger(){

    const name = document.getElementById("name").value;
    const gst = document.getElementById("gst").value;
    const state = document.getElementById("state").value;
    const city = document.getElementById("city").value;
    const phone = document.getElementById("phone").value;

    // 🔥 CHECK MODE
    if(editLedgerId){

        if(!name){
        alert("Ledger name is required");
        return;
    }

    // ✅ GST MUST BE EXACTLY 14
    if(gst && gst.length !== 14){
        alert("GST No must be exactly 14 characters");
        return;
    }

    // ✅ PHONE MUST BE EXACTLY 10 DIGITS
    if(phone && phone.length !== 10){
        alert("Phone number must be exactly 10 digits");
        return;
    }

        // 👉 EDIT MODE
        await fetch(" /api/update-ledger", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                id: editLedgerId,
                name,
                gst,
                state,
                city,
                phone
            })
        });

        alert("Ledger Updated ✅");

    }else{

        if(!name){
        alert("Ledger name is required");
        return;
    }

    // ✅ GST MUST BE EXACTLY 14
    if(gst && gst.length !== 14){
        alert("GST No must be exactly 14 characters");
        return;
    }

    // ✅ PHONE MUST BE EXACTLY 10 DIGITS
    if(phone && phone.length !== 10){
        alert("Phone number must be exactly 10 digits");
        return;
    }

        // 👉 CREATE MODE
        await fetch(" /api/add-ledger", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                name,
                gst,
                state,
                city,
                phone
            })
        });

        alert("Ledger Created ✅");
    }

    // 🔹 Reset state
    editLedgerId = null;

    // 🔹 Close modal
    closeModal();

    // 🔹 Refresh table
    loadLedgers();
}

// LOAD LEDGERS
async function loadLedgers(){

    const res = await fetch("/api/ledgers");
    const ledgers = await res.json();

    const table = document.getElementById("ledgerBody");
    table.innerHTML = "";

    ledgers.forEach(l => {

    table.innerHTML += `
    <tr>

    <td>
        <input type="checkbox" class="rowCheckbox" value="${l.id}" onclick="handleRowSelect()">
    </td>

    <td>${l.name}</td>
    <td>${l.gst_no || ""}</td>
    <td>${l.state || ""}</td>
    <td>${l.city || ""}</td>
    <td>${l.phone || ""}</td>

    <td class="action-cell">
        <div class="dots-btn" onclick="toggleMenu(this)">⋮</div>

        <div class="action-menu">
            <div onclick="editLedger(${l.id})">Edit</div>
            <div onclick="deleteLedger(${l.id})">Delete</div>
        </div>
    </td>

    </tr>
    `;
});

}

// SEARCH
function searchLedgers(){

    const input = document.getElementById("searchInput").value.toLowerCase();
    const rows = document.querySelectorAll("#ledgerBody tr");

    rows.forEach(row => {

        const name = row.children[1].textContent.toLowerCase();
        const phone = row.children[5].textContent.toLowerCase();
        const city = row.children[4].textContent.toLowerCase();
        const gst = row.children[2].textContent.toLowerCase();
        const state = row.children[3].textContent.toLowerCase(); 

        // 🔥 WHEN SEARCH IS EMPTY → RESET EVERYTHING
        if(input === ""){
            row.style.display = "";
            row.style.backgroundColor = "";

            // ❌ Uncheck checkbox
            const checkbox = row.querySelector(".rowCheckbox");
            if(checkbox){
                checkbox.checked = false;
            }

        }else if(name.includes(input) || phone.includes(input) || city.includes(input) || gst.includes(input) || state.includes(input)){

            row.style.display = "";
            row.style.backgroundColor = "#fff3cd";

        }else{
            row.style.display = "none";
        }

    });

    // 🔥 ALSO CLEAR GLOBAL SELECTION
    if(input === ""){
        selectedIds = [];
        updateActionBar();

        const selectAll = document.getElementById("selectAll");
        if(selectAll) selectAll.checked = false;
    }
}

async function updateLedgerField(id, field, value){

    console.log("Updating Ledger:", id, field, value);

    const res = await fetch("/api/update-ledger-field",{

        method:"POST",

        headers:{
            "Content-Type":"application/json"
        },

        body:JSON.stringify({
            id,
            field,
            value
        })

    });

    const data = await res.json();

    if(!data.success){
        alert("Error updating");
    }
}

async function fillLedgerDetails(){

    const ledgerId = document.getElementById("ledgerSelect").value;

    if(!ledgerId) return;

    try{

        const res = await fetch(`/api/ledger/${ledgerId}`);
        const data = await res.json();

        console.log("Ledger Data:", data); // 🔥 DEBUG

        document.getElementById("phone").value = data.phone || "";
        document.getElementById("place").value = data.city || "";

    }catch(err){
        console.log("Error fetching ledger:", err);
    }
}

function handleRowSelect(){

    const checkboxes = document.querySelectorAll(".rowCheckbox");

    selectedIds = [];

    checkboxes.forEach(cb => {
        if(cb.checked){
            selectedIds.push(cb.value);
        }
    });
    console.log("Selected IDs:", selectedIds);
    updateSelectAllState();
    updateActionBar();
    console.log("Selected IDs:", selectedIds);
}

function toggleSelectAll(masterCheckbox){

    const checkboxes = document.querySelectorAll(".rowCheckbox");

    selectedIds = [];

    checkboxes.forEach(cb => {
        cb.checked = masterCheckbox.checked;

        if(masterCheckbox.checked){
            selectedIds.push(cb.value);
        }
    });

    updateActionBar();
}

function updateSelectAllState(){

    const checkboxes = document.querySelectorAll(".rowCheckbox");
    const selectAll = document.getElementById("selectAll");

    const total = checkboxes.length;
    const checked = document.querySelectorAll(".rowCheckbox:checked").length;

    selectAll.checked = (total === checked);
}

function updateActionBar(){

    const bar = document.getElementById("actionBar");
    const countText = document.getElementById("selectedCount");

    if(selectedIds.length > 0){
        bar.style.display = "flex";
        countText.innerText = `${selectedIds.length} selected`;
    }else{
        bar.style.display = "none";
    }
}

function clearSelection(){

    selectedIds = [];

    document.querySelectorAll(".rowCheckbox").forEach(cb => {
        cb.checked = false;
    });

    document.getElementById("selectAll").checked = false;

    updateActionBar();
}

async function bulkDelete(){

    if(selectedIds.length === 0){
        alert("No rows selected");
        return;
    }

    const confirmDelete = confirm("Delete selected items?");

    if(!confirmDelete) return;

    try{

        const res = await fetch("/api/delete-multiple-ledgers",{
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ ids: selectedIds })
        });

        const data = await res.json();

        if(data.success){
            alert("Deleted successfully ✅");

            clearSelection();
            loadLedgers(); // 🔥 refresh table
        }

    }catch(err){
        console.log(err);
        alert("Error deleting ❌");
    }
}

function toggleMenu(btn){

    document.querySelectorAll(".action-menu").forEach(menu => {
        menu.style.display = "none";
    });

    const menu = btn.nextElementSibling;
    menu.style.display = "block";
}

document.addEventListener("click", function(e){
    if(!e.target.classList.contains("dots-btn")){
        document.querySelectorAll(".action-menu").forEach(menu => {
            menu.style.display = "none";
        });
    }
});

async function editLedger(id){

    editLedgerId = id;

    // 🔹 Fetch ledger data
    const res = await fetch(`/api/ledger/${id}`);
    const data = await res.json();

    // 🔹 Open modal
    document.getElementById("ledgerModal").style.display = "flex";

    // 🔹 Prefill fields
    document.getElementById("name").value = data.name || "";
    document.getElementById("gst").value = data.gst_no || "";
    document.getElementById("state").value = data.state || "";
    await loadCities(); // 🔥 load cities after setting state
    document.getElementById("city").value = data.city || "";
    document.getElementById("phone").value = data.phone || "";

    // 🔹 Change button text
    document.getElementById("saveLedgerBtn").innerText = "Save";

}

loadLedgers();