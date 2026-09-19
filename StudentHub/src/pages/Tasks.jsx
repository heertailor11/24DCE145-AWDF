import { useEffect, useState } from "react";
import {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
} from "../api";

function Tasks() {
  const [tasks, setTasks] = useState([]);

  // General loading/error
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Toast notification
  const [toast, setToast] = useState(null);

  // Create form
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [creating, setCreating] = useState(false);

  // Edit form
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPriority, setEditPriority] = useState("medium");
  const [editCompleted, setEditCompleted] = useState(false);
  const [updating, setUpdating] = useState(false);

  // Delete
  const [deletingId, setDeletingId] = useState(null);

  // --------------------------------------------------
  // TOAST NOTIFICATION
  // --------------------------------------------------

  const showToast = (message, type = "success") => {
    setToast({
      message,
      type,
    });

    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  // --------------------------------------------------
  // GET ALL TASKS
  // --------------------------------------------------

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getTasks();

      setTasks(data);
    } catch (err) {
      setError(err.message || "Failed to load tasks");

      showToast(
        "Failed to load tasks",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------
  // CREATE TASK - OPTIMISTIC UI
  // --------------------------------------------------

  const handleCreate = async (e) => {
    e.preventDefault();

    setError("");

    // Validate title
    if (!title.trim()) {
      setError("Task title is required");

      showToast(
        "Task title is required",
        "error"
      );

      return;
    }

    // Task data
    const taskData = {
      title: title.trim(),
      description: description.trim(),
      priority,
      completed: false,
    };

    // Create temporary ID
    const temporaryId = `temp-${Date.now()}`;

    // Create temporary task
    const optimisticTask = {
      _id: temporaryId,
      title: taskData.title,
      description: taskData.description,
      priority: taskData.priority,
      completed: false,
    };

    // ⭐ Show task immediately
    setTasks((prevTasks) => [
      ...prevTasks,
      optimisticTask,
    ]);

    // Clear form immediately
    setTitle("");
    setDescription("");
    setPriority("medium");

    try {
      setCreating(true);

      // Send request to backend
      const savedTask = await createTask(taskData);

      // Replace temporary task with real MongoDB task
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task._id === temporaryId
            ? savedTask
            : task
        )
      );

      showToast(
        "Task created successfully!",
        "success"
      );
    } catch (err) {
      // Server failed
      // Remove temporary task
      setTasks((prevTasks) =>
        prevTasks.filter(
          (task) => task._id !== temporaryId
        )
      );

      setError(
        err.message || "Failed to create task"
      );

      showToast(
        "Failed to create task",
        "error"
      );
    } finally {
      setCreating(false);
    }
  };

  // --------------------------------------------------
  // START EDITING
  // --------------------------------------------------

  const startEdit = (task) => {
    setEditingId(task._id);

    setEditTitle(task.title);
    setEditDescription(
      task.description || ""
    );
    setEditPriority(
      task.priority || "medium"
    );
    setEditCompleted(
      task.completed || false
    );

    setError("");
  };

  // --------------------------------------------------
  // CANCEL EDIT
  // --------------------------------------------------

  const cancelEdit = () => {
    setEditingId(null);

    setEditTitle("");
    setEditDescription("");
    setEditPriority("medium");
    setEditCompleted(false);
  };

  // --------------------------------------------------
  // UPDATE TASK
  // --------------------------------------------------

  const handleUpdate = async (id) => {
    if (!editTitle.trim()) {
      setError("Task title is required");

      showToast(
        "Task title is required",
        "error"
      );

      return;
    }

    try {
      setUpdating(true);
      setError("");

      const updatedTask = await updateTask(
        id,
        {
          title: editTitle.trim(),
          description: editDescription.trim(),
          priority: editPriority,
          completed: editCompleted,
        }
      );

      // Update task in React
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task._id === id
            ? updatedTask
            : task
        )
      );

      cancelEdit();

      showToast(
        "Task updated successfully!",
        "success"
      );
    } catch (err) {
      setError(
        err.message || "Failed to update task"
      );

      showToast(
        "Failed to update task",
        "error"
      );
    } finally {
      setUpdating(false);
    }
  };

  // --------------------------------------------------
  // DELETE TASK
  // --------------------------------------------------

  const handleDelete = async (id) => {
    // ⭐ Confirmation dialog
    const confirmed = window.confirm(
      "Are you sure you want to delete this task?"
    );

    // User clicked Cancel
    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(id);
      setError("");

      // Delete from backend
      await deleteTask(id);

      // Remove from React list
      setTasks((prevTasks) =>
        prevTasks.filter(
          (task) => task._id !== id
        )
      );

      showToast(
        "Task deleted successfully!",
        "success"
      );
    } catch (err) {
      setError(
        err.message || "Failed to delete task"
      );

      showToast(
        "Failed to delete task",
        "error"
      );
    } finally {
      setDeletingId(null);
    }
  };

  // --------------------------------------------------
  // INITIAL LOADING
  // --------------------------------------------------

  if (loading) {
    return (
      <div
        style={{
          padding: "30px",
          textAlign: "center",
        }}
      >
        <h2>Loading tasks...</h2>
      </div>
    );
  }

  // --------------------------------------------------
  // UI
  // --------------------------------------------------

  return (
    <div
      style={{
        padding: "30px",
        maxWidth: "800px",
        margin: "0 auto",
      }}
    >

      {/* ==========================================
          TOAST
      ========================================== */}

      {toast && (
        <div
          style={{
            position: "fixed",
            top: "20px",
            right: "20px",
            padding: "15px 20px",
            borderRadius: "8px",
            backgroundColor:
              toast.type === "success"
                ? "#28a745"
                : "#dc3545",
            color: "white",
            fontWeight: "bold",
            zIndex: 1000,
            boxShadow:
              "0 4px 10px rgba(0,0,0,0.2)",
          }}
        >
          {toast.type === "success"
            ? "✓ "
            : "✕ "}

          {toast.message}
        </div>
      )}

      {/* ==========================================
          PAGE TITLE
      ========================================== */}

      <h1>Task Manager</h1>

      {/* ==========================================
          ERROR MESSAGE
      ========================================== */}

      {error && (
        <div
          style={{
            background: "#ffe6e6",
            color: "#cc0000",
            padding: "10px",
            marginBottom: "15px",
            borderRadius: "5px",
          }}
        >
          {error}
        </div>
      )}

      {/* ==========================================
          CREATE TASK
      ========================================== */}

      <div
        style={{
          border: "1px solid #ccc",
          padding: "20px",
          borderRadius: "8px",
          marginBottom: "30px",
        }}
      >
        <h2>Create New Task</h2>

        <form onSubmit={handleCreate}>

          {/* Title */}

          <input
            type="text"
            placeholder="Task title"
            value={title}
            onChange={(e) =>
              setTitle(e.target.value)
            }
            style={{
              width: "100%",
              padding: "10px",
              marginBottom: "10px",
              boxSizing: "border-box",
            }}
          />

          {/* Description */}

          <textarea
            placeholder="Task description"
            value={description}
            onChange={(e) =>
              setDescription(e.target.value)
            }
            rows="3"
            style={{
              width: "100%",
              padding: "10px",
              marginBottom: "10px",
              boxSizing: "border-box",
            }}
          />

          {/* Priority */}

          <select
            value={priority}
            onChange={(e) =>
              setPriority(e.target.value)
            }
            style={{
              padding: "10px",
              marginBottom: "10px",
            }}
          >
            <option value="low">
              Low
            </option>

            <option value="medium">
              Medium
            </option>

            <option value="high">
              High
            </option>
          </select>

          <br />

          {/* Create button */}

          <button
            type="submit"
            disabled={creating}
          >
            {creating
              ? "Saving..."
              : "Create Task"}
          </button>

        </form>
      </div>

      {/* ==========================================
          TASK LIST
      ========================================== */}

      <h2>Tasks</h2>

      {tasks.length === 0 ? (
        <p>No tasks found.</p>
      ) : (
        tasks.map((task) => (

          <div
            key={task._id}
            style={{
              border: "1px solid #ccc",
              padding: "20px",
              marginBottom: "15px",
              borderRadius: "8px",
            }}
          >

            {/* ====================================
                EDIT MODE
            ==================================== */}

            {editingId === task._id ? (

              <>
                <h3>Edit Task</h3>

                {/* Edit title */}

                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) =>
                    setEditTitle(
                      e.target.value
                    )
                  }
                  style={{
                    width: "100%",
                    padding: "10px",
                    marginBottom: "10px",
                    boxSizing:
                      "border-box",
                  }}
                />

                {/* Edit description */}

                <textarea
                  value={editDescription}
                  onChange={(e) =>
                    setEditDescription(
                      e.target.value
                    )
                  }
                  rows="3"
                  style={{
                    width: "100%",
                    padding: "10px",
                    marginBottom: "10px",
                    boxSizing:
                      "border-box",
                  }}
                />

                {/* Edit priority */}

                <select
                  value={editPriority}
                  onChange={(e) =>
                    setEditPriority(
                      e.target.value
                    )
                  }
                  style={{
                    padding: "10px",
                    marginBottom: "10px",
                  }}
                >
                  <option value="low">
                    Low
                  </option>

                  <option value="medium">
                    Medium
                  </option>

                  <option value="high">
                    High
                  </option>
                </select>

                <br />

                {/* Completed */}

                <label>
                  <input
                    type="checkbox"
                    checked={editCompleted}
                    onChange={(e) =>
                      setEditCompleted(
                        e.target.checked
                      )
                    }
                  />

                  {" "}Completed
                </label>

                <br />
                <br />

                {/* Save */}

                <button
                  onClick={() =>
                    handleUpdate(
                      task._id
                    )
                  }
                  disabled={updating}
                >
                  {updating
                    ? "Updating..."
                    : "Save Changes"}
                </button>

                {" "}

                {/* Cancel */}

                <button
                  onClick={cancelEdit}
                >
                  Cancel
                </button>
              </>

            ) : (

              /* ==================================
                 NORMAL TASK VIEW
              ================================== */

              <>
                <h3>
                  {task.title}
                </h3>

                {task.description && (
                  <p>
                    {task.description}
                  </p>
                )}

                <p>
                  <strong>
                    Priority:
                  </strong>{" "}
                  {task.priority ||
                    "medium"}
                </p>

                <p>
                  <strong>
                    Status:
                  </strong>{" "}
                  {task.completed
                    ? "Completed"
                    : "Pending"}
                </p>

                {/* Edit */}

                <button
                  onClick={() =>
                    startEdit(task)
                  }
                >
                  Edit
                </button>

                {" "}

                {/* Delete */}

                <button
                  onClick={() =>
                    handleDelete(
                      task._id
                    )
                  }
                  disabled={
                    deletingId ===
                    task._id
                  }
                >
                  {deletingId ===
                  task._id
                    ? "Deleting..."
                    : "Delete"}
                </button>
              </>
            )}

          </div>
        ))
      )}

    </div>
  );
}

export default Tasks;