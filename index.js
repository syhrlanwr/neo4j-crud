const neo4j = require('neo4j-driver');
const express = require('express');
const app = express();
const port = 3000;

const driver = neo4j.driver(
    'bolt://localhost:7687',
    neo4j.auth.basic('neo4j', 'bitnami'));

    
async function executeQuery(query) {
    const session = driver.session();
    try {
        const result = await session.run(query);
        return result.records;
    } catch (error) {
        console.log(error);
    } finally {
        await session.close();
    }
}

app.set('view engine', 'ejs');

app.use(express.urlencoded({ extended: false }));

app.get('/', async (req, res) => {
    const query = 'MATCH (n:customers) RETURN n LIMIT 25';
    const result = await executeQuery(query);
    const customers = result.map(r => r.get('n').properties);
    res.render('index', { customers });
});

app.get('/add', (req, res) => {
    res.render('add-form');
});

app.post('/add', async (req, res) => {
    const { name, email, phone } = req.body;
    const idquery = 'MATCH (n:customers) RETURN n.id AS id ORDER BY n.id DESC LIMIT 1';
    const result = await executeQuery(idquery);
    let id;
    if (result.length == 0) {
        id = 1;
    } else {
        id = result[0].get('id') + 1;
    }
    const query = `CREATE (n:customers {id: ${id}, name: '${name}', email: '${email}', phone: '${phone}'})`;
    await executeQuery(query);
    res.redirect('/');
});

app.get('/delete/:id', async (req, res) => {
    const id = req.params.id;
    const query = `MATCH (n:customers {id: ${id}}) DETACH DELETE n`;
    await executeQuery(query);
    res.redirect('/');
});

app.get('/edit/:id', async (req, res) => {
    const id = req.params.id;
    const query = `MATCH (n:customers {id: ${id}}) RETURN n`;
    const result = await executeQuery(query);
    const customer = result[0].get('n').properties;
    res.render('edit-form', { customer });
});

app.post('/edit/:id', async (req, res) => {
    const id = req.params.id;
    const { name, email, phone } = req.body;
    const query = `MATCH (n:customers {id: ${id}}) SET n.name = '${name}', n.email = '${email}', n.phone = '${phone}'`;
    await executeQuery(query);
    res.redirect('/');
});


app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
});