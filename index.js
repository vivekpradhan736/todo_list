document.addEventListener("DOMContentLoaded", () => {
  const taskForm = document.getElementById("task-form");
  const taskList = document.getElementById("task-list");
  const dateRangeInput = document.getElementById("date-range");
  const tagFilter = document.getElementById("tag-filter");
  const priorityFilter = document.getElementById("priority-filter");
  const completionChart = document.getElementById("completion-chart");

  let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
  let chart;

  flatpickr("#task-due-date", {
    dateFormat: "Y-m-d",
    allowInput: true,
  });

  const dateRangePicker = flatpickr("#date-range", {
    mode: "range",
    dateFormat: "Y-m-d",
    allowInput: true,
    onChange: () => renderTasks(),
  });

  new Sortable(taskList, {
    animation: 150,
    ghostClass: "bg-gray-100",
    onEnd: function (evt) {
      const oldIndex = evt.oldIndex;
      const newIndex = evt.newIndex;
      const movedTask = tasks.splice(oldIndex, 1)[0];
      tasks.splice(newIndex, 0, movedTask);
      saveTasks();
      renderTasks();
    },
  });

  function saveTasks() {
    localStorage.setItem("tasks", JSON.stringify(tasks));
  }

  function renderTasks() {
    const filteredTasks = filterTasks();
    taskList.innerHTML = "";
    filteredTasks.forEach((task, index) => {
      const taskElement = document.createElement("div");
      taskElement.className = `task-item bg-white rounded-lg shadow-md p-4 ${
        task.completed ? "opacity-50" : ""
      }`;
      taskElement.setAttribute("data-id", index);
      taskElement.innerHTML = `
                        <div class="flex justify-between items-center mb-2">
                            <h3 class="text-xl font-semibold text-gray-800">${
                              task.title
                            }</h3>
                            <span class="text-sm px-2 py-1 rounded-full ${getPriorityClass(
                              task.priority
                            )}">${task.priority}</span>
                        </div>
                        <p class="text-gray-600 mb-2">${task.description}</p>
                        <p class="text-sm text-gray-500 mb-2">Due: ${
                          task.dueDate
                        }</p>
                        <div class="flex flex-wrap gap-2 mb-4">
                            ${task.tags
                              .map(
                                (tag) =>
                                  `<span class="inline-block bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700">#${tag}</span>`
                              )
                              .join("")}
                        </div>
                        <div class="flex justify-between">
                            <button class="complete-btn px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition duration-300 ease-in-out">${
                              task.completed ? "Uncomplete" : "Complete"
                            }</button>
                            <button class="edit-btn px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition duration-300 ease-in-out">Edit</button>
                            <button class="delete-btn px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition duration-300 ease-in-out">Delete</button>
                        </div>
                        <div class="edit-section hidden mt-4 space-y-4">
                            <input type="text" class="edit-title w-full p-2 border border-gray-300 rounded-md" value="${
                              task.title
                            }">
                            <input type="text" class="edit-description w-full p-2 border border-gray-300 rounded-md" value="${
                              task.description
                            }">
                            <input type="text" class="edit-due-date w-full p-2 border border-gray-300 rounded-md" value="${
                              task.dueDate
                            }">
                            <select class="edit-priority w-full p-2 border border-gray-300 rounded-md">
                                <option value="low" ${
                                  task.priority === "low" ? "selected" : ""
                                }>Low Priority</option>
                                <option value="medium" ${
                                  task.priority === "medium" ? "selected" : ""
                                }>Medium Priority</option>
                                <option value="high" ${
                                  task.priority === "high" ? "selected" : ""
                                }>High Priority</option>
                            </select>
                            <button class="save-btn w-full p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition duration-300 ease-in-out">Save</button>
                        </div>
                    `;
      taskList.appendChild(taskElement);
    });
    updateChart();
  }

  function filterTasks() {
    let filteredTasks = tasks;
    const selectedPriority = priorityFilter.value;
    const selectedTags = tagFilter.value
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag !== "");
    const dateRange = dateRangeInput.value.split(" to ");

    if (selectedPriority !== "all") {
      filteredTasks = filteredTasks.filter(
        (task) => task.priority === selectedPriority
      );
    }

    if (selectedTags.length > 0) {
      filteredTasks = filteredTasks.filter((task) =>
        task.tags.some((tag) => selectedTags.includes(tag))
      );
    }

    if (dateRange.length === 2) {
      const startDate = new Date(dateRange[0]);
      const endDate = new Date(dateRange[1]);
      endDate.setHours(23, 59, 59, 999); // Set to end of day
      filteredTasks = filteredTasks.filter((task) => {
        const taskDate = new Date(task.dueDate);
        return taskDate >= startDate && taskDate <= endDate;
      });
    }

    return filteredTasks;
  }

  taskForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const title = document.getElementById("task-title").value;
    const description = document.getElementById("task-description").value;
    const dueDate = document.getElementById("task-due-date").value;
    const priority = document.getElementById("task-priority").value;
    const tags = document
      .getElementById("task-tags")
      .value.split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag !== "");

    const newTask = {
      title,
      description,
      dueDate,
      priority,
      tags,
      completed: false,
    };

    tasks.push(newTask);
    saveTasks();
    renderTasks();
    taskForm.reset();
  });

  taskList.addEventListener("click", (e) => {
    if (e.target.classList.contains("delete-btn")) {
      const taskElement = e.target.closest(".task-item");
      const index = tasks.findIndex(
        (task) => task.title === taskElement.querySelector("h3").textContent
      );
      tasks.splice(index, 1);
      saveTasks();
      renderTasks();
    }

    if (e.target.classList.contains("complete-btn")) {
      const taskElement = e.target.closest(".task-item");
      const index = tasks.findIndex(
        (task) => task.title === taskElement.querySelector("h3").textContent
      );
      tasks[index].completed = !tasks[index].completed;
      saveTasks();
      renderTasks();
    }

    if (e.target.classList.contains("edit-btn")) {
      const taskElement = e.target.closest(".task-item");
      taskElement.querySelector(".edit-section").classList.toggle("hidden");
    }

    if (e.target.classList.contains("save-btn")) {
      const taskElement = e.target.closest(".task-item");
      const index = tasks.findIndex(
        (task) => task.title === taskElement.querySelector("h3").textContent
      );
      tasks[index].title = taskElement.querySelector(".edit-title").value;
      tasks[index].description =
        taskElement.querySelector(".edit-description").value;
      tasks[index].dueDate = taskElement.querySelector(".edit-due-date").value;
      tasks[index].priority = taskElement.querySelector(".edit-priority").value;
      saveTasks();
      renderTasks();
    }
  });

  function updateChart() {
    const completedTasks = tasks.filter((task) => task.completed).length;
    const totalTasks = tasks.length;
    const completionRate =
      totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    const data = {
      labels: ["Completed", "Remaining"],
      datasets: [
        {
          data: [completedTasks, totalTasks - completedTasks],
          backgroundColor: ["#4CAF50", "#FF6384"],
        },
      ],
    };

    const options = {
      responsive: true,
      maintainAspectRatio: false,
    };

    if (chart) {
      chart.destroy();
    }

    chart = new Chart(completionChart, {
      type: "doughnut",
      data,
      options,
    });
  }

  function getPriorityClass(priority) {
    if (priority === "high") return "bg-red-500 text-white";
    if (priority === "medium") return "bg-yellow-500 text-white";
    return "bg-green-500 text-white";
  }

  // Add event listeners for filters
  tagFilter.addEventListener("input", renderTasks);
  priorityFilter.addEventListener("change", renderTasks);

  renderTasks();
});
