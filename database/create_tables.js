const database = include('databaseConnection');

async function createTables() {
    let createUserSQL = `
    CREATE TABLE IF NOT EXISTS user (
        user_id INT NOT NULL AUTO_INCREMENT,
        name VARCHAR(25) NOT NULL,
        email VARCHAR(25) NOT NULL,
        password VARCHAR(100) NOT NULL,
        user_type_id INT NOT NULL,
        PRIMARY KEY (user_id),
        UNIQUE INDEX unique_email (email ASC) VISIBLE,
        FOREIGN KEY (user_type_id) REFERENCES user_type(user_type_id)
        ON DELETE NO ACTION
        ON UPDATE NO ACTION
      );
      
	`;
    let createuserTypeSQL = `
    CREATE TABLE IF NOT EXISTS user_type (
        user_type_id INT NOT NULL AUTO_INCREMENT,
        usertype VARCHAR(25) NOT NULL,
        PRIMARY KEY (user_type_id)); 
	`;

    let createTodoSQL = `
		CREATE TABLE IF NOT EXISTS todo (
            todo_id INT NOT NULL AUTO_INCREMENT,
            description VARCHAR(250) NOT NULL,
            user_id INT NOT NULL,
            PRIMARY KEY (todo_id),
            FOREIGN KEY (user_id) REFERENCES user(user_id));
	`;


    try {
        const user_type_results = await database.query(createuserTypeSQL);
        const user_results = await database.query(createUserSQL);
        const todo_results = await database.query(createTodoSQL);

        console.log("Successfully created tables");
        console.log(results[0]);
        return true;
    }
    catch (err) {
        console.log("Error Creating tables");
        console.log(err);
        return false;
    }
}

module.exports = { createTables };