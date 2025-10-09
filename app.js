import 'dotenv/config';
import express from 'express';
import shareRoutes from './routes/shareRoutes.js';
import morgan from 'morgan';

// Create an express app
const app = express();
// Get configured port, or default to 3000
const PORT = process.env.PORT || 3000;

app.use(morgan('combined')); // request logging
app.use(express.json()); // for parsing application/json

// routes
app.use('/api/share', shareRoutes);

// custom error handler
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).send('Internal Server Error');
})

app.listen(PORT, () => {
    console.log('Listening on port', PORT);
});