const express = require("express");
const app = express();
const port = 3000;
const cors = require("cors");
const mysql = require("mysql2");

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "chipote10",
  database: "factory",
});

db.connect((err) => {
  if (err) {
    console.error("error connecting: " + err.stack);
    return;
  }
  console.log("connected as id " + db.threadId);
});

module.exports = db;
app.use(express.json());

app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.get("/buscarUsuario", (req, res) => {
  const sql = "SELECT * FROM usuarios";
  db.query(sql, (err, results) => {
    if (err) {
      return res.status(400).send(err);
    }
    res.status(200).send(results);
  });
});

app.get("/provincias", (req, res) => {
  const sql = "SELECT * FROM provincias";
  db.query(sql, (err, results) => {
    if (err) {
      return res.status(400).send(err);
    }
    res.status(200).send(results);
  });
});

app.get("/localidadxprovincia/:id", (req, res) => {
  const { id } = req.params;
  const sql = `SELECT * FROM localidad WHERE IdProvincia=${id}`;
  db.query(sql, (err, results) => {
    if (err) {
      return res.status(400).send(err);
    }
    res.status(200).send(results);
  });
});

app.get("/barrioxlocalidad/:id", (req, res) => {
  const { id } = req.params;
  const sql = `SELECT * FROM barrios WHERE IdLocalidad=${id}`;
  db.query(sql, (err, results) => {
    if (err) {
      return res.status(400).send(err);
    }
    res.status(200).send(results);
  });
});

app.get("/traerProductos/", (req, res) => {
  const sql = `SELECT P.IdProducto, P.Nombre, P.Descripcion, P.Precio, I.nombreSillon FROM producto AS P INNER JOIN imagenessillones AS I ON P.Imagen=I.idimagenesSillones `;
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
//--------------------------------------Ventas---------------------------------------
// app.post("/cargarVenta", (req, res) => {
//   const ventaReq = req.body;
//   const sql = `INSERT INTO ventas ( IdCliente, fechaVenta , estado) VALUES(?,?,?) `;
//   db.query(
//     sql,
//     [ventaReq.idCliente, ventaReq.fechaVenta, ventaReq.estado],
//     (err, results) => {
//       if (err) throw err;

//       ventaReq.productos.forEach((producto) => {
//         const sql2 =
//           "INSERT INTO detallesdeventa (idventa, idproducto, cantidad) VALUES (?,?,?)";
//         db.query(
//           sql2,
//           [results.insertId, producto.id, producto.cantidad],
//           (err2) => {
//             if (err2) throw err2;
//             res.status(200).send(results[0]);
//           }
//         );
//       });
//     }
//   );
// });
app.post("/cargarVenta", (req, res) => {
  const ventaReq = req.body;
  const sql = `INSERT INTO ventas (IdCliente, fechaVenta, estado) VALUES (?, ?, ?)`;

  db.query(
    sql,
    [ventaReq.idCliente, ventaReq.fechaVenta, ventaReq.estado],
    (err, results) => {
      if (err) {
        console.error("Error al insertar en ventas:", err);
        return res.status(500).send("Error en la base de datos");
      }

      const idVenta = results.insertId; // Obtener el ID de la venta recién insertada

      // Crear promesas para insertar los productos
      const insertDetalles = ventaReq.productos.map((producto) => {
        return new Promise((resolve, reject) => {
          const sql2 =
            "INSERT INTO detallesdeventa (idventa, idproducto, cantidad) VALUES (?, ?, ?)";
          db.query(sql2, [idVenta, producto.id, producto.cantidad], (err2) => {
            if (err2) {
              console.error("Error al insertar en detallesdeventa:", err2);
              reject(err2);
            } else {
              resolve();
            }
          });
        });
      });

      // Esperar a que todas las inserciones terminen antes de responder
      Promise.all(insertDetalles)
        .then(() => {
          res
            .status(200)
            .json({ message: "Venta registrada con éxito", idVenta });
        })
        .catch((error) => {
          res.status(500).send("Error al insertar detalles de venta");
        });
    }
  );
});

app.put("/confirmarVenta/:id/:estado", (req, res) => {
  const id = req.params.id;
  const estado = req.params.estado;
  const sql = `UPDATE ventas SET estado=? WHERE IdVentas=?`;
  db.query(sql, [estado, id], (err, result) => {
    if (err) {
      res.status(400).send(err);
    }
    res.status(200).send(result);
  });
});

app.get("/traerVentas", (req, res) => {
  const sql = `SELECT  V.IdVentas,V.fechaVenta,V.estado, C.Nombre, C.Apellido,C.Telefono,C.Email FROM ventas AS V, clientes AS C WHERE V.IdCliente=C.Id`;
  db.query(sql, (err, results) => {
    if (err) {
      return res.status(400).send(err);
    }
    res.status(200).send(results);
  });
});

app.get("/traerDetalleVenta/:id", (req, res) => {
  const { id } = req.params;
  const sql = `SELECT 
  P.Nombre, 
  P.Precio, 
  D.cantidad
FROM 
  ventas AS V
INNER JOIN 
  detallesdeventa AS D
ON  
  V.IdVentas=D.idventa
INNER JOIN 
  producto AS P
ON  
  D.idproducto= P.IdProducto
WHERE 
  V.IdVentas=?
`;
  db.query(sql, [id], (err, results) => {
    if (err) {
      return res.status(400).send(err);
    }
    res.status(200).send(results);
  });
});

app.get("/getMaterialesVentas/:id", (req, res) => {
  const { id } = req.params;

  const sql = `
        SELECT 
            dv.idventa,
            dv.idproducto,
            dv.cantidad AS cantidad_vendida,
            mp.IdMateriaPrima,
            mp.CantMp AS cantidad_por_producto,
            (dv.cantidad * mp.CantMp) AS cantidad_total_mp
        FROM detallesdeventa dv
        JOIN mpporproducto mp ON dv.idproducto = mp.IdProducto
        WHERE dv.idventa = ?;
    `;

  db.query(sql, [id], (err, results) => {
    if (err) {
      console.error("Error en la consulta:", err);
      return res.status(500).send("Error al obtener los materiales.");
    }

    // Agrupar y sumar la cantidad total de cada materia prima
    let materialesAgrupados = {};

    results.forEach((row) => {
      if (!materialesAgrupados[row.IdMateriaPrima]) {
        materialesAgrupados[row.IdMateriaPrima] = {
          IdMateriaPrima: row.IdMateriaPrima,
          cantidad_total_mp: 0,
        };
      }
      materialesAgrupados[row.IdMateriaPrima].cantidad_total_mp +=
        row.cantidad_total_mp;
    });

    // Convertir objeto en array
    const materialesFinales = Object.values(materialesAgrupados);

    res.json(materialesFinales);
  });
});

app.put("/actualizarStock", async (req, res) => {
  const actualizarStock = async () => {
    const sql = `UPDATE stock SET CantPorMP = CantPorMP - ? WHERE IdMateriaPrima = ?`;

    try {
      for (const mp of req.body) {
        await new Promise((resolve, reject) => {
          db.query(
            sql,
            [mp.cantidad_total_mp, mp.IdMateriaPrima],
            (err, result) => {
              if (err) reject(err);
              else resolve(result);
            }
          );
        });
      }

      console.log("Stock actualizado correctamente");
    } catch (error) {
      console.error("Error actualizando stock:", error);
    }
  };

  const results = await actualizarStock();

  res.status(200).send(results);
});

app.get("/traerStock/", (req, res) => {
  const sql = `SELECT S.IdStock, M.Nombre, S.CantPorMP , S.StockMinimo, S.IdMateriaPrima FROM materiaprima AS M, stock AS S WHERE S.IdMateriaPrima=M.IdMateriaPrima`;
  db.query(sql, (err, results) => {
    if (err) {
      return res.status(400).send(err);
    }
    res.status(200).send(results);
  });
});

app.put("/cargarCliente/:id", (req, res) => {
  const { id } = req.params;
  const modificacionCliente = req.body;
  const sql = `UPDATE clientes SET ? WHERE Id=${id}`;
  db.query(sql, modificacionCliente, (err) => {
    if (err) {
      return res.status(500).send(err);
    }
    res.send("Dato actualizado");
  });
});

app.post("/cargarCliente", (req, res) => {
  const nuevoCliente = req.body;
  const sql = "INSERT INTO clientes SET ?";
  db.query(sql, nuevoCliente, (err) => {
    if (err) {
      return res.status(400).send(err);
    }
    res.send("Dato insertado");
  });
});

app.get("/traerClientes/", (req, res) => {
  const sql = `SELECT Id, Nombre, Apellido, Telefono, Email FROM clientes`;
  db.query(sql, (err, results) => {
    if (err) {
      return res.status(400).send(err);
    }
    res.status(200).send(results);
  });
});

app.delete("/eliminarCliente/:id", (req, res) => {
  const { id } = req.params;
  const query = "DELETE FROM clientes WHERE id = ?";
  db.query(query, [id], (err, result) => {
    if (err) throw err;
    res.status(204).send("Cliente eliminado");
  });
});

app.get("/clienteMod/:id", (req, res) => {
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

app.post("/cargarProveedor", (req, res) => {
  const nuevoProveedor = req.body;
  const sql = "INSERT INTO proveedores SET ?";
  db.query(sql, nuevoProveedor, (err) => {
    if (err) {
      return res.status(500).send(err);
    }
    res.send("Dato insertado");
  });
});

app.get("/traerProveedores/", (req, res) => {
  const sql = `SELECT IdProveedor, NombreProveedor,TipoProveedor, TelefonoProveedor, MailProveedor,Identificador FROM proveedores`;
  db.query(sql, (err, results) => {
    if (err) {
      return res.status(400).send(err);
    }
    res.status(200).send(results);
  });
});

app.get("/ProveedorMod/:id", (req, res) => {
  const { id } = req.params;
  console.log({ id });
  const sql = `SELECT * FROM proveedores WHERE IdProveedor=${id}`;
  db.query(sql, (err, results) => {
    if (err) {
      return res.status(400).send(err);
    }
    console.log(results[0]);
    res.status(200).send(results[0]);
  });
});
app.put("/cargarProveedor/:id", (req, res) => {
  const { id } = req.params;
  const nuevoProveedor = req.body;
  const sql = `UPDATE proveedores SET ? WHERE IdProveedor=${id}`;

  db.query(sql, nuevoProveedor, (error, results) => {
    if (error) {
      return res.status(400).send(error);
    }
    res.status(200).send(results);
  });
});

app.delete("/eliminarProveedor/:id", (req, res) => {
  const { id } = req.params;
  const sql = `DELETE FROM proveedores where IdProveedor= ?`;
  db.query(sql, [id], (err, result) => {
    if (err) throw err;
    res.status(204).send("Cliente eliminado");
  });
});

//-----------------------Producto-------------------------------------//

app.get("/buscarImagenes", (req, res) => {
  const sql = "SElECT * FROM imagenessillones ";
  db.query(sql, (err, results) => {
    if (err) throw err;
    res.status(200).send(results);
  });
});
app.get("/buscarPatas", (req, res) => {
  const sql = `SELECT * FROM materiaprima WHERE Nombre LIKE "%patas%" `;
  db.query(sql, (err, results) => {
    if (err) throw err;
    res.status(200).send(results);
  });
});

app.get("/buscarTelas", (req, res) => {
  const sql = `SELECT * FROM materiaprima WHERE Nombre LIKE "%tela%" `;
  db.query(sql, (err, results) => {
    if (err) throw err;
    res.status(200).send(results);
  });
});

app.post("/cargarProducto", (req, res) => {
  const producto = req.body;
  const sql = `INSERT INTO producto (Nombre , Descripcion , Precio , Imagen) VALUES(?,?,?,?) `;
  db.query(
    sql,
    [producto.Nombre, producto.Descripcion, producto.Precio, producto.Imagen],
    (err, results) => {
      if (err) throw err;

      producto.materiales.forEach((material) => {
        const sql2 =
          "INSERT INTO mpporproducto (CantMp, IdProducto, IdMateriaPrima) VALUES (?,?,?)";
        db.query(
          sql2,
          [material.cantidad, results.insertId, material.id],
          (err2) => {
            if (err2) throw err2;
            res.status(200).send(results[0]);
          }
        );
      });
    }
  );
});

app.put("/cargarProducto/:id", (req, res) => {
  const { id } = req.params;
  const producto = req.body;
  console.log(req.body);
  const sql = `UPDATE producto SET Nombre=? , Descripcion=? , Precio=? , Imagen=? WHERE IdProducto= ${id} `;
  db.query(
    sql,
    [producto.Nombre, producto.Descripcion, producto.Precio, producto.Imagen],
    (err, results) => {
      if (err) throw err;

      producto.materiales.forEach((material) => {
        let idMaterial = material.id;
        const sql2 = `UPDATE mpporproducto SET CantMp=?  WHERE  IdProducto=${id} AND IdMateriaPrima=${idMaterial}`;
        db.query(sql2, [material.cantidad], (err2) => {
          if (err2) throw err2;

          res.status(200).send(results[0]);
        });
      });
    }
  );
});

app.delete("/eliminarProducto/:id", (req, res) => {
  const { id } = req.params;
  const query = "DELETE FROM producto WHERE IdProducto = ?";
  db.query(query, [id], (err, result) => {
    if (err) throw err;
    const query2 = "DELETE FROM mpporproducto WHERE IdProducto = ?";
    db.query(query2, [id], (err2) => {
      if (err2) throw err2;
      res.status(204).send(result);
    });
  });
});

app.get("/ProductoMod/:id", (req, res) => {
  const { id } = req.params;
  console.log({ id });
  const sql = `SELECT * FROM producto WHERE IdProducto=${id}`;
  db.query(sql, (err, results) => {
    if (err) {
      return res.status(400).send(err);
    }

    res.status(200).send(results[0]);
  });
});
app.get("/MaterialesProductoMod/:id", (req, res) => {
  const { id } = req.params;
  console.log({ id });
  const sql = `SELECT * FROM mpporproducto WHERE IdProducto=${id}`;
  db.query(sql, (err, results) => {
    if (err) {
      return res.status(400).send(err);
    }
    console.log(results);
    res.status(200).send(results);
  });
});

//para gestion de compras de materia prima

app.get("/buscarMateriaPrima", (req, resp) => {
  const sql = `SELECT * FROM materiaprima `;
  db.query(sql, (err, results) => {
    if (err) throw err;
    resp.status(200).send(results);
  });
});

app.post("/cargarMP", (req, res) => {
  const MP = req.body;
  const precio = 0;
  const sql =
    "INSERT INTO materiaprima (PrecioUnitario,Nombre,Descripcion) VALUES(?,?,?)";
  db.query(sql, [precio, MP.nombre, MP.unidad], (err, result) => {
    if (err) {
      console.error("Error al insertar en materiaprima:", err);
      return res.status(500).send({ error: "Error al guardar materia prima" });
    }

    const id = result.insertId;

    const sql =
      "INSERT INTO stock (IdMateriaPrima,CantPorMP,FechaIngreso,stockMinimo) VALUES(?,?,?,?)";
    db.query(sql, [id, MP.cantidad, MP.fecha, MP.minimo], (err2, result2) => {
      if (err2) {
        console.error("Error al insertar en stock:", err2);
        return res.status(500).send({ error: "Error al guardar stock" });
      }

      res.status(200).send({
        message: "Materia prima y stock guardados correctamente",
        idMateriaPrima: id,
      });
    });
  });
});

app.put("/cargarMP/:id", (req, res) => {
  const { id } = req.params;
  const { nombre, unidad, cantidad, minimo } = req.body;
  const sql = `UPDATE materiaprima M JOIN stock S ON M.IdMateriaPrima = S.IdMateriaPrima SET M.Nombre=?, M.Descripcion=?,S.CantPorMP=? , S.StockMinimo=? WHERE M.IdMateriaPrima=?`;
  db.query(sql, [nombre, unidad, cantidad, minimo, id], (err, result) => {
    if (err) {
      return res.status(500).send(err);
    }
    res.status(200).send(result);
  });
});

app.get("/traerMP/:id", (req, res) => {
  const { id } = req.params;
  const sql =
    "SELECT M.Nombre, M.Descripcion,S.CantPorMP,S.StockMinimo FROM materiaprima M JOIN stock S ON M.IdMateriaPrima = S.IdMateriaPrima  WHERE M.IdMateriaPrima = ?";
  db.query(sql, [id], (err, result) => {
    if (err) {
      return res.status(500).send(err);
    }
    res.status(200).send(result[0]);
  });
});

app.post("/cargarCompras", (req, res) => {
  const compra = req.body;
  const fecha = compra.fecha;
  const fe = new Date(fecha);
  const sql = `INSERT INTO compras (IdProveedor , Fecha ,Estado) VALUES(?,?,?) `;
  db.query(sql, [compra.id, compra.fecha, compra.estado], (err, results) => {
    if (err) throw err;

    compra.MP.forEach((mp) => {
      const sql2 =
        "INSERT INTO detallescompras (IdCompra, IdMP, CantMP,PrecioMP) VALUES (?,?,?,?)";
      db.query(
        sql2,
        [results.insertId, mp.id, mp.cantidad, mp.precio],
        (err2) => {
          if (err2) throw err2;
          res.status(200).send(results[0]);
        }
      );
    });
  });
});

app.get("/traerCompras", (req, res) => {
  const sql = `SELECT  C.IdCompra,C.Fecha,C.Estado, P.NombreProveedor FROM compras AS C, proveedores AS P WHERE C.IdProveedor=P.IdProveedor`;
  db.query(sql, (err, results) => {
    if (err) {
      return res.status(400).send(err);
    }
    res.status(200).send(results);
  });
});

app.get("/traerComprasConDetalle/:id", (req, res) => {
  const { id } = req.params;
  const sql = `SELECT  IdCompra, IdMP, CantMP  FROM detallescompras  WHERE IdCompra=${id}`;
  db.query(sql, (err, results) => {
    results.forEach((x) => {
      const sql = `SELECT  IdMateriaPrima, CantPorMP FROM stock WHERE IdMateriaPrima=${x.IdMP}`;
      db.query(sql, (err, results2) => {
        const cantFinal = parseInt(results2[0].CantPorMP) + parseInt(x.CantMP);
        const sql2 = `UPDATE stock SET CantPorMP=${cantFinal} WHERE IdMateriaPrima=${results2[0].IdMateriaPrima} `;
        db.query(sql2, (err, result3) => {});
      });
    });
    if (err) {
      return res.status(400).send(err);
    }
    res.status(200).send(results);
  });
});

app.get("/traerDetalleCompra/:id", (req, res) => {
  const { id } = req.params;
  const sql = `SELECT  D.CantMP, D.PrecioMP,M.Nombre FROM detallescompras AS D , materiaprima AS M WHERE D.IdCompra=${id} AND M.IdMateriaPrima=D.IdMP`;
  db.query(sql, (err, results) => {
    if (err) {
      return res.status(400).send(err);
    }
    res.status(200).send(results);
  });
});

//-----------------------cambiar estado-----------------
app.put("/confirmarCompra/:id", (req, res) => {
  const { id } = req.params;

  const sql = `UPDATE compras SET Estado=? WHERE IdCompra=${id}`;
  db.query(sql, ["completado"], (error, results) => {
    if (error) {
      return res.status(400).send(error);
    }
    res.status(200).send(results);
  });
});

app.put("/cancelarCompra/:id", (req, res) => {
  const { id } = req.params;

  const sql = `UPDATE compras SET Estado=? WHERE IdCompra=${id}`;
  db.query(sql, ["cancelado"], (error, results) => {
    if (error) {
      return res.status(400).send(error);
    }
    res.status(200).send(results);
  });
});

app.get("/buscarDate", (req, res) => {
  const sql =
    "SELECT s.CantPorMP,mp.Nombre FROM stock AS s, materiaprima AS mp WHERE mp.IdMateriaPrima=s.IdMateriaPrima";
  db.query(sql, (err, results) => {
    if (err) {
      return res.status(400).send(err);
    }
    res.status(200).send(results);
  });
});

app.get("/GraficoCantidad/:idMes/:idAnio", (req, res) => {
  const idMes = req.params.idMes;
  const idAnio = req.params.idAnio;

  const sql =
    "SELECT m.Nombre AS material, SUM(dc.CantMP) AS cantidad FROM detallescompras dc JOIN compras c ON dc.IdCompra = c.IdCompra JOIN materiaprima m ON dc.IdMP = m.IdMateriaPrima WHERE MONTH(c.Fecha) =? AND YEAR(c.Fecha) = ? GROUP BY m.Nombre";
  db.query(sql, [idMes, idAnio], (err, results) => {
    if (err) {
      return res.status(400).send(err);
    }
    res.status(200).send(results);
  });
});

app.get("/graficoAumentoXMP/:idMaterial/:idAnio", (req, res) => {
  const idMaterial = req.params.idMaterial;
  const idAnio = req.params.idAnio;
  const sql =
    "SELECT  dc.IdMP AS material, EXTRACT(YEAR FROM c.Fecha) AS año, EXTRACT(MONTH FROM c.Fecha) AS mes, AVG(dc.PrecioMP) AS precio_promedio_mensual FROM  compras  c  JOIN detallescompras dc ON c.IdCompra=dc.IdCompra WHERE  dc.IdMP = ? AND EXTRACT(YEAR FROM c.Fecha)=? GROUP BY  material,  EXTRACT(YEAR FROM c.Fecha),  EXTRACT(MONTH FROM c.Fecha) ORDER BY   año,   mes;";
  db.query(sql, [idMaterial, idAnio], (err, results) => {
    if (err) {
      return res.status(400).send(err);
    }
    res.status(200).send(results);
  });
});

app.get("/graficoTortaMP/:idMes", (req, res) => {
  const { idMes } = req.params;
  const sql =
    "SELECT dc.IdMP AS material,EXTRACT(YEAR FROM c.Fecha) AS año, EXTRACT(MONTH FROM c.Fecha) AS mes, AVG(dc.PrecioMP) AS precio_promedio_mensual FROM  compras c JOIN detallescompras dc ON c.IdCompra = dc.IdCompra WHERE EXTRACT(MONTH FROM c.Fecha) = ?  AND EXTRACT(YEAR FROM c.Fecha)  IN (YEAR(CURDATE()) - 1, YEAR(CURDATE()) - 2) GROUP BY material, año,mes ORDER BY material, año;";
  db.query(sql, [idMes], (err, results) => {
    if (err) {
      return res.status(400).send(err);
    }
    res.status(200).send(results);
  });
});

// app.get("/graficoTortaMP/:idMes/:idAnio", (req, res) => {
//   const idMes = req.params.idMes;
//   const idAnio = req.params.idAnio; // Obtén mes y año de los parámetros

//   const sql = `
//     SELECT
//       dc.IdMP AS material,
//       EXTRACT(YEAR FROM c.Fecha) AS año,
//       EXTRACT(MONTH FROM c.Fecha) AS mes,
//       AVG(dc.PrecioMP) AS precio_promedio_mensual
//     FROM
//       compras c
//     JOIN
//       detallescompras dc ON c.IdCompra = dc.IdCompra
//     WHERE
//       (EXTRACT(YEAR FROM c.Fecha) = ? AND EXTRACT(MONTH FROM c.Fecha) >= ?)
//       OR (EXTRACT(YEAR FROM c.Fecha) = ? + 1 AND EXTRACT(MONTH FROM c.Fecha) < ?)
//     GROUP BY
//       material, año, mes
//     ORDER BY
//       material, año;
//   `;
//   db.query(sql, [idAnio, idMes, idAnio, idMes], (err, results) => {
//     if (err) {
//       return res.status(400).send(err); // Manejo de errores
//     }
//     res.status(200).send(results); // Responde con los resultados
//   });
// });

app.get("/graficoTortaVentas/:idMes/:idAnio", (req, res) => {
  const idMes = req.params.idMes;
  const idAnio = req.params.idAnio;
  const sql =
    "SELECT p.Nombre AS nombre_producto, SUM(d.cantidad) AS cantidad_vendida,  (SELECT SUM(dv.cantidad) FROM detallesdeventa dv JOIN ventas ve ON dv.idventa = ve.IdVentas  WHERE EXTRACT(YEAR FROM ve.fechaVenta) = ? AND EXTRACT(MONTH FROM ve.fechaVenta) = ?AND ve.estado = 'completado') AS cantidad_total_mes FROM detallesdeventa d JOIN ventas v ON d.idventa = v.IdVentas JOIN producto p ON d.idproducto = p.IdProducto WHERE EXTRACT(YEAR FROM v.fechaVenta) = ? AND EXTRACT(MONTH FROM v.fechaVenta) = ? AND v.estado = 'completado' GROUP BY p.Nombre ORDER BY nombre_producto;";

  db.query(sql, [idAnio, idMes, idAnio, idMes], (err, results) => {
    if (err) {
      return res.status(400).send(err);
    }
    res.status(200).send(results);
  });
});

app.get("/graficoLinealVentas/:anio", (req, res) => {
  const { anio } = req.params;
  const sql =
    "SELECT EXTRACT(YEAR FROM v.fechaVenta) AS año,EXTRACT(MONTH FROM v.fechaVenta) AS mes,SUM(p.Precio * d.cantidad) AS precio_promedio_mensual FROM ventas v JOIN detallesdeventa d ON v.IdVentas = d.idventa JOIN producto p ON d.idproducto = p.IdProducto WHERE v.estado = 'completado' AND EXTRACT(YEAR FROM v.fechaVenta) = ? GROUP BY EXTRACT(YEAR FROM v.fechaVenta), EXTRACT(MONTH FROM v.fechaVenta) ORDER BY  año, mes;";

  db.query(sql, [anio], (err, result) => {
    if (err) {
      return res.status(400).send(err);
    }
    res.status(200).send(result);
  });
});

app.listen(port, () => {
  console.log("server ok");
});
