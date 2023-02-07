require('dotenv').config();
const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const bcrypt = require('bcrypt');
const saltRounds = 12;
var rand_int = Math.floor(Math.random() * 3) + 1

const port = process.env.PORT || 3000;

const app = express();

const mongo_user = process.env.MONGODB_USER;;
const mongo_password = process.env.MONGODB_PASSWORD;;
const mongo_session_id = process.env.MONGODB_SESSION_SECR;
const node_session_id = process.env.NODE_SESSION_SECRET;

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
    store: mongoStore,
    saveUninitialized: false,
    resave: true
}
));

app.get('/', (req, res) => {
    let html = `
    <form action="/signup" method="get">
        <button>Sign-Up</button>
    </form>
    <form action="/login" method="get">
        <button>Log-In</button>
    </form>
    `
    res.send(html)
});

app.get('/signup', (req, res) => {
    let missing = req.query.missing;
    html_signUp =
        `Create User
    <form action="/create_user" method="post">
        <input name="name" type="text" placeholder="Name"><br/>
        <input name="email" type="text" placeholder="Email"><br/>
        <input name="password" type="Password" placeholder="Password"><br/>
        <button>Submit</button >
    </form >`;

    if (missing == 1) {
        html_signUp += "<br/> Name is Required";
    } else if (missing == 2) {
        html_signUp += "<br/> Email is Required";
    } else if (missing == 3) {
        html_signUp += "<br/> Passcode is Required";
    }
    res.send(html_signUp)
});


app.get('/login', (req, res) => {
    let missing = req.query.missing
    html_login = `
    Login User
    <form action='/validate_user' method='post'>
        <input name="user_email" type="text" placeholder='Email'>
        <input name="user_password" type="password" placeholder="Password">
        <button>Submit</button>
    </form>
    `
    if (missing == 1) {
        html_login += '<br/>Email is Required'
    } else if (missing == 2) {
        html_login += '<br/>Password is Required'
    }

    res.send(html_login)
});

app.post('/validate_user', (req, res) => {
    let user_email = req.body.user_email
    let user_password = req.body.user_password
    if (!user_email) {
        res.redirect('/login?missing=1')
    }
    else if (!user_password) {
        res.redirect('/login?missing=2')
    }

    for (i = 0; i < users.length; i++) {
        if (users[i].email == user_email) {
            if (bcrypt.compareSync(user_password, users[i].password)) {
                req.session.authenticated = true;
                req.session.user_email = user_email;
                req.session.username = users[i].name;
                req.session.cookie.maxAge = expireTime;
                console.log("debug")
                res.redirect("/members")
            }
        }
    }
    //user and password combination not found
    // res.redirect("/")
})

app.post("/create_user", (req, res) => {
    let name = req.body.name
    let email = req.body.email
    let password = req.body.password

    if (!name) {
        res.redirect('/signup?missing=1')
    }
    else if (!email) {
        res.redirect("/signup?missing=2")
    }
    else if (!password) {
        res.redirect("/signup?missing=3")
    }
    let hashedPassword = bcrypt.hashSync(password, saltRounds)
    users.push(
        {
            name: name,
            email: email,
            password: hashedPassword
        }
    )
    console.log("going to members")
    // have fix this
    res.redirect("/login")

});

app.get("/members", (req, res) => {
    console.log("In members");
    if (req.session.authenticated) {
        console.log(rand_int);
        html_members = `
        <h2>Welcome ${req.session.username}</h2>
        <img src='${rand_int}.jpg'>
        <form action='/user_logout' method='post'>
        <button>Log Out</button>
        </form>
        `;
        res.send(html_members);
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