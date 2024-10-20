const express = require('express');
const session = require('express-session');
const router = express.Router();
const bcrypt = require('bcrypt');
const MySQLStore = require('express-mysql-session')(session);
const db = require('../db/db');


const sessionStore = new MySQLStore({}, db);

sessionStore.on('error', function(error) {
    console.error('Session store error:', error);
});


router.use(session({
    key: 'user_session',
    secret: process.env.LOGIN_SECRET_KEY, 
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 
    }
}));

function isAuthenticated(req, res, next) {
    if (req.session && req.session.loggedin) {
        return next(); 
    } else {
        return res.redirect('/v1/login'); 
    }
}


router.get('/login', (req, res) => {
    if (req.session.loggedin) {
        return res.redirect('/v1/dashboard');
    }
    res.render('login');
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        db.query('SELECT * FROM users WHERE email = ?', [email], async (error, results, fields) => {
            if (error || results.length == 0 || !(await bcrypt.compare(password, results[0].password))) {
                return res.render('login', { message: "Credenciales inválidas" });
            } else {
             
                req.session.loggedin = true;                
                req.session.userdata = results[0];
                
                res.redirect('/v1/dashboard');
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).render('login', { message: 'Error en el servidor' });
    }
});


router.get('/register', (req, res) => {
    if (req.session.loggedin) {
        return res.redirect('/v1/dashboard');
    }
    res.render('register');
});

router.post('/register', async (req, res) => {
    const { email, rol, user, password } = req.body;

    try {
      
        db.query('SELECT email FROM users WHERE email = ?', [email], async (error, results) => {
            if (error) {
                console.log(error);
                return res.status(500).render('register', { message: 'server error' });
            }

            if (results.length > 0) {
               
                return res.status(400).render('register', { message: 'email already exist' });
            }

      
            const hashedPassword = await bcrypt.hash(password, 10);
            db.query('INSERT INTO users SET ?', { email, rol, user, password: hashedPassword }, (error, results) => {
                if (error) {
                    console.log(error);
                    return res.status(500).render('register', { message: 'singup error' });
                }

            
                res.redirect('/v1/login');
            });
        });
    } catch (error) {
        console.error(error);
        res.status(500).render('register', { message: 'server error' });
    }
});


router.get('/dashboard', isAuthenticated, (req, res) => {
    res.render('dashboard', { datauser: req.session.userdata });
});


router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.log(err);
        }
        res.redirect('/v1/login');
    });
});


router.get('/', (req, res) => {
    res.redirect('/v1/login');
});

module.exports = router;