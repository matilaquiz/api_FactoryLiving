const { MongoClient } = require('mongodb');

const url = "mongodb+srv://anabellac:anabella@cluster0.epch9ea.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

const client = new MongoClient(url, {useNewUrlParser: true,useUnifiedTopology: true});

async function main() {
    try {
        await client.connect();
        console.log('Conectado a MongoDB Atlas');

        const database = client.db('Factory');

        // Listar las colecciones
        const collections = await database.listCollections().toArray();
        console.log('Colecciones en la base de datos Factory:');
        collections.forEach(collection => console.log(` - ${collection.name}`));

        //const databasesList = await client.db().admin().listDatabases();
        
        console.log('Bases de datos:');
        //databasesList.databases.forEach(db => console.log(` - ${db.name}`));
      
    } catch (err) {
        console.error(err);
    } finally {
        await client.close();
    }
}

main().catch(console.error);

/*const MongoClient = require('mongodb').MongoClient;

// URL de conexión a tu base de datos en MongoDB Atlas
const url = "mongodb+srv://matiaslaquiz:matiaslaquiz@cluster0.rbd2wda.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

MongoClient.connect(url, function(err, client) {
  if (err) throw err;
  console.log("¡Conexión exitosa!");

  // Realizar operaciones en la base de datos

  client.close();
});*/