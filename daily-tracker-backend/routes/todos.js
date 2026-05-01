const express = require('express');
const router = express.Router();
const { getTodos, createTodo, updateTodo, deleteTodo, getTodoSummary } = require('../controllers/todoController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/summary', getTodoSummary); // before /:id
router.get('/',        getTodos);
router.post('/',       createTodo);
router.put('/:id',     updateTodo);
router.delete('/:id',  deleteTodo);

module.exports = router;