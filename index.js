const express = require('express');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const ejs = require('ejs');
const app = express();
const path = require('path');
const db = require('./db/db');
require('dotenv').config();

// ejs setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, './views'));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Router setup
const login = require('./routes/login');
app.use('/v1', login);

// Sessions
const sessionStore = new MySQLStore({}, db);
sessionStore.on('error', function(error) {
    console.error('Session store error:', error);
});


app.listen(3000, () => {
    console.log('Server running on port 3000');
});


