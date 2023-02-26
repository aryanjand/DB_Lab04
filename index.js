
require('dotenv').config();
const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const bcrypt = require('bcrypt');
const saltRounds = 12;

const port = process.env.PORT || 3005;

const app = express();

const mongo_user = process.env.MONGODB_USER;
const mongo_password = process.env.MONGODB_PASSWORD;
const mongo_session_id = process.env.MONGODB_SESSION_SECR;
const node_session_id = process.env.NODE_SESSION_SECRET;

app.set('view engine', 'ejs');

const expireTime = 1 * 60 * 60 * 1000

// In memory databse
let users = [];
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

function authenticateUser(req, user_email, user_password) {
    for (i = 0; i < users.length; i++) {
        if (users[i].email == user_email) {
            if (bcrypt.compareSync(user_password, users[i].password)) {
                req.session.authenticated = true;
                req.session.user_email = user_email;
                req.session.username = users[i].name;
                req.session.cookie.maxAge = expireTime;
                return true
            }
        }
    }
    return false
}

app.get('/', (req, res) => {
    res.render("index")
});

app.get('/signup', (req, res) => {
    let missing = req.query.missing;
    res.render("createUser", { missing: missing });
});

app.post("/create_user", (req, res) => {
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
    users.push(
        {
            name: name,
            email: email,
            password: hashedPassword
        }
    )
    if (authenticateUser(req, email, password)) {
        res.redirect("/members")
        return;
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
        res.redirect("/members")
        return;
    }
    //user and password combination not found
    res.redirect("/login")
})


app.get("/members", (req, res) => {
    if (req.session.authenticated) {
        let name = req.session.username
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