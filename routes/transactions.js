const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');

// Get all transactions
router.get('/', async (req, res) => {
    try {
        const { startDate, endDate, type, division } = req.query;
        let query = {};

        if (startDate && endDate) {
            query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
        }
        if (type) query.type = type;
        if (division) query.division = division;

        const transactions = await Transaction.find(query).sort({ date: -1 });
        res.json(transactions);
    } catch (err) {
        console.error('Error fetching transactions:', err);
        res.status(500).json({ message: err.message });
    }
});

// Add new transaction
router.post('/', async (req, res) => {
    const transaction = new Transaction({
        type: req.body.type,
        amount: req.body.amount,
        category: req.body.category,
        division: req.body.division,
        description: req.body.description,
        date: req.body.date || Date.now()
    });

    try {
        const newTransaction = await transaction.save();
        res.status(201).json(newTransaction);
    } catch (err) {
        console.error('Error adding transaction:', err);
        res.status(400).json({ message: err.message });
    }
});

// Update transaction (Check 12 hour restriction)
router.put('/:id', async (req, res) => {
    try {
        const transaction = await Transaction.findById(req.params.id);
        if (!transaction) return res.status(404).json({ message: 'Transaction not found' });

        const createdTime = new Date(transaction.createdAt).getTime();
        const currentTime = Date.now();
        const hoursDiff = (currentTime - createdTime) / (1000 * 60 * 60);

        if (hoursDiff > 12) {
            return res.status(403).json({ message: 'Editing is restricted after 12 hours' });
        }

        Object.assign(transaction, req.body);
        const updatedTransaction = await transaction.save();
        res.json(updatedTransaction);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Delete transaction
router.delete('/:id', async (req, res) => {
    try {
       
        await Transaction.findByIdAndDelete(req.params.id);
        res.json({ message: 'Transaction deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Summary Endpoint
router.get('/summary', async (req, res) => {
    try {
        const income = await Transaction.aggregate([
            { $match: { type: 'income' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        const expense = await Transaction.aggregate([
            { $match: { type: 'expense' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        res.json({
            totalIncome: income[0]?.total || 0,
            totalExpense: expense[0]?.total || 0,
            balance: (income[0]?.total || 0) - (expense[0]?.total || 0)
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
