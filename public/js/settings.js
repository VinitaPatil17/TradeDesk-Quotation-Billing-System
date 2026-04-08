document.getElementById("saveBtn").addEventListener("click", saveSettings);

function toggleSidebar(){
const sidebar = document.getElementById("sidebar");
sidebar.classList.toggle("collapsed");
}

function enableEdit(){
    document.querySelectorAll(".settings-grid input")
        .forEach(input => input.disabled = false);
}

function cancelEdit(){
    document.querySelectorAll(".settings-grid input")
        .forEach(input => input.disabled = true);
}

async function loadUserSettings(){

    try {
        const res = await fetch("/api/user-data");
        const data = await res.json();

        if(data.success){

            document.getElementById("companyName").value = data.user.company_name || "";
            document.getElementById("gst").value = data.user.gst_no || "";
            document.getElementById("setEmail").value = data.user.email || "";
            document.getElementById("phone").value = data.user.phone || "";
            document.getElementById("address").value = data.user.address || "";

            // toggles (default false if not present)
            const includeToggle = document.getElementById("includeCompanyToggle");

if(includeToggle){
    includeToggle.checked = data.user.include_company || false;
}
        }

    } catch(err){
        console.log("Error loading settings:", err);
    }

}

// async function saveSettings(){

//     const company = document.getElementById("company").value;
//     const gst = document.getElementById("gst").value;
//     const phone = document.getElementById("phone").value;

//     const includeDetails = document.getElementById("includeDetails").checked;
//     const darkMode = document.getElementById("darkMode").checked;

//     try {

//         const res = await fetch("/api/update-user", {
//             method: "POST",
//             headers: {
//                 "Content-Type": "application/json"
//             },
//             body: JSON.stringify({
//                 company,
//                 gst,
//                 phone,
//                 includeDetails,
//                 darkMode
//             })
//         });

//         const data = await res.json();

//         if(data.success){
//             alert("Settings Saved ✅");
//         } else {
//             alert(data.message);
//         }

//     } catch(err){
//         console.log("Save error:", err);
//     }
// }

async function saveSettings() {

    console.log("SAVE BUTTON CLICKED 🔥"); // debug

    const company = document.getElementById("companyName").value;
    const gst = document.getElementById("gst").value;
    const phone = document.getElementById("phone").value;
    const address = document.getElementById("address").value;

    const includeCompany = document.getElementById("includeCompanyToggle").checked;
    try {

        const res = await fetch("/api/settings/update", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                company,
                gst,
                phone,
                address,
                includeCompany
            })
        });

        const data = await res.json();

        console.log("Saving:", {
    includeCompany
});

        if (data.success) {
            alert("Settings saved successfully ✅");
        } else {
            alert(data.message);
        }

    } catch (err) {
        console.log("Save error:", err);
    }
}

loadUserSettings();
