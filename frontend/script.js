// Store assignments in an array

let assignments = [];


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

        id: Date.now(),

        subject: subject,

        title: title,

        dueDate: dueDate,

        priority: priority,

        status: "Pending"

    };


    assignments.push(assignment);


    assignmentForm.reset();


    displayAssignments();

    updateDashboard();

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

function toggleStatus(id) {

    const assignment =
        assignments.find(function(item) {

            return item.id === id;

        });


    if (assignment) {

        if (assignment.status === "Pending") {

            assignment.status = "Completed";

        } else {

            assignment.status = "Pending";

        }

    }


    displayAssignments();

    updateDashboard();

}


// Delete assignment

function deleteAssignment(id) {

    assignments = assignments.filter(function(assignment) {

        return assignment.id !== id;

    });


    displayAssignments();

    updateDashboard();

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