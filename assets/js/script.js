var tasks = {};

var createTask = function(taskText, taskDate, taskList) {
  // Create elements that make up a task item
  var taskLi = $("<li>").addClass("list-group-item");
  var taskSpan = $("<span>")
    .addClass("badge badge-primary badge-pill")
    .text(taskDate);
  var taskP = $("<p>")
    .addClass("m-1")
    .text(taskText);

  // Append span and p element to parent Li
  taskLi.append(taskSpan, taskP);

  // Check due date
  auditTask(taskLi);

  // Append to ul list on the page
  $("#list-" + taskList).append(taskLi);
};

var loadTasks = function() {
  tasks = JSON.parse(localStorage.getItem("tasks"));

  // If nothing in localStorage, create a new object to track all task status arrays
  if (!tasks) {
    tasks = {
      toDo: [],
      inProgress: [],
      inReview: [],
      done: [],
    };
  }
  
  // Loop over object properties
  $.each(tasks, function(list, arr) {
    // Loop over sub-array
    arr.forEach(function(task){
      createTask(task.text, task.date, list);
    });
  });
};

var saveTasks = function() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
};

var auditTask = function(taskEl) {
  // Get date from task element
  var date = $(taskEl)
  .find("span")
  .text()
  .trim();

  // Convert to moment object at 5:00pm
  var time = moment(date, "L").set("hour", 17);

  // Remove any old classes from element
  $(taskEl).removeClass("list-group-item-warning list-group-item-danger");

  // Apply new class if task is near/over due date
  if (moment().isAfter(time)) {
    $(taskEl).addClass("list-group-item-danger");
  } else if (Math.abs(moment().diff(time, "days")) <= 2) {
    $(taskEl).addClass("list-group-item-warning");
  }
};

// Enable draggable/sortable feature on list-group elements
$(".card .list-group").sortable({
  // Enable dragging across lists
  connectWith: $(".card .list-group"),
  scroll: false,
  tolerance: "pointer",
  helper: "clone",
  activate: function(event, ui) {
    $(this).addClass("dropover");
    $(".bottom-trash").addClass("bottom-trash-drag");
  },
  deactivate: function(event, ui) {
    $(this).removeClass("dropover");
    $(".bottom-trash").removeClass("bottom-trash-drag");
  },
  over: function(event) {
    $(event.target).addClass("dropover-active");
  },
  out: function(event) {
    $(event.target).removeClass("dropover-active");
  },
  update: function() {
    var tempArr = [];

    // Loop over current set of children in sortable list
    $(this)
      .children()
      .each(function() {
        // save values in temp array
        tempArr.push({
          text: $(this)
            .find("p")
            .text()
            .trim(),
          date: $(this)
            .find("span")
            .text()
            .trim()
        });
      });

    // Trim down list's ID to match object property
    var arrName = $(this)
      .attr("id")
      .replace("list-", "");

    // Update array on tasks object and save
    tasks[arrName] = tempArr;
    saveTasks();
  }
});

// Trash icon can be dropped onto
$("#trash").droppable({
  accept: ".card .list-group-item",
  tolerance: "touch",
  drop: function(event, ui) {
    // Remove dragged elemot from the DOM
    ui.draggable.remove();
    $(".bottom-trash").removeClass("bottom-trash-active");
  },
  over: function(event, ui) {
    console.log(ui);
    $(".bottom-trash").addClass("bottom-trash-active");
  },
  out: function(event, ui) {
    $(".bottom-trash").removeClass("bottom-trash-active");
  }
});

// Convert text field into a jquery date picker
$("#modalDueDate").datepicker({
  // Force user to select a future date
  minDate: 1
});

// Modal was triggered
$("#task-form-modal").on("show.bs.modal", function() {
  // Clear values
  $("#modalTaskDescription, #modalDueDate").val("");
});

// Modal is fully visible
$("#task-form-modal").on("shown.bs.modal", function() {
  // Highlight textarea
  $("#modalTaskDescription").trigger("focus");
});

// Save button in modal was clicked
$("#task-form-modal .btn-save").click(function() {
  // Get form values
  var taskText = $("#modalTaskDescription").val();
  var taskDate = $("#modalDueDate").val();

  if (taskText && taskDate) {
    createTask(taskText, taskDate, "toDo");

    // Close modal
    $("#task-form-modal").modal("hide");

    // Save in tasks array
    tasks.toDo.push({
      text: taskText,
      date: taskDate
    });

    saveTasks();
  }
});

// Task text was clicked
$(".list-group").on("click", "p", function() {
  // Get current text from p element
  var text = $(this)
    .text()
    .trim();

  // Replace p element with a new textarea
  var textInput = $("<textarea>").addClass("form-control").val(text);
  $(this).replaceWith(textInput);

  // Auto focus new element
  textInput.trigger("focus");
});

// Editable field was un-focused
$(".list-group").on("blur", "textarea", function() {
  // Get currently value of textarea
  var text = $(this).val();

  // Get status tupe and position in the list 
  var status = $(this)
    .closest(".list-group")
    .attr("id")
    .replace("list-", "");
  var index = S(this)
    .closest(".list-group-item")
    .index();

    // Update task in array and resave to localstorage
    tasks[status][index].text = text;
    saveTasks();

    // Recreate a p element 
    var taskP = $("<p>")
      .addClass("m-1")
      .text(text);

    // Replace textarea with new content
    $(this).replaceWith(taskP);
});

// Due date was clicked
$(".list-group").on("click", "span", function(){
  // Get current text
  var date = $(this)
    .text()
    .trim();

  // Create new input element
  var dateInput = $("<input>")
    .attr("type", "text")
    .addClass("form-control")
    .val(date);
  $(this).replaceWith(dateInput);

  // Enable jquery ui date picker
  dateInput.datepicker({
    minDate: 1,
    onClose: function() {
      // When calendar is closed, force a "change" event
      $(this).trigger("change");
    }
  });
  
  // Automatically bring up the calendar
  dateInput.trigger("focus");
});

// Value of due date was change
$(".list-group").on("change", "input[type='text']", function() {
  var date = $(this).val();
  
  // Get status type and position in the list 
  var status = $(this)
    .closest(".list-group")
    .attr("id")
    .replace("list-", "");
  var index = $(this)
    .closest(".list-group-item")
    .index();
  
  // Update task in array and resave to localstorage
  tasks[status][index].date = date;
  saveTasks();

  // Recreate span and insert in place of input element
  var taskSpan = $("<span>")
    .addClass("badge badge-primary badge-pill")
    .text(date);
    $(this).replaceWith(taskSpan);
    auditTask($(taskSpan).closest(".list-group-item"));
});

// Remove all tasks
$("#remove-tasks").on("click", function() {
  for (var key in tasks) {
    tasks[key].length = 0;
    $("#list-" + key). empty();
  }
  console.log(tasks);
  saveTasks();
});

// Load tasks for the first time
loadTasks();

// Audit task due dates every 30 minutes
setInterval(function() {
  $(".card .list-group-item").each(function(){
    auditTask($(this));
  });
}, 1800000);
