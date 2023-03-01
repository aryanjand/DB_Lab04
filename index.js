require('./utils');

require('dotenv').config();
const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const bcrypt = require('bcrypt');
const database = include('databaseConnection');
const db_user = include("database/users")
const db_todo = include("database/todos")
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

async function authenticateUser(user_email, user_password) {
    // is type object
    let result = await db_user.getUsers({ email: user_email });
    console.log("outside sql")
    console.log(result)
    if (result) {

        if (result.length == 1) {
            if (bcrypt.compareSync(user_password, result[0].password)) {
                console.log("Returing result obj")
                return { bool: true, user: result[0] };
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
    if (req.session.authorization == 'admin') {
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
app.use("/todo", sessionValidation)
app.use("/admin", adminAuthorization)


app.get('/', (req, res) => {
    res.render("index");
    setUpDatabse();
});

app.get('/admin', async (req, res) => {

    let result = await db_user.getAllUsers()
    console.log(result)

    res.render("admin", { name: req.session.username, userlist: result });
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
        console.log("hi there")
        let result = await authenticateUser(email, password)
        console.log(result.bool)
        if (result.bool) {

            req.session.authenticated = true;
            req.session.authorization = result.user.usertype;
            req.session.user_id = result.user.user_id;
            req.session.user_email = result.user.email;
            req.session.username = name;
            req.session.cookie.maxAge = expireTime;

            res.redirect("/todo")
            return;
        }
    }
    res.redirect("/signup")
});



app.get('/login', (req, res) => {
    let missing = req.query.missing
    res.render("login", { missing: missing });
});

app.post('/validate_user', async (req, res) => {
    let user_email = req.body.user_email
    let user_password = req.body.user_password

    if (!user_email) {
        res.redirect('/login?missing=1')
    }
    if (!user_password) {
        res.redirect('/login?missing=2')
    }

    console.log("Going in authicateUser")
    let result = await authenticateUser(user_email, user_password)

    if (result.bool) {

        req.session.authenticated = true;
        req.session.authorization = result.user.usertype;
        req.session.user_id = result.user.user_id;
        req.session.user_email = result.user.email;
        req.session.username = result.user.name;
        req.session.cookie.maxAge = expireTime;

        if (req.session.authorization == "admin") {
            res.redirect("/admin")
            return
        }
        res.redirect("/todo")
        return;
    }
    //user and password combination not found
    res.redirect("/login")
});


app.get("/members", (req, res) => {
    console.log(req.session.user_email)
    if (req.session.authenticated) {
        res.render("members");
    } else {
        res.redirect('/login');
    }
});

app.post("/user_logout", (req, res) => {
    req.session.destroy();
    res.redirect("/")
});



app.get("/todo", async (req, res) => {

    let todo_result = await db_todo.getTodos({ id: req.session.user_id })
    res.render("todo", { name: req.session.username, todolist: todo_result })
});


app.post("/update_todo", async (req, res) => {

    let success = await db_todo.createTodo({ description: req.body.todo, user_id: req.session.user_id })
    if (success) {
        res.redirect('/todo')
        return;
    }
    res.redirect('/errorMessage')
});

app.get("/user/:id", async (req, res) => {
    let user_id = req.params.id;
    let todo_result = await db_todo.getTodos({ id: user_id })
    let user = await db_user.getUsers2({ id: user_id })

    res.render("todo_users", { username: user[0].name, todolist: todo_result })
    return;
});

app.use(express.static(__dirname + "/public"));

app.get("*", (req, res) => {
    res.status(404);
    res.send("<h1>Page not found - 404</h1>");
});

app.listen(port, () => {
    console.log("Node application listening on port " + port);
}); 