const Todo = require('../models/Todo');

// GET /api/todos
const getTodos = async (req, res) => {
  try {
    const { status, category, priority } = req.query;

    const filter = { user: req.user._id };
    if (status)   filter.status   = status;
    if (category) filter.category = category;
    if (priority) filter.priority = priority;

    const todos = await Todo.find(filter).sort({ dueDate: 1, createdAt: -1 });
    res.json(todos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/todos
const createTodo = async (req, res) => {
  try {
    const { title, description, priority, category, dueDate } = req.body;

    const todo = await Todo.create({
      user: req.user._id,
      title,
      description,
      priority,
      category,
      dueDate,
    });

    res.status(201).json(todo);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/todos/:id
const updateTodo = async (req, res) => {
  try {
    const todo = await Todo.findById(req.params.id);

    if (!todo) return res.status(404).json({ message: 'Todo not found' });
    if (todo.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorised' });
    }

    // Merge updates into the document then save
    // so the pre('save') hook fires for completedAt
    Object.assign(todo, req.body);
    const updated = await todo.save();

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/todos/:id
const deleteTodo = async (req, res) => {
  try {
    const todo = await Todo.findById(req.params.id);

    if (!todo) return res.status(404).json({ message: 'Todo not found' });
    if (todo.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorised' });
    }

    await todo.deleteOne();
    res.json({ message: 'Todo deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/todos/summary — done vs pending count for dashboard
const getTodoSummary = async (req, res) => {
  try {
    const { period = 'week' } = req.query;

    const now = new Date();
    const startDate = new Date();
    if (period === 'week')  startDate.setDate(now.getDate() - 7);
    if (period === 'month') startDate.setMonth(now.getMonth() - 1);

    const [pending, inProgress, done] = await Promise.all([
      Todo.countDocuments({ user: req.user._id, status: 'pending' }),
      Todo.countDocuments({ user: req.user._id, status: 'in-progress' }),
      Todo.countDocuments({
        user: req.user._id,
        status: 'done',
        completedAt: { $gte: startDate },
      }),
    ]);

    // Overdue — past due date and not done
    const overdue = await Todo.countDocuments({
      user: req.user._id,
      status: { $ne: 'done' },
      dueDate: { $lt: now },
    });

    res.json({ pending, inProgress, done, overdue, period });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getTodos, createTodo, updateTodo, deleteTodo, getTodoSummary };