function goToLogin(){
window.location.href = "/login.html";
}
function goBack(){
window.location.href = "/welcome.html";
}
function goToLogin(){
window.location.href = "/login.html";
}

function goToOTP(){
window.location.href = "/otp-verification.html";
}
function goToForgotEmail(){
window.location.href = "/forgot-email.html";
}

function goToReset(){
window.location.href = "/reset-password.html";
}

function sendOTP(){
alert("OTP sent to your email (demo)");
}
function resetPassword(){
alert("Password reset successful!");
window.location.href = "/login.html";
}
function toggleSidebar(){
const sidebar = document.getElementById("sidebar");
 sidebar.classList.toggle("collapsed");
// sidebar.classList.toggle("active");
}

async function register(){

    const company = document.getElementById("company").value;
    const gst = document.getElementById("gst").value;
    const phone = document.getElementById("phone").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    const res = await fetch("/api/register", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            company,
            gst,
            phone,
            email,
            password
        })
    });

    const data = await res.json();

    if(data.success){
        alert("Registered Successfully ✅");
        window.location.href = "/login.html";
    } else {
        alert(data.message);
    }
}

async function loginUser(){
    console.log("Login button clicked");

    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");

    if(!emailInput || !passwordInput){
        console.log("Inputs not found ❌");
        return;
    }

    const email = emailInput.value;
    const password = passwordInput.value;

    console.log("Email:", email);
    console.log("Password:", password);

    try {

        const res = await fetch("/api/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();

        console.log("Response:", data);

        if(data.success){
            alert("Login Successful ✅");
            window.location.href = "/dashboard";
        } else {
            alert(data.message);
        }

    } catch (err) {
        console.log("Fetch error:", err);
    }
}

function logoutUser(){
    window.location.href = "/api/logout";
}

function toggleProfileMenu(){

    const menu = document.getElementById("profileDropdown");

    if(menu.style.display === "block"){
        menu.style.display = "none";
    } else {
        menu.style.display = "block";
    }
}

document.addEventListener("click", function(e){

    const wrapper = document.querySelector(".profile-wrapper");

    if(!wrapper.contains(e.target)){
        document.getElementById("profileDropdown").style.display = "none";
    }

});

function openProfileModal(){
    document.getElementById("profileDropdown").style.display = "none";

    document.getElementById("profileModal").style.display = "flex";

    loadProfileData(); // 🔥 fetch data
}

function closeProfileModal(){
    document.getElementById("profileModal").style.display = "none";
}

async function loadProfileData(){

    try{
        const res = await fetch("/api/profile");
        const data = await res.json();

        if(data.success){

            document.getElementById("profileCompany").value = data.user.company_name;
            document.getElementById("profileGST").value = data.user.gst_no;
            document.getElementById("profileEmail").value = data.user.email;
            document.getElementById("profilePhone").value = data.user.phone;

        }

    }catch(err){
        console.log("Profile load error:", err);
    }

}

function confirmLogout(){
   console.log("Logout clicked ✅");

    const modal = document.getElementById("logoutModal");
    console.log("Modal element:", modal);

    if(modal){
        modal.style.display = "flex";
    } else {
        console.log("Modal not found ❌");
    }
}

window.addEventListener("click", function(e){
    const wrapper = document.querySelector(".profile-wrapper");
    const dropdown = document.getElementById("profileDropdown");

    if(wrapper && !wrapper.contains(e.target)){
        dropdown.style.display = "none";
    }
});

function closeLogoutModal(){
    document.getElementById("logoutModal").style.display = "none";
}

async function loadRecentQuotations(){

    try{
        const res = await fetch("/api/quotations");
        const data = await res.json();

        const tbody = document.getElementById("recentQuotationBody");

        tbody.innerHTML = "";

        // 🔥 take only latest 5
        const recent = data.slice(0, 5);

        recent.forEach(q => {

            tbody.innerHTML += `
                <tr onclick="goToQuotation(${q.id})" style="cursor:pointer" >
                    <td>Q${q.id}</td>
                    <td>${q.ledger_name}</td>
                    <td>${new Date(q.date).toLocaleDateString()}</td>
                    <td>${q.place}</td>
                </tr>
            `;
        });

    }catch(err){
        console.log("Error loading quotations:", err);
    }
}
function goToQuotation(id){
    window.location.href = `/quotation?id=${id}`;
}

function setLastUpdated(){

    const now = new Date();

    const formatted = now.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });

    document.getElementById("lastUpdated").innerText = 
        "Last Updated: " + formatted;
}

async function loadHeaderCompany(){

    try{
        const res = await fetch("/api/profile");
        const data = await res.json();

        if(data.success){
            document.getElementById("companyName").innerText =
                data.user.company_name;
        }

    }catch(err){
        console.log("Header load error:", err);
    }
}

loadRecentQuotations();
setLastUpdated();
loadHeaderCompany();