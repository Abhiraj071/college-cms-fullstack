import { ApiService } from '../../../services/ApiService.js';
import { ValidationService as VS } from '../../../services/ValidationService.js';
import { ROUTES } from '../../../services/Constants.js';
import { Toast } from '../../../services/Toast.js';

export class BookForm {
    constructor(bookId = null) {
        this.bookId = bookId;
        this.isEdit = !!bookId;
        this.bookData = null;
    }

    render() {
        const container = document.createElement('div');
        container.className = 'fade-in';
        container.style.maxWidth = '800px';
        container.style.margin = '0 auto';

        // Header
        const header = document.createElement('div');
        header.style.marginBottom = '2rem';
        header.innerHTML = `
            <div style="display: flex; align-items: center; gap: 1rem; cursor: pointer; color: var(--text-secondary);" onclick="window.location.hash='${ROUTES.LIBRARY}'">
                <span>← Back to Library</span>
            </div>
            <h2 style="margin-top: 1rem;">${this.isEdit ? 'Edit Book Record' : 'Add New Book'}</h2>
        `;
        container.appendChild(header);

        // Form Card
        const card = document.createElement('div');
        card.className = 'glass-panel';
        card.style.padding = '2.5rem';

        const form = document.createElement('form');
        form.innerHTML = `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 2rem;">
                <div style="grid-column: span 2;">
                    <label>Book Title</label>
                    <input type="text" name="title" placeholder="e.g. Introduction to Algorithms" required>
                </div>
                <div>
                    <label>Author</label>
                    <input type="text" name="author" placeholder="Author Name" required>
                </div>
                <div>
                    <label>ISBN / Code</label>
                    <input type="text" name="isbn" placeholder="ISBN-13" required>
                </div>
                <div>
                    <label>Category</label>
                    <select name="category" required>
                        <option value="Computer Science">Computer Science</option>
                        <option value="Mathematics">Mathematics</option>
                        <option value="Physics">Physics</option>
                        <option value="Literature">Literature</option>
                        <option value="History">History</option>
                        <option value="Other">Other</option>
                    </select>
                </div>
                <div>
                    <label>Total Quantity</label>
                    <input type="number" name="quantity" value="1" min="1" required>
                </div>
            </div>

            <div style="border-top: 1px solid var(--glass-border); padding-top: 2rem; display: flex; justify-content: flex-end; gap: 1rem;">
                <button type="button" class="glass-button" style="background: transparent;" onclick="window.history.back()">Cancel</button>
                <button type="submit" id="submitBtn" class="glass-button">${this.isEdit ? 'Save Changes' : 'Add Book'}</button>
            </div>
        `;

        const submitBtn = /** @type {HTMLButtonElement} */ (form.querySelector('#submitBtn'));

        const initForm = async () => {
            if (this.isEdit) {
                try {
                    const books = await ApiService.getBooks();
                    this.bookData = books.find(b => b._id === this.bookId);
                    if (this.bookData) {
                        /** @type {HTMLInputElement} */ (form.querySelector('[name="title"]')).value = this.bookData.title;
                        /** @type {HTMLInputElement} */ (form.querySelector('[name="author"]')).value = this.bookData.author;
                        /** @type {HTMLInputElement} */ (form.querySelector('[name="isbn"]')).value = this.bookData.isbn;
                        /** @type {HTMLSelectElement} */ (form.querySelector('[name="category"]')).value = this.bookData.category;
                        /** @type {HTMLInputElement} */ (form.querySelector('[name="quantity"]')).value = this.bookData.quantity;
                    } else {
                        Toast.error('Book not found');
                        window.location.hash = ROUTES.LIBRARY;
                    }
                } catch (err) {
                    Toast.error('Failed to load book: ' + err.message);
                }
            }
        };

        initForm();

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            VS.clearErrors(form);

            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());

            // --- Validation ---
            let isValid = true;
            if (!VS.validateRequired(data.title)) { VS.highlightError(form.title, 'Title is required'); isValid = false; }
            if (!VS.validateRequired(data.author)) { VS.highlightError(form.author, 'Author is required'); isValid = false; }
            if (!VS.validateRequired(data.isbn)) { VS.highlightError(form.isbn, 'ISBN is required'); isValid = false; }

            if (!isValid) return;

            submitBtn.textContent = this.isEdit ? 'Saving...' : 'Adding...';
            submitBtn.disabled = true;

            try {
                const bookObj = {
                    ...data,
                    quantity: parseInt(/** @type {string} */(data.quantity))
                };

                if (this.isEdit) {
                    // Update available count proportionally if needed or just sync if quantity increased
                    // For simplicity, we keep original implementation logic
                    await ApiService.updateBook(this.bookId, bookObj);
                    Toast.success('Book Record Updated Successfully!');
                } else {
                    await ApiService.addBook({
                        ...bookObj,
                        available: bookObj.quantity
                    });
                    Toast.success('Library Inventory Updated Successfully!');
                }
                window.location.hash = ROUTES.LIBRARY;
            } catch (err) {
                Toast.error(err.message);
                submitBtn.textContent = this.isEdit ? 'Save Changes' : 'Add Book';
                submitBtn.disabled = false;
            }
        });

        card.appendChild(form);
        container.appendChild(card);
        return container;
    }
}
