const bcrypt = require('bcrypt');
const express = require('express')
const bodyParser = require('body-parser')
const mysql = require('mysql2')
const app = express()
const http = require('http').createServer(app)
const io = require('socket.io')(http)

const port = 3000;

// Static Files
app.use(express.static(`${__dirname}/public/`))

// Body Parser
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

// MySQL Connection
var connection = mysql.createConnection({
    host     : 'localhost',
    user     : 'ravindra',
    password : 'ravindra',
    database : 'polymer_auth'
})

// A MySQL Call For Creating A Table
function createUserTable() {
    
    try {
        connection.connect()
        connection.query(`
        CREATE TABLE \`users\` (
            \`id\` int(11) NOT NULL AUTO_INCREMENT,
            \`first_name\` varchar(100) COLLATE utf8_unicode_ci NOT NULL,
            \`last_name\` varchar(100) COLLATE utf8_unicode_ci NOT NULL,
            \`email\` varchar(100) COLLATE utf8_unicode_ci NOT NULL,
            \`password\` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
            \`created\` datetime NOT NULL,
            \`modified\` datetime NOT NULL,
            PRIMARY KEY (\`id\`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;`, (error, results, fields) => {
                if (error) throw error
                else
                {
                    console.log(results);
                    return true
                }
            })
            connection.end()
    } catch (error)
    {
        connection.end()
        console.log(error)
        return false
    }
}

// Home Page
app.get('/', (req, res) => res.sendFile(`${__dirname}/public/index.html`))

// Call Create Users Table Query
app.get('/createUsersTable', (req, res) => {
    var message = createUserTable() ? "Table Created Successfully" : "Table creation failed"
    
    res.setHeader('Content-Type', 'application/json')
    res.status(200).end(JSON.stringify({
        message: message
    }));
})

// A Function for checking hasing
app.get('/hashing', (req, res) => {
    bcrypt.genSalt(10, function(err, salt) {
        bcrypt.hash('ravindra', salt, function(err, hash) {
            console.log(hash)
        });
    });
})

// Login Endpoing
app.post('/login', (req, res) => {
    // console.log(req.body);
    
    let username = req.body.username
    let password = req.body.password

    console.log(`${username} and ${password}`)

    // MySQL Select

    // execute will internally call prepare and query
    connection.execute(
        'SELECT * FROM `users` WHERE `email` = ?', [username], (err, results, fields) => {
            // console.log(results[0].name)
            // console.log(results.length)

            let user = results[0]
            console.log(user.password)
            bcrypt.compare(password, user.password, function(err, res) {
                // res == true
                console.log(res)
                // If True then login this user
            });
        }
    );

    res.send(req.body);
})

app.post('/register', (req, res) => {

})

// Websocket stuff
// When a new user is connectd
io.on('connection', socket => {
    console.log('A user connnected')

    // When a user is disconnected
    socket.on('disconnect', () => {
        console.log('A user disconnected')
        io.emit('chat message', 'A user left chat')
    })

    socket.on('chat message', msg => {
        console.log('New message: ' + msg)
        io.emit('chat message', msg)
    })
})

// Start a server
http.listen(port, () => console.log(`listing on 0.0.0.0:${port}`))