const express = require('express');
const port = process.env.PORT || 3000;
const app = express();
app.use(express.urlencoded({ extended: false }));

const bcrypt = require('bcrypt');
const saltRounds = 12;

let users = [];



app.get('/', (req, res) => {
    let html = `
    <form action="/signup" method="post">
        <button>Sign-Up</button>
    </form>
    <form action="/login" method="post">
        <button>Log-In</button>
    </form>
    `
    res.send(html)
});

app.post('/signup', (req, res) => {
    res.redirect('/signup')
});

app.post('/login', (req, res) => {
    res.redirect('/login')
})


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
    <form action='/vaildate_user' method='post'>
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

app.post('/vaildate_user', (req, res) => {
    let user_email = req.body.user_email
    let user_password = req.body.user_password

    if (!user_email) {
        res.redirect('/login?missing=1')
    } else if (!user_password) {
        res.redirect('/login?missing=2')
    }

    for (i = 0; i < users.length; i++) {
        if (users[i].email == user_email) {
            if (bcrypt.compareSync(user_password, users[i].password)) {
                res.redirect("/members")
                return;
            }
        }
    }
    //user and password combination not found
    req.redirect("/")
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
    users.push({ name: name, email: email, password: hashedPassword })
    res.redirect('/members')
});

app.get("/members", (req, res) => {
    res.send('<h2>Welcome</h2>')
})


app.use(express.static(__dirname + "/public"));

app.get("*", (req, res) => {
    res.status(404);
    res.send("<h1>Page not found - 404</h1>");
});

app.listen(port, () => {
    console.log("Node application listening on port " + port);
}); 