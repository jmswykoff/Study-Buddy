
/* 
   STUDYSYNC - JAVASCRIPT APPLICATION

   This application manages assignments
   and student grades using JavaScript.
 */

// Load saved information from local storage.
// If nothing exists, start with empty arrays.

let assignments = JSON.parse(
    localStorage.getItem("studyAssignments")
) || [];

let grades = JSON.parse(
    localStorage.getItem("studyGrades")
) || [];

// Track whether an assignment is being edited.
let editingAssignmentId = null;

// Save application information.
function saveData() {

    localStorage.setItem(
        "studyAssignments",
        JSON.stringify(assignments)
    );

    localStorage.setItem(
        "studyGrades",
        JSON.stringify(grades)
    );
}

// Generate a unique ID for each new record.
function generateId() {
    return Date.now().toString() +
        Math.random().toString(36).slice(2);
}


/* NAVIGATION */

// Find all navigation buttons.
const navButtons = document.querySelectorAll(".nav-btn");

// Add an event listener to every navigation button.
navButtons.forEach(function(button) {

    button.addEventListener("click", function() {

        // Get the section this button represents.
        const target = button.dataset.section;

        // Hide all sections and deactivate all buttons.
        document.querySelectorAll(".page-section").forEach(
            function(section) {
                section.classList.remove("active");
            }
        );
        navButtons.forEach(function(navButton) {
            navButton.classList.remove("active");
        });

        // Show the selected section.
        document.getElementById(target).classList.add("active");

        // Highlight the selected navigation button.
        button.classList.add("active");
    });
});


/* ASSIGNMENT MANAGER */

// Find the assignment form.
const assignmentForm = document.getElementById("assignmentForm");

// Listen for form submissions.
assignmentForm.addEventListener("submit", function(event) {

    // Prevent the page from refreshing.
    event.preventDefault();

    // Get the values entered by the user.
    const name = document.getElementById("assignmentName").value.trim();
    const course = document.getElementById("assignmentCourse").value.trim();
    const dueDate = document.getElementById("assignmentDue").value;
    const priority = document.getElementById("assignmentPriority").value;

    // Make sure the assignment date is valid.
    if (!name || !course || !dueDate) {
        showAssignmentMessage("Please complete all fields.");
        return;
    }
    if (dueDate < getToday()) {
        showAssignmentMessage("Please choose today or a future due date.");
        return;
    }
    if (editingAssignmentId !== null) {

        // Find and update the existing assignment.
        const assignment = assignments.find(function(item) {
            return item.id === editingAssignmentId;
        });
        if (assignment) {
            assignment.name = name;
            assignment.course = course;
            assignment.dueDate = dueDate;
            assignment.priority = priority;
        }
        editingAssignmentId = null;
        showAssignmentMessage("Assignment updated successfully!");
    } else {

        // Create a new assignment object.
        const newAssignment = {
            id: generateId(),
            name: name,
            course: course,
            dueDate: dueDate,
            priority: priority,
            completed: false,

            // Object method for marking an assignment complete.
            markComplete: function() {
                this.completed = true;
            }
        };

        // Add the object to the assignments array.
        assignments.push(newAssignment);
        showAssignmentMessage("Assignment added successfully!");
    }

    // Save and update the application.
    saveData();
    assignmentForm.reset();
    renderAssignments();
    updateDashboard();
});

// Display messages to the user.
function showAssignmentMessage(message) {
    document.getElementById("assignmentMessage").textContent = message;
}

// Get today's date in local calendar format.
function getToday() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}


/* DISPLAY AND MANAGE ASSIGNMENTS */

// Display assignments on the page.
function renderAssignments() {
    const assignmentList = document.getElementById("assignmentList");
    const filter = document.getElementById("assignmentFilter").value;
    const sort = document.getElementById("assignmentSort").value;

    // Create a separate array for displaying assignments.
    let displayedAssignments = [...assignments];

    // Apply the selected filter.
    if (filter === "pending") {
        displayedAssignments = displayedAssignments.filter(
            item => !item.completed
        );
    } else if (filter === "completed") {
        displayedAssignments = displayedAssignments.filter(
            item => item.completed
        );
    }

    // Sort the displayed assignments.
    if (sort === "date") {
        displayedAssignments.sort(
            (a, b) => a.dueDate.localeCompare(b.dueDate)
        );
    } else if (sort === "name") {
        displayedAssignments.sort(
            (a, b) => a.name.localeCompare(b.name)
        );
    } else if (sort === "priority") {
        const priorityOrder = {
            High: 1,
            Medium: 2,
            Low: 3
        };
        displayedAssignments.sort(
            (a, b) =>
                priorityOrder[a.priority] - priorityOrder[b.priority]
        );
    }

    // Clear the previous assignment display.
    assignmentList.replaceChildren();

    // Show a message if no assignments exist.
    if (displayedAssignments.length === 0) {
        const emptyMessage = document.createElement("p");
        emptyMessage.textContent = "No assignments found.";
        assignmentList.appendChild(emptyMessage);
        return;
    }

    // Create an HTML card for every assignment.
    displayedAssignments.forEach(function(item) {
        const card = document.createElement("article");
        card.className = "assignment-item";
        if (item.completed) {
            card.classList.add("completed");
        }
        const title = document.createElement("h3");
        title.textContent = item.name;
        const course = document.createElement("p");
        course.textContent = "Course: " + item.course;
        const due = document.createElement("p");
        due.textContent = "Due: " + item.dueDate;
        const priority = document.createElement("p");
        priority.textContent = "Priority: " + item.priority;
        const status = document.createElement("p");
        status.textContent = item.completed ? "Completed" : "Pending";
        const completeButton = document.createElement("button");
        completeButton.textContent = item.completed
            ? "Undo Complete"
            : "Mark Complete";

        completeButton.className = "action-btn complete-btn";
        completeButton.addEventListener("click", function() {
            toggleAssignment(item.id);
        });
        const editButton = document.createElement("button");
        editButton.textContent = "Edit";
        editButton.className = "action-btn edit-btn";
        editButton.addEventListener("click", function() {
            editAssignment(item.id);
        });

        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Delete";
        deleteButton.className = "action-btn delete-btn";
        deleteButton.addEventListener("click", function() {
            deleteAssignment(item.id);
        });
        card.append(
            title,
            course,
            due,
            priority,
            status,
            completeButton,
            editButton,
            deleteButton
        );

        assignmentList.appendChild(card);
    });
}

// Mark an assignment complete or incomplete.
function toggleAssignment(id) {
    const assignment = assignments.find(
        item => item.id === id
    );
    if (assignment) {
        assignment.completed = !assignment.completed;

        saveData();
        renderAssignments();
        updateDashboard();
    }
}

// Edit an assignment.
function editAssignment(id) {
    const assignment = assignments.find(
        item => item.id === id
    );
    if (!assignment) return;

    document.getElementById("assignmentName").value = assignment.name;
    document.getElementById("assignmentCourse").value = assignment.course;
    document.getElementById("assignmentDue").value = assignment.dueDate;
    document.getElementById("assignmentPriority").value = assignment.priority;
    editingAssignmentId = id;
    showAssignmentMessage("Edit your information and submit to save.");

    // Navigate to the assignment section.
    document.querySelector('[data-section="assignments"]').click();
}

// Delete an assignment.
function deleteAssignment(id) {

    const confirmed = confirm(
        "Are you sure you want to delete this assignment?"
    );
    if (!confirmed) return;
    assignments = assignments.filter(
        item => item.id !== id
    );

    if (editingAssignmentId === id) {
        editingAssignmentId = null;
        assignmentForm.reset();
    }
    saveData();
    renderAssignments();
    updateDashboard();
}

// Listen for changes to filters and sorting.
document.getElementById("assignmentFilter").addEventListener(
    "change",
    renderAssignments
);
document.getElementById("assignmentSort").addEventListener(
    "change",
    renderAssignments
);


/* GRADE TRACKER */
const gradeForm = document.getElementById("gradeForm");

// Listen for grade submissions.
gradeForm.addEventListener("submit", function(event) {
    event.preventDefault();
    const course = document.getElementById("gradeCourse").value.trim();
    const score = Number(document.getElementById("gradeScore").value);

    // Validate the information.
    if (!course || !Number.isFinite(score) || score < 0 || score > 100) {
        document.getElementById("gradeMessage").textContent =
            "Enter a valid course and grade between 0 and 100.";
        return;
    }

    // Create a new grade object.
    const newGrade = {
        id: generateId(),
        course: course,
        score: score
    };
    grades.push(newGrade);
    saveData();
    gradeForm.reset();
    document.getElementById("gradeMessage").textContent =
        "Grade added successfully!";
    renderGrades();
    updateDashboard();
});

// Calculate the overall grade average.
function calculateAverage() {
    if (grades.length === 0) {
        return null;
    }
    let total = 0;

    // Add all grades together.
    for (let i = 0; i < grades.length; i++) {
        total += grades[i].score;
    }
    return total / grades.length;
}

// Convert numerical grades into letter grades.
function getLetterGrade(average) {
    if (average === null) return "N/A";
    if (average >= 90) {
        return "A";
    } else if (average >= 80) {
        return "B";
    } else if (average >= 70) {
        return "C";
    } else if (average >= 60) {
        return "D";
    } else {
        return "F";
    }
}

// Display grades on the page.
function renderGrades() {
    const gradeList = document.getElementById("gradeList");
    gradeList.replaceChildren();
    grades.forEach(function(item) {
        const card = document.createElement("article");
        card.className = "grade-item";
        const title = document.createElement("h3");
        title.textContent = item.course;
        const score = document.createElement("p");
        score.textContent = "Grade: " + item.score + "%";
        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Delete Grade";
        deleteButton.className = "action-btn delete-btn";
        deleteButton.addEventListener("click", function() {
            deleteGrade(item.id);
        });

        card.append(title, score, deleteButton);
        gradeList.appendChild(card);
    });

    // Update average and letter grade.
    const average = calculateAverage();
    const averageDisplay = average === null
        ? "N/A"
        : average.toFixed(2) + "%";
    document.getElementById("overallAverage").textContent =
        averageDisplay;
    document.getElementById("gradeAverage").textContent =
        averageDisplay;
    document.getElementById("letterGrade").textContent =
        average === null
            ? "Add grades to see your letter grade."
            : "Letter Grade: " + getLetterGrade(average);
}

// Delete a grade.
function deleteGrade(id) {
    grades = grades.filter(
        item => item.id !== id
    );
    saveData();
    renderGrades();
    updateDashboard();
}

/* DASHBOARD */
function updateDashboard() {

    // Count total assignments.
    const total = assignments.length;

    // Count completed assignments.
    const completed = assignments.filter(
        item => item.completed
    ).length;

    // Calculate upcoming assignments.
    const today = getToday();
    const upcoming = assignments.filter(
        item => !item.completed && item.dueDate >= today
    ).length;

    // Calculate completion percentage.
    const percentage = total === 0
        ? 0
        : (completed / total) * 100;

    // Update dashboard statistics.
    document.getElementById("totalAssignments").textContent = total;
    document.getElementById("completedAssignments").textContent =
        completed;
    document.getElementById("upcomingAssignments").textContent =
        upcoming;
    document.getElementById("progressBar").style.width =
        percentage + "%";
    document.getElementById("progressText").textContent =
        Math.round(percentage) + "% completed";

    // Update recent assignments.
    const recent = document.getElementById("recentAssignments");
    recent.replaceChildren();
    if (assignments.length === 0) {
        const message = document.createElement("p");
        message.textContent = "No assignments added yet.";
        recent.appendChild(message);
    } else {

        // Show the three nearest deadlines.
        const sorted = [...assignments].sort(
            (a, b) => a.dueDate.localeCompare(b.dueDate)
        );
        sorted.slice(0, 3).forEach(function(item) {
            const entry = document.createElement("p");
            entry.textContent =
                item.name + " — " +
                item.course + " — " +
                (item.completed ? "Completed" : item.dueDate);
            recent.appendChild(entry);
        });
    }
}

// Run all display functions when the page loads.
function initializeApp() {
    renderAssignments();
    renderGrades();
    updateDashboard();
}

// Start the application.
initializeApp();

