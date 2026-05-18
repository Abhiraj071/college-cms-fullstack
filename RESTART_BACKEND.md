# ⚠️ Backend Restart Required

The backend `Exam` model was updated. You **must restart the backend server** for changes to take effect.

## Steps

1. Stop the current backend (Ctrl+C in the terminal running it)
2. Go to the backend folder:
   ```
   cd backend
   ```
3. Restart:
   ```
   npm start
   ```
   or if using nodemon:
   ```
   npm run dev
   ```

## What changed in the Exam model

- Added `type` field with enum: `Internal`, `Mid-Term`, `Final`, `Practical`, `Sessional`, `End-Term`, `Quiz`, `Assignment`
- Added `subjectSchedules` array (date, time, maxTotal, maxTheory, maxSessional, maxViva per subject)
- Made `subject` and `date` optional (they are now stored inside subjectSchedules)
