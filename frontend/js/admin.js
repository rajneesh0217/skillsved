const loginForm = document.getElementById("adminLoginForm");
const adminKeyInput = document.getElementById("adminKey");
const loginStatus = document.getElementById("loginStatus");

const loginSection = document.querySelector(".admin-login");
const dashboard = document.getElementById("adminDashboard");
const enquiryCount = document.getElementById("enquiryCount");
const tableBody = document.getElementById("enquiriesTableBody");
const logoutButton = document.getElementById("logoutButton");

let activeAdminKey = "";


loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const adminKey = adminKeyInput.value.trim();

    if (!adminKey) {
        loginStatus.textContent = "Please enter the admin access key.";
        return;
    }

    loginStatus.textContent = "Signing in...";

    try {
        const response = await fetch("/api/admin/enquiries", {
            method: "GET",
            headers: {
                "X-Admin-Key": adminKey
            }
        });

        if (!response.ok) {
            if (response.status === 401) {
                throw new Error("Invalid admin access key.");
            }

            if (response.status === 503) {
                throw new Error("Admin access is not configured.");
            }

            throw new Error("Unable to sign in.");
        }

        const data = await response.json();

        activeAdminKey = adminKey;

        renderEnquiries(data.enquiries);

        loginSection.hidden = true;
        dashboard.hidden = false;

        loginStatus.textContent = "";

    } catch (error) {
        loginStatus.textContent = error.message;
    }
});


function renderEnquiries(enquiries) {
    tableBody.replaceChildren();

    enquiryCount.textContent = enquiries.length;

    enquiries.forEach((enquiry) => {
        const row = document.createElement("tr");

        addCell(row, enquiry.name);
addCell(row, enquiry.email);
addCell(row, enquiry.phone || "—");
addCell(row, enquiry.program || "—");
addCell(row, enquiry.profile || "—");
addCell(row, enquiry.city || "—");
addCell(row, enquiry.expectation || "—");
addCell(row, enquiry.message || "—");
addCell(row, formatDate(enquiry.created_at));

        tableBody.appendChild(row);
    });
}


function addCell(row, value) {
    const cell = document.createElement("td");
    cell.textContent = value;
    row.appendChild(cell);
}


function formatDate(value) {
    if (!value) {
        return "—";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleString();
}


logoutButton.addEventListener("click", () => {
    activeAdminKey = "";

    adminKeyInput.value = "";
    tableBody.replaceChildren();
    enquiryCount.textContent = "0";

    dashboard.hidden = true;
    loginSection.hidden = false;

    loginStatus.textContent = "";
    adminKeyInput.focus();
});