const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    author: {
        type: String,
        required: true
    },
    isbn: {
        type: String,
        required: true,
        unique: true
    },
    category: {
        type: String,
        required: true
    },
    quantity: {
        type: Number,
        default: 1
    },
    available: {
        type: Number,
        default: function () { return this.quantity; }
    },
    location: String,
    status: {
        type: String,
        enum: ['Available', 'Out of Stock'],
        default: 'Available'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Book', bookSchema);
