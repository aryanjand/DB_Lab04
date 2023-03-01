const database = include('databaseConnection');

async function createUser(postData) {
    let createUserSQL = `
		INSERT INTO user
		(name, email, password, user_type_id)
		VALUES
		(:name, :email, :password, 1);
	`;

    let params = {
        name: postData.name,
        email: postData.email,
        password: postData.password
    }

    try {
        const results = await database.query(createUserSQL, params);

        console.log("Successfully created user");
        console.log(results[0]);
        return true;
    }
    catch (err) {
        console.log("Error inserting user");
        console.log(err);
        return false;
    }
}

async function getUsers(postData) {
    let getUsersSQL = `
		SELECT user_id, name, email, password, user_type.usertype
		FROM user
        JOIN user_type USING (user_type_id)
        WHERE email = :email;
	`;

    let params = {
        email: postData.email,
    }

    try {
        const results = await database.query(getUsersSQL, params);

        console.log("Successfully retrieved users");
        console.log(results[0]);
        return results[0];
    }
    catch (err) {
        console.log("Error getting users");
        console.log(err);
        return false;
    }
}


async function getUsers2(postData) {
    let getUsersSQL = `
		SELECT name
		FROM user
        WHERE user_id = :id;
	`;

    let params = {
        id: postData.id,
    }

    try {
        const results = await database.query(getUsersSQL, params);

        console.log("Successfully retrieved users");
        console.log(results[0]);
        return results[0];
    }
    catch (err) {
        console.log("Error getting users");
        console.log(err);
        return false;
    }
}

async function getAllUsers() {
    let getUsersSQL = `
		SELECT user_id, name, email, password, user_type.usertype
		FROM user
        JOIN user_type USING (user_type_id)
        WHERE user_type_id != 2;
	`;

    try {
        const results = await database.query(getUsersSQL);

        console.log("Successfully retrieved users");
        console.log(results[0]);
        return results[0];
    }
    catch (err) {
        console.log("Error getting users");
        console.log(err);
        return false;
    }
}

module.exports = { createUser, getUsers, getAllUsers, getUsers2 };