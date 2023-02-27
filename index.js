require('./utils');

require('dotenv').config();
const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const bcrypt = require('bcrypt');
const database = require('./databaseConnection');
const db_user = include("database/users")
const saltRounds = 12;

// const db_utils = include('database/db_utils');
// const success = db_utils.printMySQLVersion();


const port = process.env.PORT || 3005;

const app = express();

const mongo_user = process.env.MONGODB_USER;
const mongo_password = process.env.MONGODB_PASSWORD;
const mongo_session_id = process.env.MONGODB_SESSION_SECR;
const node_session_id = process.env.NODE_SESSION_SECRET;

app.set('view engine', 'ejs');

const expireTime = 1 * 60 * 60 * 1000


// users.push("123", bcrypt.hashSync("123", saltRounds));
app.use(express.urlencoded({ extended: false }));


let mongoStore = MongoStore.create({
    mongoUrl: `mongodb+srv://${mongo_user}:${mongo_password}@comp3920.cgu2ibl.mongodb.net/?retryWrites=true&w=majority`,
    crypto: {
        secret: mongo_session_id
    }
});

app.use(session({
    secret: node_session_id,
    store: mongoStore, // default is memory store
    saveUninitialized: false,
    resave: true
}
));

async function authenticateUser(req, user_email, user_password) {
    // is type object
    let result = await db_user.getUsers({ email: user_email, password: user_password });

    if (result) {
        if (result.lenght == 1) {
            if (await bcrypt.compareSynce(user_password, result[0].password)) {
                return true;
            } else {
                console.log("Password not matched")
            }
        } else {
            console.log("Invalid number of users matched: " + result.lenght + " (Expected 1).")
            return false;
        }
    }
    return false;
}

function setUpDatabse() {
    const create_tables = include('database/create_tables')

    let success = create_tables.createTables()
    if (success) {
        console.log("Tables Created Good to Go!!")
    } else {
        console.log("Tables Not Created Bad to GO!!")
    }
}

function getUserType() {
    // return user type
}

function isVaildSession(req) {
    if (req.session.authenticated) {
        return true;
    }
    return false;
}

function sessionValidation(req, res, next) {
    if (!isVaildSession(req)) {
        req.session.destroy();
        res.redirect("/login");
        return;
    }
    else {
        next();
    }
}

function isAdmin(req) {
    if (req.session.user_type == 'admin') {
        return true;
    }
    return false;
}

function adminAuthorization(req, res, next) {
    if (!isAdmin(req)) {
        res.status(403);
        res.render("errorMessage", { error: "Not Authorized" });
        return;
    }
    else {
        next();
    }
}

app.use("/members", sessionValidation)
app.use("/admin", adminAuthorization)


app.get('/', (req, res) => {
    res.render("index")
    setUpDatabse()
});

app.get('/admin', (req, res) => {
    res.render("admin")
});

app.get('/signup', (req, res) => {
    let missing = req.query.missing;
    res.render("createUser", { missing: missing });
});

app.post("/create_user", async (req, res) => {
    let name = req.body.name
    let email = req.body.email
    let password = req.body.password

    if (!name) {
        res.redirect('/signup?missing=1')
        return;
    }
    if (!email) {
        res.redirect("/signup?missing=2")
        return;
    }
    if (!password) {
        res.redirect("/signup?missing=3")
        return;
    }

    let hashedPassword = bcrypt.hashSync(password, saltRounds)
    let success = await db_user.createUser({ name: name, email: email, password: hashedPassword })


    if (success) {
        if (authenticateUser(req, email, hashedPassword)) {
            req.session.authenticated = true;
            req.session.name = name;
            req.session.user_type =
                req.session.cookie.maxAge = expireTime;
            res.redirect("/members")
            return;
        }
    }
    res.redirect("/signup")
});



app.get('/login', (req, res) => {
    let missing = req.query.missing
    res.render("login", { missing: missing });
});

app.post('/validate_user', (req, res) => {
    let user_email = req.body.user_email
    let user_password = req.body.user_password

    if (!user_email) {
        res.redirect('/login?missing=1')
    }
    if (!user_password) {
        res.redirect('/login?missing=2')
    }

    if (authenticateUser(req, user_email, user_password)) {
        req.session.authenticated = true;
        req.session.cookie.maxAge = expireTime;
        res.redirect("/members")
        return;
    }
    //user and password combination not found
    res.redirect("/login")
})


app.get("/members", (req, res) => {
    if (req.session.authenticated) {
        res.render("members");
    } else {
        res.redirect('/login');
    }
})

app.post("/user_logout", (req, res) => {
    req.session.destroy();
    res.redirect("/")
})





















app.use(express.static(__dirname + "/public"));

app.get("*", (req, res) => {
    res.status(404);
    res.send("<h1>Page not found - 404</h1>");
});

app.listen(port, () => {
    console.log("Node application listening on port " + port);
}); 