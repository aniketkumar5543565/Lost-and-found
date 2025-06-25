// server.js
const express = require('express');
require('dotenv').config();

const bodyParser = require('body-parser');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const itemRoutes = require('./routes/items');
const usersRouter = require('./routes/users');
const claimRoutes = require('./routes/claim');
const app = express();
const PORT = 5000; // backend port

app.use(cors());
app.use(bodyParser.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/users', usersRouter);
app.use('/api/claims', claimRoutes);
app.get('/', (req, res) => {
  res.send('Lost and Found API is running');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
