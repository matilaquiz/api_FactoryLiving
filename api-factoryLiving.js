
const express = require('express');
const app=express();
const port=3000;
const cors = require('cors')
const mysql = require('mysql2');

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "factory"
});

db.connect(err => {
  if (err) {
    console.error('error connecting: ' + err.stack);
    return;
  }
  console.log('connected as id ' + db.threadId);
});

module.exports = db;
app.use(express.json())

app.use(express.urlencoded({ extended: true }));
app.use(cors())

app.get('/provincias', (req, res) => {
    const sql = 'SELECT * FROM provincias';
    db.query(sql, (err, results) => {
      if (err) {
        return res.status(400).send(err);
      }
      res.status(200).send(results);
    });
  });

  app.get('/localidadxprovincia/:id', (req, res) => {
    const { id } = req.params;
    const sql = `SELECT * FROM localidad WHERE IdProvincia=${id}`;
    db.query(sql, (err, results) => {
      if (err) {
        return res.status(400).send(err);
      }
      res.status(200).send(results);
    });
   
});


  app.get('/barrioxlocalidad/:id', (req, res) => {
    const { id } = req.params;
    const sql = `SELECT * FROM barrios WHERE IdLocalidad=${id}`;
    db.query(sql, (err, results) => {
      if (err) {
        return res.status(400).send(err);
      }
      res.status(200).send(results);
    });
   
});

app.get('/clienteMod/:id', (req, res) => {
  const { id } = req.params;
  const sql = `SELECT * FROM clientes WHERE Id=${id}`;
  db.query(sql, (err, results) => {
    if (err) {
      return res.status(400).send(err);
    }
    res.status(200).send(results[0]);
  });
 
});

app.get('/traerProductos/', (req, res) => {
  const sql = `SELECT IdProducto, Nombre, Descripcion, Precio, Imagen FROM producto`;
  db.query(sql, (err, results) => {
    if (err) {
      return res.status(400).send(err);
    }
    res.status(200).send(results);
  });
 
});

app.post('/cargarCliente', (req, res) => {
  const nuevoCliente = req.body;
  const sql = 'INSERT INTO clientes SET ?';
  db.query(sql, nuevoCliente, (err) => {
    if (err) {
      return res.status(500).send(err);
    }
    res.send('Dato insertado');
  });
});

/**
 * {
 *    idCliente: str
 *    idProducto: str
 *    cantidad: str
 * }
 * 
 */

app.post('/cargarVenta', (req, res) => {
  const ventaReq = req.body;
  const actualizarStock = () => {
    const query = `SELECT * FROM mpporproducto WHERE IdProducto=${ventaReq.idProducto}`;
 
    
    db.query(query, (err, result) => {
      if (err) return 'Error en el select de mpPorProd'
      
      result.forEach((materiaPrimaPorProducto) => {
        db.query(`SELECT CantPorMP FROM stock WHERE IdMateriaPrima=${materiaPrimaPorProducto.IdMateriaPrima}`, (_, result2) => {
          const stockDifference= parseInt(result2[0].CantPorMP) - (parseInt(materiaPrimaPorProducto.CantMp) * ventaReq.cantidad);
          const updateQuery = `UPDATE stock SET CantPorMP=${stockDifference} WHERE IdMateriaPrima=${materiaPrimaPorProducto.IdMateriaPrima}`;
          
          db.query(updateQuery)
        })
      })
    });
 
  }
  actualizarStock();

  const query2=`INSERT INTO ventas SET ?`
  db.query(query2, ventaReq , (err) => {
    if (err) {
      return res.status(500).send(err);
    }
    res.send('Venta guardada exitosamente');
  });
});


  app.get('/traerStock/', (req, res) => {
    const sql = `SELECT S.IdStock, M.Nombre, S.CantPorMP FROM materiaprima AS M, stock AS S WHERE S.IdMateriaPrima=M.IdMateriaPrima`;
    db.query(sql, (err, results) => {
      if (err) {
        return res.status(400).send(err);
      }
      res.status(200).send(results);
    });
  });

app.put('/cargarCliente/:id', (req, res) => {
  const { id } = req.params;
  const modificacionCliente = req.body;
  const sql = `UPDATE clientes SET ? WHERE Id=${id}`;
  db.query(sql, modificacionCliente, (err) => {
    if (err) {
      return res.status(500).send(err);
    }
    res.send('Dato actualizado');
  });
});



app.get('/traerClientes/', (req, res) => {
  const sql = `SELECT Id, Nombre, Apellido, Telefono, Email FROM clientes`;
  db.query(sql, (err, results) => {
    if (err) {
      return res.status(400).send(err);
    }
    res.status(200).send(results);
  });
});


  app.delete('/eliminarCliente/:id', (req, res) => {
    const { id } = req.params;
    const query = 'DELETE FROM clientes WHERE id = ?';
    db.query(query, [id], (err, result) => {
        if (err) throw err;
        res.status(204).send('Cliente eliminado');
       
    });
   
});


app.listen(port,()=>{
    console.log("server ok")
})

