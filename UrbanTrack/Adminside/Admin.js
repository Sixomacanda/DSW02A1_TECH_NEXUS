// ==============================
// SAMPLE DATA (replace with backend later)
// ==============================
const issues = [
    { id: 1, location: "Braamfontein", category: "Road", status: "pending", upvotes: 12 },
    { id: 2, location: "Soweto", category: "Water", status: "in-progress", upvotes: 5 },
    { id: 3, location: "Sandton", category: "Electricity", status: "resolved", upvotes: 20 },
    { id: 4, location: "Midrand", category: "Road", status: "pending", upvotes: 8 }
];

// ==============================
// LOAD DASHBOARD ON START
// ==============================
document.addEventListener("DOMContentLoaded", () => {
    loadStats();
    loadTable();
    loadChart();
    setupSidebar();
});

// ==============================
// STATS CARDS
// ==============================
function loadStats() {
    const total = issues.length;
    const pending = issues.filter(i => i.status === "pending").length;
    const inProgress = issues.filter(i => i.status === "in-progress").length;
    const resolved = issues.filter(i => i.status === "resolved").length;

    document.getElementById("totalIssues").textContent = total;
    document.getElementById("pendingIssues").textContent = pending;
    document.getElementById("inProgressIssues").textContent = inProgress;
    document.getElementById("resolvedIssues").textContent = resolved;
}

// ==============================
// TABLE RENDERING
// ==============================
function loadTable() {
    const table = document.getElementById("adminIssuesTable");
    table.innerHTML = "";

    issues.forEach(issue => {
        const row = document.createElement("tr");

        row.innerHTML = `
            <td>#${issue.id}</td>
            <td>${issue.location}</td>
            <td>${issue.category}</td>
            <td>
                <select class="status-select ${issue.status}" onchange="updateStatus(${issue.id}, this.value)">
                    <option value="pending" ${issue.status === "pending" ? "selected" : ""}>Pending</option>
                    <option value="in-progress" ${issue.status === "in-progress" ? "selected" : ""}>In Progress</option>
                    <option value="resolved" ${issue.status === "resolved" ? "selected" : ""}>Resolved</option>
                </select>
            </td>
            <td>${issue.upvotes}</td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn edit" onclick="editIssue(${issue.id})">✏️</button>
                    <button class="action-btn delete" onclick="deleteIssue(${issue.id})">🗑️</button>
                </div>
            </td>
        `;

        table.appendChild(row);
    });
}

// ==============================
// UPDATE STATUS
// ==============================
function updateStatus(id, newStatus) {
    const issue = issues.find(i => i.id === id);
    if (issue) {
        issue.status = newStatus;
        loadStats();
        loadTable();
    }
}

// ==============================
// DELETE ISSUE
// ==============================
function deleteIssue(id) {
    const index = issues.findIndex(i => i.id === id);
    if (index !== -1) {
        issues.splice(index, 1);
        loadStats();
        loadTable();
        loadChart();
    }
}

// ==============================
// EDIT ISSUE (simple alert for now)
// ==============================
function editIssue(id) {
    const issue = issues.find(i => i.id === id);
    alert(`Edit Issue:\nLocation: ${issue.location}\nCategory: ${issue.category}`);
}

// ==============================
// SIMPLE BAR CHART
// ==============================
function loadChart() {
    const chart = document.getElementById("weeklyChart");
    chart.innerHTML = "";

    const weeklyData = {
        Mon: 2,
        Tue: 5,
        Wed: 3,
        Thu: 7,
        Fri: 4,
        Sat: 6,
        Sun: 2
    };

    const max = Math.max(...Object.values(weeklyData));

    Object.entries(weeklyData).forEach(([day, value]) => {
        const bar = document.createElement("div");
        bar.className = "bar";
        bar.style.height = `${(value / max) * 100}%`;

        bar.innerHTML = `
            <div class="bar-tooltip">${value}</div>
            <div class="bar-label">${day}</div>
        `;

        chart.appendChild(bar);
    });
}

// ==============================
// SIDEBAR NAVIGATION
// ==============================
function setupSidebar() {
    const links = document.querySelectorAll(".sidebar-link");

    links.forEach(link => {
        link.addEventListener("click", () => {
            links.forEach(l => l.classList.remove("active"));
            link.classList.add("active");

            const page = link.dataset.page;
            console.log("Switched to:", page);

            // You can later show/hide sections here
        });
    });
}