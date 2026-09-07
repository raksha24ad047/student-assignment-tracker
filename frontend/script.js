// Store assignments in an array

let assignments = [];
async function loadAssignments() {

    const response =
        await fetch("http://localhost:5000/api/assignments");

    const data =
        await response.json();

    assignments = data;

    displayAssignments(assignments);
    updateDashboard();
}


// Get HTML elements

const assignmentForm = document.getElementById("assignmentForm");

const assignmentList = document.getElementById("assignmentList");

const totalAssignments =
    document.getElementById("totalAssignments");

const pendingAssignments =
    document.getElementById("pendingAssignments");

const completedAssignments =
    document.getElementById("completedAssignments");

const dueSoonAssignments =
    document.getElementById("dueSoonAssignments");

const searchInput =
    document.getElementById("searchInput");
   
const statusFilter =
    document.getElementById("statusFilter"); 


// Add assignment

assignmentForm.addEventListener("submit", function(event) {

    event.preventDefault();


    const subject =
        document.getElementById("subject").value;

    const title =
        document.getElementById("title").value;

    const dueDate =
        document.getElementById("dueDate").value;

    const priority =
        document.getElementById("priority").value;

    const assignment = {
        subject: subject,
        title: title,
        dueDate: dueDate,
        priority: priority
    };

    fetch("http://localhost:5000/api/assignments", {
        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify(assignment)
    })
    .then(function(response) {
        return response.json();
    })
    .then(function(data) {

        console.log("Assignment added:", data);

        assignmentForm.reset();

        loadAssignments();

    })
    .catch(function(error) {

        console.error("Error adding assignment:", error);

    });

});





// Display assignments

function displayAssignments(list = assignments) {

    assignmentList.innerHTML = "";


    if (list.length === 0) {

        assignmentList.innerHTML = `
            <tr>
                <td colspan="6">
                    No assignments found.
                </td>
            </tr>
        `;

        return;
    }


    list.forEach(function(assignment) {

        const row = document.createElement("tr");


        row.innerHTML = `

            <td>${assignment.subject}</td>

            <td>${assignment.title}</td>

            <td>${assignment.dueDate}</td>

            <td>${assignment.priority}</td>

            <td>${assignment.status}</td>

            <td>

                <button
                    onclick="toggleStatus(${assignment.id})"
                >
                    ${assignment.status === "Pending"
                        ? "✓ Complete"
                        : "↩ Pending"}
                </button>


                <button
                    onclick="deleteAssignment(${assignment.id})"
                >
                    Delete
                </button>

            </td>

        `;


        assignmentList.appendChild(row);

    });

}


// Change assignment status
async function toggleStatus(id) {

    const assignment = assignments.find(function(item) {
        return item.id === id;
    });

    if (!assignment) {
        return;
    }

    const newStatus =
        assignment.status === "Pending"
            ? "Completed"
            : "Pending";

    fetch(`http://localhost:5000/api/assignments/${id}`, {

        method: "PUT",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify({
            status: newStatus
        })

    })
    .then(function(response) {
        return response.json();
    })

    .then(function(data) {

        console.log("Assignment updated:", data);

        loadAssignments();

    })

    .catch(function(error) {

        console.error("Error updating assignment:", error);

    });
}


// Delete assignment
async function deleteAssignment(id) {

    fetch(`http://localhost:5000/api/assignments/${id}`, {

        method: "DELETE"

    })
    .then(function(response) {
        return response.json();
    })

    .then(function(data) {

        console.log(data.message);

        loadAssignments();

    })

    .catch(function(error) {

        console.error("Error deleting assignment:", error);

    });
}


// Update dashboard numbers

function updateDashboard() {

    const total = assignments.length;


    const pending =
        assignments.filter(function(assignment) {

            return assignment.status === "Pending";

        }).length;


    const completed =
        assignments.filter(function(assignment) {

            return assignment.status === "Completed";

        }).length;


    totalAssignments.textContent = total;

    pendingAssignments.textContent = pending;

    completedAssignments.textContent = completed;


    // Find assignments due within 3 days

    const today = new Date();

    const threeDaysLater = new Date();

    threeDaysLater.setDate(today.getDate() + 3);


    const dueSoon =
        assignments.filter(function(assignment) {

            const dueDate =
                new Date(assignment.dueDate);


            return (
                dueDate >= today &&
                dueDate <= threeDaysLater &&
                assignment.status === "Pending"
            );

        }).length;


    dueSoonAssignments.textContent = dueSoon;

}


// Search assignments


function filterAssignments() {

    const searchText =
        searchInput.value.toLowerCase();

    const selectedStatus =
        statusFilter.value;


    const filtered =
        assignments.filter(function(assignment) {

            const matchesSearch =
                assignment.subject
                    .toLowerCase()
                    .includes(searchText)

                ||

                assignment.title
                    .toLowerCase()
                    .includes(searchText);


            const matchesStatus =
                selectedStatus === "All"

                ||

                assignment.status === selectedStatus;


            return matchesSearch && matchesStatus;

        });


    displayAssignments(filtered);

}


searchInput.addEventListener(
    "input",
    filterAssignments
);


statusFilter.addEventListener(
    "change",
    filterAssignments
);
loadAssignments();