
const express = require('express');
const app = express();
const port = 3000;
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



app.get('/traerProductos/', (req, res) => {
  const sql = `SELECT IdProducto, Nombre, Descripcion, Precio, Imagen FROM producto`;
  db.query(sql, (err, results) => {
    if (err) {
      return res.status(400).send(err);
    }
    res.status(200).send(results);
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
          const stockDifference = parseInt(result2[0].CantPorMP) - (parseInt(materiaPrimaPorProducto.CantMp) * ventaReq.cantidad);
          const updateQuery = `UPDATE stock SET CantPorMP=${stockDifference} WHERE IdMateriaPrima=${materiaPrimaPorProducto.IdMateriaPrima}`;

          db.query(updateQuery)
        })
      })
    });

  }
  actualizarStock();

  const query2 = `INSERT INTO ventas SET ?`
  db.query(query2, ventaReq, (err) => {
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



//--------------------------------------Proveedor------------------------------//

app.post('/cargarProveedor', (req, res) => {
  const nuevoProveedor = req.body;
  const sql = 'INSERT INTO proveedores SET ?';
  db.query(sql, nuevoProveedor, (err) => {
    if (err) {
      return res.status(500).send(err);
    }
    res.send('Dato insertado');
  });
});


app.get('/traerProveedores/', (req, res) => {
  const sql = `SELECT IdProveedor, NombreProveedor,TipoProveedor, TelefonoProveedor, MailProveedor FROM proveedores`;
  db.query(sql, (err, results) => {
    if (err) {
      return res.status(400).send(err);
    }
    res.status(200).send(results);
  });
});



app.get('/ProveedorMod/:id', (req, res) => {
  const { id } = req.params;
  console.log({ id })
  const sql = `SELECT * FROM proveedores WHERE IdProveedor=${id}`;
  db.query(sql, (err, results) => {
    if (err) {
      return res.status(400).send(err);
    }
    console.log(results[0])
    res.status(200).send(results[0]);

  });


});
app.put('/cargarProveedor/:id', (req, res) => {
  const { id } = req.params;
  const nuevoProveedor = req.body
  const sql = `UPDATE proveedores SET ? WHERE IdProveedor=${id}`

  db.query(sql, nuevoProveedor, (error, results) => {
    if (error) {
      return res.status(400).send(error)
    }
    res.status(200).send(results)
  })
})

app.delete('/eliminarProveedor/:id', (req, res) => {
  const { id } = req.params;
  const sql = `DELETE FROM proveedores where IdProveedor= ?`
  db.query(sql, [id], (err, result) => {
    if (err) throw err;
    res.status(204).send('Cliente eliminado');

  })
})


//-----------------------Producto-------------------------------------//
app.get('/buscarPatas', (req, res) => {
  const sql = `SELECT * FROM materiaprima WHERE Nombre LIKE "%patas%" `
  db.query(sql, (err, results) => {
    if (err) throw err;
    res.status(200).send(results)

  })
})

app.get('/buscarTelas', (req, res) => {
  const sql = `SELECT * FROM materiaprima WHERE Nombre LIKE "%tela%" `
  db.query(sql, (err, results) => {
    if (err) throw err;
    res.status(200).send(results)

  })
})

app.post('/cargarProducto', (req, res) => {
  const producto = req.body;
  const sql = `INSERT INTO producto (Nombre , Descripcion , Precio , Imagen) VALUES(?,?,?,?) `
  db.query(sql, [producto.Nombre, producto.Descripcion, producto.Precio, producto.Imagen], (err, results) => {
    if (err) throw err;

    producto.materiales.forEach((material) => {
      const sql2 = 'INSERT INTO mpporproducto (CantMp, IdProducto, IdMateriaPrima) VALUES (?,?,?)';
      db.query(sql2, [material.cantidad, results.insertId, material.id], (err2) => {
        if (err2) throw err2;
        res.status(200).send(results[0])
      })
    })
  })
})

app.put('/cargarProducto/:id', (req, res) => {
  const { id }=req.params;
  const producto = req.body;
  console.log(req.body)
  const sql = `UPDATE producto SET Nombre=? , Descripcion=? , Precio=? , Imagen=? WHERE IdProducto= ${id} `
  db.query(sql, [producto.Nombre, producto.Descripcion, producto.Precio, producto.Imagen], (err, results) => {
    if (err) throw err;
    

    producto.materiales.forEach((material) => {
      let idMaterial=material.id;
      const sql2 = `UPDATE mpporproducto SET CantMp=?  WHERE  IdProducto=${id} AND IdMateriaPrima=${idMaterial}`;
      db.query(sql2, [material.cantidad], (err2) => {
        if (err2) throw err2;
       
        res.status(200).send(results[0])
      })
      
        
      
    })
  })
})

app.delete('/eliminarProducto/:id', (req, res) => {
  const { id } = req.params;
  const query = 'DELETE FROM producto WHERE IdProducto = ?';
  db.query(query, [id], (err, result) => {
    if (err) throw err;
    const query2='DELETE FROM mpporproducto WHERE IdProducto = ?';
    db.query(query2,[id],(err2,)=>{
     if(err2) throw err2
      res.status(204).send(result);
    })
      
  });

});

app.get('/ProductoMod/:id', (req, res) => {
  const { id } = req.params;
  console.log({ id })
  const sql = `SELECT * FROM producto WHERE IdProducto=${id}`;
  db.query(sql, (err, results) => {
    if (err) {
      return res.status(400).send(err);
    }
    
    res.status(200).send(results[0]);

  });


});
app.get('/MaterialesProductoMod/:id', (req, res) => {
  const { id } = req.params;
  console.log({ id })
  const sql = `SELECT * FROM mpporproducto WHERE IdProducto=${id}`;
  db.query(sql, (err, results) => {
    if (err) {
      return res.status(400).send(err);
    }
    console.log(results)
    res.status(200).send(results);

  });


});


app.listen(port, () => {
  console.log("server ok")
})