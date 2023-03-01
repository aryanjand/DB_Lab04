const database = include('databaseConnection');

async function getTodos(postData) {
    let getZTodosSQL = `
SELECT description
FROM todo
JOIN user USING (user_id)
WHERE user_id = :id;
`;

    let params = {
        id: postData.id,
    }

    console.log("Printing pramas")
    console.log(params.id)

    try {
        const results = await database.query(getZTodosSQL, params);

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



async function createTodo(postData) {
    let getZTodosSQL = `
INSERT INTO todo
(description, user_id)
VALUES 
(:description, :user_id);
`;

    let params = {
        description: postData.description,
        user_id: postData.user_id
    }

    console.log("Printing pramas")
    console.log(params)

    try {
        const results = await database.query(getZTodosSQL, params);

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

module.exports = { getTodos, createTodo };